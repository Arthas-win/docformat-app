from django.db import models


class University(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self) -> str:
        return self.name


class Faculty(models.Model):
    university = models.ForeignKey(
        University, on_delete=models.CASCADE, related_name="faculties"
    )
    name = models.CharField(max_length=255)

    def __str__(self) -> str:
        return self.name


class Department(models.Model):
    university = models.ForeignKey(
        University, on_delete=models.CASCADE, related_name="departments"
    )
    faculty = models.ForeignKey(
        Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name="departments"
    )
    name = models.CharField(max_length=255)

    def __str__(self) -> str:
        return self.name


class Teacher(models.Model):
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name="teachers"
    )
    full_name = models.CharField(max_length=255)
    degree = models.CharField(max_length=255, blank=True)
    gender = models.CharField(max_length=30, blank=True)
    position = models.CharField(max_length=255, blank=True)

    def __str__(self) -> str:
        return self.full_name


class WorkType(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self) -> str:
        return self.name


class Discipline(models.Model):
    name = models.CharField(max_length=255)
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="disciplines"
    )
    is_custom = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.name


class TitleTemplate(models.Model):
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name="title_templates"
    )
    language = models.CharField(max_length=32, default="ua")
    version = models.CharField(max_length=64, blank=True)
    docx_template_file = models.FileField(upload_to="title_templates/")
    is_active = models.BooleanField(default=True)
    rules_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.department} {self.language} {self.version}"
