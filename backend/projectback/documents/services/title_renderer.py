import os
from io import BytesIO

from django.conf import settings
from docx.image.exceptions import UnrecognizedImageError
from docx.shared import Mm
from docxtpl import DocxTemplate, InlineImage


def render_title_docx(template_path, context, logo_path=None, output_name=None):
    if not template_path or not os.path.exists(template_path):
        raise FileNotFoundError("Template file not found.")

    doc = DocxTemplate(template_path)
    if logo_path and os.path.exists(logo_path):
        context = dict(context)
        try:
            context["logo"] = InlineImage(doc, logo_path, width=Mm(25))
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

    return output_path
