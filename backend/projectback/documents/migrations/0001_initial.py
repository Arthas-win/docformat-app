import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="DocumentJob",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("job_type", models.CharField(choices=[("TITLE", "Title"), ("FORMAT", "Format")], max_length=12)),
                ("status", models.CharField(choices=[("queued", "Queued"), ("processing", "Processing"), ("done", "Done"), ("failed", "Failed")], default="queued", max_length=16)),
                ("progress", models.PositiveSmallIntegerField(default=0)),
                ("current_stage", models.CharField(blank=True, max_length=64)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                ("input_file", models.FileField(blank=True, null=True, upload_to="jobs/input/")),
                ("output_docx", models.FileField(blank=True, null=True, upload_to="jobs/output/")),
                ("output_pdf", models.FileField(blank=True, null=True, upload_to="jobs/output/")),
                ("meta_json", models.JSONField(blank=True, default=dict)),
                ("changes_json", models.JSONField(blank=True, default=list)),
                ("error_text", models.TextField(blank=True)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="FormatPreset",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("settings_json", models.JSONField(blank=True, default=dict)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ("department", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="templates.department")),
            ],
        ),
        migrations.CreateModel(
            name="TitleDocumentJob",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("job_type", models.CharField(default="TITLE", max_length=16)),
                ("status", models.CharField(choices=[("PENDING", "Pending"), ("RUNNING", "Running"), ("DONE", "Done"), ("FAILED", "Failed")], default="PENDING", max_length=16)),
                ("progress", models.PositiveSmallIntegerField(default=0)),
                ("input_data", models.JSONField(blank=True, default=dict)),
                ("output_docx", models.FileField(blank=True, null=True, upload_to="title_jobs/output/")),
                ("output_pdf", models.FileField(blank=True, null=True, upload_to="title_jobs/output/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                ("error_text", models.TextField(blank=True)),
            ],
        ),
    ]
