import shutil
import tempfile
from pathlib import Path

from django.core.files import File
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from documents.models import TitleDocumentJob
from templates.models import Department, Faculty, TitleTemplate, University


class TitleGenerateViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.temp_media_dir = tempfile.mkdtemp()
        self.override = override_settings(MEDIA_ROOT=self.temp_media_dir)
        self.override.enable()

        self.university = University.objects.create(name="Львівська політехніка")
        self.faculty = Faculty.objects.create(
            university=self.university,
            name="ІКТА",
        )
        self.department = Department.objects.create(
            university=self.university,
            faculty=self.faculty,
            name="БІТ",
        )

        template_source = Path(__file__).resolve().parent / "template" / "appback" / "template.docx"
        with template_source.open("rb") as template_file:
            self.template = TitleTemplate.objects.create(
                department=self.department,
                language="ukr",
                is_active=True,
            )
            self.template.docx_template_file.save(
                "template.docx",
                File(template_file),
                save=True,
            )

    def tearDown(self):
        self.override.disable()
        shutil.rmtree(self.temp_media_dir, ignore_errors=True)

    def test_generate_accepts_camel_case_frontend_payload(self):
        payload = {
            "university": "Львівська політехніка",
            "faculty": "ІКТА",
            "department": "БІТ",
            "workType": "до лабораторної роботи",
            "discipline": "Смішна",
            "topic": "Сміху",
            "variant": "4",
            "group": "КБ",
            "studentFullName": "М,І,Н",
            "teacherDegree": "агент",
            "teacherRole": "чай",
            "teacherName": "чайний агент",
            "cityAndYear": "Львів 2026",
            "language": "ukr",
            "pageNumbers": False,
        }

        response = self.client.post("/api/title/generate/", payload, format="json")

        self.assertEqual(response.status_code, 201)
        job = TitleDocumentJob.objects.get(id=response.data["job_id"])
        self.assertEqual(job.status, TitleDocumentJob.Status.DONE)
        self.assertTrue(job.output_docx.name.endswith(".docx"))
        self.assertEqual(job.input_data["work_type"], payload["workType"])
        self.assertEqual(job.input_data["student_full_name"], payload["studentFullName"])
        self.assertEqual(job.input_data["teacher"], payload["teacherName"])
        self.assertEqual(job.input_data["city_and_year"], payload["cityAndYear"])

    def test_generate_falls_back_to_local_template_when_db_template_is_missing(self):
        self.template.delete()
        payload = {
            "university": "Львівська політехніка",
            "faculty": "ІКТА",
            "department": "БІТ",
            "workType": "до лабораторної роботи",
            "discipline": "Смішна",
            "topic": "Сміху",
            "variant": "4",
            "group": "КБ",
            "studentFullName": "М,І,Н",
            "teacherDegree": "агент",
            "teacherRole": "чай",
            "teacherName": "чайний агент",
            "cityAndYear": "Львів 2026",
            "language": "ukr",
            "pageNumbers": False,
        }

        response = self.client.post("/api/title/generate/", payload, format="json")

        self.assertEqual(response.status_code, 201)
        job = TitleDocumentJob.objects.get(id=response.data["job_id"])
        self.assertEqual(job.status, TitleDocumentJob.Status.DONE)
        self.assertTrue(job.output_docx.name.endswith(".docx"))
