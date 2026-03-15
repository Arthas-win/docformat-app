import os
import tempfile
from io import BytesIO

from django.conf import settings
from docx.image.exceptions import UnrecognizedImageError
from docx.shared import Mm
from docxtpl import DocxTemplate, InlineImage


def render_title_docx(template_path, context, logo_path=None, output_name=None):
    if not template_path or not os.path.exists(template_path):
        raise FileNotFoundError("Template file not found.")

    doc = DocxTemplate(template_path)
    temp_logo_path = None
    if logo_path and os.path.exists(logo_path):
        context = dict(context)
        safe_logo_path = logo_path
        try:
            # Some valid browser images still fail in python-docx parser.
            # Re-encode to PNG to maximize compatibility.
            from PIL import Image

            with Image.open(logo_path) as source_img:
                converted = source_img.convert("RGBA")
                temp_logo_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
                converted.save(temp_logo_file, format="PNG")
                temp_logo_file.flush()
                temp_logo_file.close()
                temp_logo_path = temp_logo_file.name
                safe_logo_path = temp_logo_path
        except Exception:
            safe_logo_path = logo_path

        try:
            context["logo"] = InlineImage(doc, safe_logo_path, width=Mm(65))
        except UnrecognizedImageError:
            # Do not fail full title generation because of an unreadable logo file.
            pass

    doc.render(context)

    output = BytesIO()
    doc.save(output)
    output.seek(0)

    filename = output_name or "title.docx"
    output_dir = os.path.join(settings.MEDIA_ROOT, "title_jobs", "output")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, filename)

    with open(output_path, "wb") as target:
        target.write(output.read())

    if temp_logo_path and os.path.exists(temp_logo_path):
        os.remove(temp_logo_path)

    return output_path
