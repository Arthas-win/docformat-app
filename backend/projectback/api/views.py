import os
import tempfile
from typing import Any, cast

from pathlib import Path

import logging

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files import File
from django.core.files.storage import default_storage
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from documents.models import DocumentJob, FormatPreset, TitleDocumentJob
from documents.services import format_docx_except_first_page, render_title_docx
from templates.models import Department, Discipline, Faculty, Teacher, TitleTemplate, University, WorkType

from .serializers import (
    DepartmentSerializer,
    DisciplineSerializer,
    DocumentJobSerializer,
    FacultySerializer,
    FormatPresetSerializer,
    RegisterSerializer,
    TeacherSerializer,
    TitleGenerateSerializer,
    TitleJobStatusSerializer,
    UniversitySerializer,
)

logger = logging.getLogger(__name__)


def _normalize_payload(data):
    if hasattr(data, "copy"):
        normalized = data.copy()
    else:
        normalized = dict(data)

    alias_map = {
        "workType": "work_type",
        "disciplineCustom": "discipline_custom",
        "studentFullName": "student_full_name",
        "studentGender": "student_gender",
        "yearOrSemester": "year_or_semester",
        "cityAndYear": "city_and_year",
        "teacherName": "teacher",
        "teacherDegree": "teacher_degree",
        "teacherGender": "teacher_gender",
        "teacherRole": "teacher_role",
        "pageNumbers": "page_numbers",
        "templateFilename": "template_filename",
        "group": "student_group",
    }
    for source_key, target_key in alias_map.items():
        if source_key in normalized and target_key not in normalized:
            normalized[target_key] = normalized[source_key]
    return normalized


def _run_document_format_job(job: DocumentJob, raw_data):
    payload = _normalize_payload(raw_data)
    output_format = str(payload.get("outputFormat", "docx")).lower()
    if output_format != "docx":
        raise ValueError("Only docx output is currently supported")

    font_family = str(payload.get("fontFamily", "Times New Roman"))
    try:
        font_size = float(payload.get("fontSize", 14))
    except (TypeError, ValueError):
        font_size = 14

    try:
        line_spacing = float(payload.get("lineSpacing", 1.5))
    except (TypeError, ValueError):
        line_spacing = 1.5

    page_numbers_raw = str(payload.get("pageNumbers", "true")).lower()
    page_numbers = page_numbers_raw in {"1", "true", "yes", "on"}

    job.meta_json = {
        "fontFamily": font_family,
        "fontSize": font_size,
        "lineSpacing": line_spacing,
        "pageNumbers": page_numbers,
        "outputFormat": output_format,
    }
    job.status = DocumentJob.Status.PROCESSING
    job.progress = 20
    job.current_stage = "formatting"
    job.error_text = ""
    job.finished_at = None
    job.save(
        update_fields=[
            "meta_json",
            "status",
            "progress",
            "current_stage",
            "error_text",
            "finished_at",
        ]
    )

    with job.input_file.open("rb") as source_file:
        output = format_docx_except_first_page(
            source_file,
            font_family=font_family,
            font_size=font_size,
            line_spacing=line_spacing,
            page_numbers=page_numbers,
        )

    source_name = Path(job.input_file.name).stem or "document"
    output_filename = f"{source_name}-formatted.docx"
    output_bytes = output.getvalue()
    if not output_bytes:
        raise ValueError("Formatted output is empty")
    job.output_docx.save(output_filename, ContentFile(output_bytes), save=False)
    job.status = DocumentJob.Status.DONE
    job.progress = 100
    job.current_stage = "done"
    job.finished_at = timezone.now()
    job.error_text = ""
    job.save(
        update_fields=[
            "output_docx",
            "status",
            "progress",
            "current_stage",
            "finished_at",
            "error_text",
        ]
    )
    return output_format


def _resolve_template_path(template, template_filename):
    candidate_paths = []
    default_template_path = Path(settings.BASE_DIR) / "appback" / "template" / "appback" / "template.docx"

    if template and template.docx_template_file:
        candidate_paths.append(Path(template.docx_template_file.path))
    if template and template.template_filename:
        candidate_paths.append(Path(settings.TITLE_TEMPLATE_DIR) / template.template_filename)
    if template_filename:
        candidate_paths.append(Path(settings.TITLE_TEMPLATE_DIR) / template_filename)

    fallback_dir = Path(settings.BASE_DIR) / "appback" / "template" / "appback"
    if template and template.template_filename:
        candidate_paths.append(fallback_dir / template.template_filename)
    if template_filename:
        candidate_paths.append(fallback_dir / template_filename)
    candidate_paths.append(default_template_path)

    for path in candidate_paths:
        if path and path.exists():
            return str(path)
    return ""


class StatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        title_jobs = DocumentJob.objects.filter(job_type=DocumentJob.JobType.TITLE).count()
        payload = {
            "generated_titles": title_jobs,
            "hours_saved": title_jobs,
        }
        return Response(payload)


class ReviewsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(
            [
                {"author": "Student A", "text": "Generated a title page in minutes."},
                {"author": "Student B", "text": "Formatting took just a few clicks."},
            ]
        )


class UniversityListView(generics.ListAPIView):
    serializer_class = UniversitySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = University.objects.all().order_by("name")
        request = cast(Request, self.request)
        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class FacultyListView(generics.ListAPIView):
    serializer_class = FacultySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Faculty.objects.all().order_by("name")
        request = cast(Request, self.request)
        university_id = request.query_params.get("university_id")
        if university_id:
            queryset = queryset.filter(university_id=university_id)
        return queryset


class DepartmentListView(generics.ListAPIView):
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Department.objects.all().order_by("name")
        request = cast(Request, self.request)
        faculty_id = request.query_params.get("faculty_id")
        university_id = request.query_params.get("university_id")
        if faculty_id:
            queryset = queryset.filter(faculty_id=faculty_id)
        if university_id:
            queryset = queryset.filter(university_id=university_id)
        return queryset


class TeacherListView(generics.ListAPIView):
    serializer_class = TeacherSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Teacher.objects.all().order_by("full_name")
        request = cast(Request, self.request)
        department_id = request.query_params.get("department_id")
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(full_name__icontains=search)
        return queryset


class DisciplineListView(generics.ListAPIView):
    serializer_class = DisciplineSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Discipline.objects.all().order_by("name")
        request = cast(Request, self.request)
        department_id = request.query_params.get("department_id")
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class TitleGenerateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TitleGenerateSerializer(data=_normalize_payload(request.data))
        serializer.is_valid(raise_exception=True)
        data = cast(dict[str, Any], serializer.validated_data)

        logo_file = data.pop("logo", None)
        input_data = dict(data)
        temporary_paths = []

        job = TitleDocumentJob.objects.create(
            status=TitleDocumentJob.Status.RUNNING,
            progress=5,
            input_data=input_data,
        )

        logo_path = None

        try:
            if logo_file:
                logo_name = f"title_jobs/logos/{job.id}_{logo_file.name}"
                saved_path = default_storage.save(logo_name, logo_file)
                try:
                    logo_path = default_storage.path(saved_path)
                except (NotImplementedError, AttributeError):
                    # Some storages do not expose a filesystem path. Create a temp local file.
                    with default_storage.open(saved_path, "rb") as stored_logo:
                        suffix = Path(logo_file.name).suffix or ".bin"
                        temp_logo = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                        temp_logo.write(stored_logo.read())
                        temp_logo.flush()
                        temp_logo.close()
                        logo_path = temp_logo.name
                        temporary_paths.append(logo_path)

            discipline_name = data.get("discipline") or data.get("discipline_custom", "")
            teacher_rank = " ".join(
                value for value in [data.get("teacher_role", ""), data.get("teacher_degree", "")] if value
            )

            language = data["language"]
            template_filename = data.get("template_filename", "")
            template = (
                TitleTemplate.objects.filter(
                    department__name=data["department"], language=language, is_active=True
                )
                .order_by("-created_at")
                .first()
            )
            template_path = _resolve_template_path(template, template_filename)
            if not template_path:
                raise FileNotFoundError("Template file is not configured.")

            student_label = " ".join(
                value for value in [data.get("student_group", ""), data["student_full_name"]] if value
            )
            teacher_label = " ".join(value for value in [data["teacher"], teacher_rank] if value)
            city_year = data.get("city_and_year", "").strip()
            if not city_year:
                city_year_parts = [data.get("city", ""), data.get("year_or_semester", "")]
                city_year = " ".join(part for part in city_year_parts if part).strip()

            context = {
                "university": data["university"],
                "faculty": data.get("faculty", ""),
                "department": data["department"],
                "work_type": data["work_type"],
                "discipline": discipline_name,
                "topic": data.get("topic", ""),
                "variant": data.get("variant", ""),
                "student_group": data.get("student_group", ""),
                "student_full_name": data["student_full_name"],
                "teacher_degree": data.get("teacher_degree", ""),
                "teacher_role": data.get("teacher_role", ""),
                "teacher": data["teacher"],
                "city_and_year": city_year,
                # Backward-compatible keys
                "unuvers": data["university"],
                "institut": data.get("faculty", ""),
                "cafedra": data["department"],
                "type_robota": data["work_type"],
                "name_dusp": discipline_name,
                "var_numb": data.get("variant", ""),
                "student_name_andgroup": student_label,
                "tea_name_and_rank": teacher_label,
            }

            try:
                output_path = render_title_docx(
                    template_path,
                    context,
                    logo_path=logo_path,
                    output_name=f"{job.id}.docx",
                )
            except LogoRenderError:
                if not logo_path:
                    raise
                # Only retry without logo for logo-specific errors
                logger.warning("Logo render failed for job %s, retrying without logo", job.id)
                output_path = render_title_docx(
                    template_path,
                    context,
                    logo_path=None,
                    output_name=f"{job.id}.docx",
                )
            except Exception:
                # For any other error, fail immediately without degrading silently
                raise

            with open(output_path, "rb") as docx_file:
                job.output_docx.save(os.path.basename(output_path), File(docx_file), save=False)
            job.status = TitleDocumentJob.Status.DONE
            job.progress = 100
            job.finished_at = timezone.now()
            job.save(update_fields=["output_docx", "status", "progress", "finished_at"])
        except Exception as exc:
            job.status = TitleDocumentJob.Status.FAILED
            logger.exception("Title generation failed for job %s", job.id)
            error_text = str(exc).strip() or exc.__class__.__name__
            job.error_text = error_text
            job.finished_at = timezone.now()
            job.save(update_fields=["status", "error_text", "finished_at"])
        finally:
            for temporary_path in temporary_paths:
                try:
                    os.remove(temporary_path)
                except OSError:
                    pass

        if job.status == TitleDocumentJob.Status.FAILED:
            error_detail = job.error_text or "Job failed during processing"
            return Response(
                {"detail": error_detail},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        response = {"job_id": str(job.id)}
        if job.output_docx:
            response["file_url"] = job.output_docx.url
        return Response(response, status=status.HTTP_201_CREATED)


class FormatUploadView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "file is required"}, status=status.HTTP_400_BAD_REQUEST)
        job = DocumentJob.objects.create(
            user=request.user if request.user.is_authenticated else None,
            job_type=DocumentJob.JobType.FORMAT,
            status=DocumentJob.Status.QUEUED,
            progress=0,
            current_stage="queued",
            input_file=upload,
        )
        try:
            _run_document_format_job(job, request.data)
        except Exception as exc:
            logger.exception("Document format failed for job %s", job.id)
            job.status = DocumentJob.Status.FAILED
            job.progress = 5
            job.current_stage = "failed"
            job.finished_at = timezone.now()
            job.error_text = str(exc) or exc.__class__.__name__
            job.save(
                update_fields=[
                    "status",
                    "progress",
                    "current_stage",
                    "finished_at",
                    "error_text",
                ]
            )
        return Response({"job_id": job.id}, status=status.HTTP_201_CREATED)


class FormatRunView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        job_id = request.data.get("job_id")
        if not job_id:
            return Response({"detail": "job_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            job = DocumentJob.objects.get(id=job_id)
        except DocumentJob.DoesNotExist:
            return Response({"detail": "job not found"}, status=status.HTTP_404_NOT_FOUND)
        if not job.input_file:
            return Response({"detail": "job input file not found"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            _run_document_format_job(job, request.data)
        except Exception as exc:
            logger.exception("Document format failed for job %s", job.id)
            job.status = DocumentJob.Status.FAILED
            job.progress = 5
            job.current_stage = "failed"
            job.finished_at = timezone.now()
            job.error_text = str(exc) or exc.__class__.__name__
            job.save(
                update_fields=[
                    "status",
                    "progress",
                    "current_stage",
                    "finished_at",
                    "error_text",
                ]
            )
            return Response({"job_id": job.id, "detail": job.error_text}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"job_id": job.id})


class DocumentFormatView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "file is required"}, status=status.HTTP_400_BAD_REQUEST)

        output_format = str(request.data.get("outputFormat", "docx")).lower()
        if output_format != "docx":
            return Response(
                {"detail": "Only docx output is currently supported"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        font_family = str(request.data.get("fontFamily", "Times New Roman"))
        try:
            font_size = float(request.data.get("fontSize", 14))
        except (TypeError, ValueError):
            font_size = 14

        try:
            line_spacing = float(request.data.get("lineSpacing", 1.5))
        except (TypeError, ValueError):
            line_spacing = 1.5

        page_numbers_raw = str(request.data.get("pageNumbers", "true")).lower()
        page_numbers = page_numbers_raw in {"1", "true", "yes", "on"}

        try:
            output = format_docx_except_first_page(
                upload,
                font_family=font_family,
                font_size=font_size,
                line_spacing=line_spacing,
                page_numbers=page_numbers,
            )
        except Exception:
            logger.exception("Document format failed")
            return Response(
                {"detail": "Failed to format document"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        source_name = Path(upload.name).stem or "document"
        filename = f"formatted-{source_name}.docx"
        response = FileResponse(
            output,
            as_attachment=True,
            filename=filename,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        return response


class PresetListView(generics.ListAPIView):
    serializer_class = FormatPresetSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return FormatPreset.objects.all().order_by("name")


class JobDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, job_id: int):
        try:
            job = DocumentJob.objects.get(id=job_id)
        except DocumentJob.DoesNotExist:
            raise Http404("job not found")
        serializer = DocumentJobSerializer(job)
        payload = dict(serializer.data)
        payload["error"] = job.error_text
        payload["file_url"] = job.output_docx.url if job.output_docx else ""
        return Response(payload)


class TitleJobDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, job_id):
        try:
            job = TitleDocumentJob.objects.get(id=job_id)
        except TitleDocumentJob.DoesNotExist:
            raise Http404("job not found")
        serializer = TitleJobStatusSerializer(job)
        return Response(serializer.data)


class JobDiffView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, job_id: int):
        try:
            job = DocumentJob.objects.get(id=job_id)
        except DocumentJob.DoesNotExist:
            raise Http404("job not found")
        return Response(job.changes_json or [])


class JobDownloadView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, job_id: int):
        try:
            job = DocumentJob.objects.get(id=job_id)
        except DocumentJob.DoesNotExist:
            raise Http404("job not found")
        format_value = request.query_params.get("format")
        file_field = None
        if format_value == "docx":
            file_field = job.output_docx
        elif format_value == "pdf":
            file_field = job.output_pdf
        if not file_field:
            raise Http404("file not available")
        try:
            return FileResponse(file_field.open("rb"), as_attachment=True)
        except FileNotFoundError as exc:
            raise Http404("file not available") from exc


class TitleJobDownloadView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, job_id):
        try:
            job = TitleDocumentJob.objects.get(id=job_id)
        except TitleDocumentJob.DoesNotExist:
            raise Http404("job not found")
        format_value = request.query_params.get("format", "docx")
        file_field = None
        if format_value == "docx":
            file_field = job.output_docx
        elif format_value == "pdf":
            file_field = job.output_pdf
        if not file_field:
            raise Http404("file not available")
        return FileResponse(file_field.open("rb"), as_attachment=True)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = cast(Any, serializer.save())
        refresh = cast(Any, RefreshToken.for_user(user))
        return Response(
            {
                "id": user.pk,
                "username": user.username,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )
