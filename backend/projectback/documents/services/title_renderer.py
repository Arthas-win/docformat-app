import os
import tempfile
import re
import logging
from io import BytesIO

from django.conf import settings
from docx.image.exceptions import UnrecognizedImageError
from docx.shared import Mm
from docxtpl import DocxTemplate, InlineImage

logger = logging.getLogger(__name__)


class LogoRenderError(Exception):
    """Exception raised when logo rendering fails."""
    pass


class UnfilledPlaceholderError(Exception):
    """Exception raised when placeholders remain unfilled."""
    pass


def validate_placeholders_filled(context):
    """
    Validate that no placeholder-like values remain in the context
    """
    unfilled_fields = []
    for key, value in context.items():
        if isinstance(value, str):
            # Check for common unfilled placeholder patterns
            if re.search(r'\{\{.*?\}\}', value):
                unfilled_fields.append(f"{key}: {value}")
    
    if unfilled_fields:
        logger.warning(f"Unfilled placeholders found: {unfilled_fields}")
        return False, unfilled_fields
    return True, []


def validate_docx_for_placeholders(docx_bytes):
    """
    Validate the generated DOCX for any remaining placeholders by checking all XML content
    """
    import zipfile
    
    # Extract all XML files from the DOCX and check for placeholder patterns
    with zipfile.ZipFile(BytesIO(docx_bytes), 'r') as docx_zip:
        # Check all XML files in the word/ directory
        xml_files = [f for f in docx_zip.namelist() if f.startswith('word/') and f.endswith('.xml')]
        
        for xml_file in xml_files:
            content = docx_zip.read(xml_file)
            # Check for any remaining placeholder patterns
            if b'{{' in content or b'}}' in content:
                logger.warning(f"Unfilled placeholders found in {xml_file}")
                return False
    return True


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
                # Convert to RGB if necessary to avoid transparency issues
                if source_img.mode in ('RGBA', 'LA', 'P'):
                    # Create a white background
                    background = Image.new('RGB', source_img.size, (255, 255, 255))
                    if source_img.mode == 'P':
                        source_img = source_img.convert('RGBA')
                    background.paste(source_img, mask=source_img.split()[-1] if source_img.mode in ('RGBA', 'LA') else None)
                    converted = background
                else:
                    converted = source_img.convert("RGB")
                    
                temp_logo_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
                converted.save(temp_logo_file, format="PNG")
                temp_logo_file.flush()
                temp_logo_file.close()
                temp_logo_path = temp_logo_file.name
                safe_logo_path = temp_logo_path
        except Exception as e:
            # Log the error and raise exception instead of falling back
            logger.error(f"Logo conversion failed: {e}")
            if temp_logo_path and os.path.exists(temp_logo_path):
                os.remove(temp_logo_path)
            raise LogoRenderError(f"Failed to convert logo: {e}") from e

        try:
            # Use fixed dimensions for consistent logo placement (45mm width for better page fit)
            # The height will be automatically calculated to maintain aspect ratio
            context["logo"] = InlineImage(doc, safe_logo_path, width=Mm(45))
        except UnrecognizedImageError as e:
            # Do not silently pass - raise an exception for logo rendering failures
            logger.error("Logo recognition failed")
            if temp_logo_path and os.path.exists(temp_logo_path):
                os.remove(temp_logo_path)
            raise LogoRenderError(f"Failed to recognize logo image: {e}") from e
        except Exception as e:
            # Catch any other image-related errors
            logger.error(f"Unexpected error with logo: {e}")
            if temp_logo_path and os.path.exists(temp_logo_path):
                os.remove(temp_logo_path)
            raise LogoRenderError(f"Unexpected error during logo insertion: {e}") from e

    # Before rendering, ensure all placeholders are properly filled
    # Replace any missing values to prevent raw placeholders in output
    for key, value in context.items():
        if value is None:
            context[key] = ""

    doc.render(context)

    output = BytesIO()
    doc.save(output)
    output.seek(0)

    # Validate the document for remaining placeholders
    if not validate_docx_for_placeholders(output.getvalue()):
        output.seek(0)  # Reset buffer position
        is_valid, unfilled_fields = validate_placeholders_filled(context)
        if not is_valid:
            raise UnfilledPlaceholderError(f"Document contains unfilled placeholders: {unfilled_fields}")

    filename = output_name or "title.docx"
    output_dir = os.path.join(settings.MEDIA_ROOT, "title_jobs", "output")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, filename)

    with open(output_path, "wb") as target:
        target.write(output.getvalue())

    if temp_logo_path and os.path.exists(temp_logo_path):
        os.remove(temp_logo_path)

    return output_path
