from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.models import UserProfile
from documents.models import DocumentJob, FormatPreset, TitleDocumentJob
from templates.models import Department, Discipline, Faculty, Teacher, University, WorkType


User = get_user_model()


class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = ["id", "name"]


class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ["id", "name", "university_id"]


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name", "university_id", "faculty_id"]


class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ["id", "full_name", "degree", "gender", "position", "department_id"]


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = ["id", "name", "department_id", "is_custom"]


class FormatPresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormatPreset
        fields = ["id", "name", "department_id", "settings_json"]


class DocumentJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentJob
        fields = [
            "id",
            "job_type",
            "status",
            "progress",
            "current_stage",
            "created_at",
            "finished_at",
        ]


class TitleGenerateSerializer(serializers.Serializer):
    university = serializers.CharField(max_length=255)
    faculty = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(max_length=255)
    work_type = serializers.CharField(max_length=255)
    discipline = serializers.CharField(required=False, allow_blank=True)
    discipline_custom = serializers.CharField(required=False, allow_blank=True)
    variant = serializers.CharField(required=False, allow_blank=True)
    topic = serializers.CharField(required=False, allow_blank=True)

    student_full_name = serializers.CharField(max_length=255)
    student_group = serializers.CharField(max_length=120)
    student_gender = serializers.CharField(required=False, allow_blank=True)
    year_or_semester = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)

    teacher = serializers.CharField(max_length=255)
    teacher_degree = serializers.CharField(required=False, allow_blank=True)
    teacher_gender = serializers.CharField(required=False, allow_blank=True)
    teacher_role = serializers.CharField(required=False, allow_blank=True)

    language = serializers.ChoiceField(choices=["ukr", "eng"])
    page_numbers = serializers.BooleanField(default=False)
    template_filename = serializers.CharField(required=False, allow_blank=True)

    logo = serializers.ImageField(required=False, allow_null=True)

    def validate(self, attrs):
        discipline = attrs.get("discipline")
        discipline_custom = attrs.get("discipline_custom")
        if not discipline and not discipline_custom:
            raise serializers.ValidationError("discipline or discipline_custom is required")
        return attrs


class TitleJobStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = TitleDocumentJob
        fields = ["id", "status", "progress", "created_at", "finished_at", "error_text"]


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(max_length=255)
    group = serializers.CharField(max_length=120, required=False, allow_blank=True)

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        UserProfile.objects.create(
            user=user,
            full_name=validated_data["full_name"],
            group=validated_data.get("group", ""),
        )
        return user
