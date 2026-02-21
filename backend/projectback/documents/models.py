import uuid

from django.conf import settings
from django.db import models


class DocumentJob(models.Model):
    class JobType(models.TextChoices):
        TITLE = "TITLE", "Title"
        FORMAT = "FORMAT", "Format"

    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        PROCESSING = "processing", "Processing"
        DONE = "done", "Done"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    job_type = models.CharField(max_length=12, choices=JobType.choices)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.QUEUED)
    progress = models.PositiveSmallIntegerField(default=0)
    current_stage = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    input_file = models.FileField(upload_to="jobs/input/", null=True, blank=True)
    output_docx = models.FileField(upload_to="jobs/output/", null=True, blank=True)
    output_pdf = models.FileField(upload_to="jobs/output/", null=True, blank=True)
    meta_json = models.JSONField(default=dict, blank=True)
    changes_json = models.JSONField(default=list, blank=True)
    error_text = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"{self.job_type} #{self.pk}"


class FormatPreset(models.Model):
    name = models.CharField(max_length=255)
    department = models.ForeignKey(
        "templates.Department", on_delete=models.SET_NULL, null=True, blank=True
    )
    settings_json = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    def __str__(self) -> str:
        return self.name


class TitleDocumentJob(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        RUNNING = "RUNNING", "Running"
        DONE = "DONE", "Done"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_type = models.CharField(max_length=16, default="TITLE")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    progress = models.PositiveSmallIntegerField(default=0)
    input_data = models.JSONField(default=dict, blank=True)
    output_docx = models.FileField(upload_to="title_jobs/output/", null=True, blank=True)
    output_pdf = models.FileField(upload_to="title_jobs/output/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    error_text = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"TITLE {self.id}"
