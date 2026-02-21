from django.http import FileResponse, Http404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from documents.models import DocumentJob, FormatPreset
from templates.models import Department, Discipline, Faculty, Teacher, University

from .serializers import (
    DepartmentSerializer,
    DisciplineSerializer,
    DocumentJobSerializer,
    FacultySerializer,
    FormatPresetSerializer,
    RegisterSerializer,
    TeacherSerializer,
    UniversitySerializer,
)


def _normalize_payload(data):
    if hasattr(data, "dict"):
        return data.dict()
    return data


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
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class FacultyListView(generics.ListAPIView):
    serializer_class = FacultySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Faculty.objects.all().order_by("name")
        university_id = self.request.query_params.get("university_id")
        if university_id:
            queryset = queryset.filter(university_id=university_id)
        return queryset


class DepartmentListView(generics.ListAPIView):
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Department.objects.all().order_by("name")
        faculty_id = self.request.query_params.get("faculty_id")
        university_id = self.request.query_params.get("university_id")
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
        department_id = self.request.query_params.get("department_id")
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(full_name__icontains=search)
        return queryset


class DisciplineListView(generics.ListAPIView):
    serializer_class = DisciplineSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Discipline.objects.all().order_by("name")
        department_id = self.request.query_params.get("department_id")
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class TitleGenerateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        job = DocumentJob.objects.create(
            user=request.user if request.user.is_authenticated else None,
            job_type=DocumentJob.JobType.TITLE,
            status=DocumentJob.Status.QUEUED,
            progress=0,
            current_stage="queued",
            meta_json=_normalize_payload(request.data),
        )
        return Response({"job_id": job.id}, status=status.HTTP_201_CREATED)


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
        job.meta_json = _normalize_payload(request.data)
        job.status = DocumentJob.Status.PROCESSING
        job.current_stage = "formatting"
        job.save(update_fields=["meta_json", "status", "current_stage"])
        return Response({"job_id": job.id})


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
        return Response(payload)


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
        return FileResponse(file_field.open("rb"), as_attachment=True)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )
