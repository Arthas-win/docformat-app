from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="University",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name="Faculty",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("university", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="faculties", to="templates.university")),
            ],
        ),
        migrations.CreateModel(
            name="Department",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("faculty", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="departments", to="templates.faculty")),
                ("university", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="departments", to="templates.university")),
            ],
        ),
        migrations.CreateModel(
            name="Teacher",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("full_name", models.CharField(max_length=255)),
                ("degree", models.CharField(blank=True, max_length=255)),
                ("gender", models.CharField(blank=True, max_length=30)),
                ("position", models.CharField(blank=True, max_length=255)),
                ("department", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="teachers", to="templates.department")),
            ],
        ),
        migrations.CreateModel(
            name="WorkType",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name="Discipline",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("is_custom", models.BooleanField(default=False)),
                ("department", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="disciplines", to="templates.department")),
            ],
        ),
        migrations.CreateModel(
            name="TitleTemplate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("language", models.CharField(default="ua", max_length=32)),
                ("version", models.CharField(blank=True, max_length=64)),
                ("template_filename", models.CharField(blank=True, max_length=255)),
                ("docx_template_file", models.FileField(blank=True, null=True, upload_to="title_templates/")),
                ("is_active", models.BooleanField(default=True)),
                ("rules_json", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("department", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="title_templates", to="templates.department")),
            ],
        ),
    ]
