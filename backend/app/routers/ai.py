import logging
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.models.user import User
from app.config import settings
from app.integrations.gemini import (
    extract_bill_data,
    extract_prescription_data,
    extract_voice_to_items,
    translate_text,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"}

# ---------------------------------------------------------------------------
# Bill OCR
# ---------------------------------------------------------------------------

class OCRBillRequest(BaseModel):
    image_url: str
    language: str = "en"


class OCRBillItem(BaseModel):
    item_name: str
    quantity: float | None = None
    unit: str | None = None
    mrp: float | None = None
    discount: float | None = None
    bought_price: float


class OCRBillResponse(BaseModel):
    shop_name: str | None = None
    shop_address: str | None = None
    shop_phone: str | None = None
    shop_gstin: str | None = None
    bill_date: str | None = None
    items: list[OCRBillItem] = []
    total_amount: float | None = None
    raw_text: str | None = None


@router.post("/ocr/bill", response_model=OCRBillResponse)
async def ocr_bill(
    file: UploadFile = File(...),
    language: str = Form("en"),
    current_user: User = Depends(get_current_user),
):
    """Extract structured data from a shopping bill image using Gemini AI."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        result = await extract_bill_data(
            image_bytes=image_bytes,
            image_mime_type=file.content_type,
            language=language,
        )
        logger.debug("OCR bill result: %s", result)

        items = [
            OCRBillItem(
                item_name=item.get("item_name", "Unknown"),
                quantity=item.get("quantity"),
                unit=item.get("unit"),
                mrp=item.get("mrp"),
                discount=item.get("discount"),
                bought_price=item.get("bought_price", 0),
            )
            for item in result.get("items", [])
        ]

        return OCRBillResponse(
            shop_name=result.get("shop_name"),
            shop_address=result.get("shop_address"),
            shop_phone=result.get("shop_phone"),
            shop_gstin=result.get("shop_gstin"),
            bill_date=result.get("bill_date"),
            items=items,
            total_amount=result.get("total_amount"),
        )
    except Exception:
        logger.exception("OCR bill extraction failed")
        return OCRBillResponse(raw_text="Extraction failed. Please try again with a clearer photo.")

# ---------------------------------------------------------------------------
# Prescription OCR
# ---------------------------------------------------------------------------

class OCRPrescriptionRequest(BaseModel):
    image_url: str
    language: str = "en"


class OCRMedicine(BaseModel):
    name: str
    dosage: str | None = None
    frequency: str | None = None
    duration: str | None = None
    timing: str | None = None  # "before_food" | "after_food" | "with_food"
    morning: bool = False
    afternoon: bool = False
    night: bool = False


class OCRPrescriptionResponse(BaseModel):
    doctor_name: str | None = None
    doctor_qualification: str | None = None
    doctor_registration_id: str | None = None
    hospital_name: str | None = None
    hospital_address: str | None = None
    hospital_phone: str | None = None
    visit_date: str | None = None
    diagnosis: str | None = None
    reason_for_visit: str | None = None
    medicines: list[OCRMedicine] = []
    follow_up_date: str | None = None
    raw_text: str | None = None


def _parse_timing(raw: str | None) -> str | None:
    if not raw:
        return None
    r = raw.lower()
    if "before" in r:
        return "before_food"
    if "with" in r:
        return "with_food"
    if "after" in r:
        return "after_food"
    return None


@router.post("/ocr/prescription", response_model=OCRPrescriptionResponse)
async def ocr_prescription(
    file: UploadFile = File(...),
    language: str = Form("en"),
    current_user: User = Depends(get_current_user),
):
    """Extract structured data from a prescription image using Gemini AI."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        result = await extract_prescription_data(
            image_bytes=image_bytes,
            image_mime_type=file.content_type,
            language=language,
        )
        medicines = [
            OCRMedicine(
                name=med.get("name", "Unknown"),
                dosage=med.get("dosage"),
                frequency=med.get("frequency"),
                duration=med.get("duration"),
                timing=_parse_timing(med.get("timing")),
                morning=bool(med.get("morning", False)),
                afternoon=bool(med.get("afternoon", False)),
                night=bool(med.get("night", False)),
            )
            for med in result.get("medicines", [])
        ]
        return OCRPrescriptionResponse(
            doctor_name=result.get("doctor_name"),
            doctor_qualification=result.get("doctor_qualification"),
            doctor_registration_id=result.get("doctor_registration_id"),
            hospital_name=result.get("hospital_name"),
            hospital_address=result.get("hospital_address"),
            hospital_phone=result.get("hospital_phone"),
            visit_date=result.get("visit_date"),
            diagnosis=result.get("diagnosis"),
            reason_for_visit=result.get("reason_for_visit"),
            medicines=medicines,
            follow_up_date=result.get("follow_up_date"),
        )
    except Exception:
        logger.exception("OCR prescription extraction failed")
        return OCRPrescriptionResponse(raw_text="Extraction failed. Please try again with a clearer photo.")


# ---------------------------------------------------------------------------
# Voice to Items
# ---------------------------------------------------------------------------

class VoiceToItemsRequest(BaseModel):
    text: str
    language: str = "en"


class VoiceItem(BaseModel):
    item_name: str
    quantity: float | None = None
    unit: str | None = None
    bought_price: float | None = None


class VoiceToItemsResponse(BaseModel):
    items: list[VoiceItem] = []
    raw_text: str | None = None


@router.post("/voice/items", response_model=VoiceToItemsResponse)
async def voice_to_items(
    data: VoiceToItemsRequest,
    current_user: User = Depends(get_current_user),
):
    """Convert voice-transcribed text into structured shopping items."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    try:
        result = await extract_voice_to_items(data.text, data.language)
        items = [
            VoiceItem(
                item_name=item.get("item_name", "Unknown"),
                quantity=item.get("quantity"),
                unit=item.get("unit"),
                bought_price=item.get("bought_price"),
            )
            for item in result.get("items", [])
        ]
        return VoiceToItemsResponse(items=items)
    except Exception as e:
        return VoiceToItemsResponse(raw_text=f"Extraction failed: {str(e)}")


# ---------------------------------------------------------------------------
# Translation
# ---------------------------------------------------------------------------

class TranslateRequest(BaseModel):
    text: str
    source_lang: str = "en"
    target_lang: str = "ta"


class TranslateResponse(BaseModel):
    translated_text: str
    source_lang: str
    target_lang: str


@router.post("/translate", response_model=TranslateResponse)
async def translate(
    data: TranslateRequest,
    current_user: User = Depends(get_current_user),
):
    """Translate text between English and Tamil."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    try:
        translated = await translate_text(data.text, data.source_lang, data.target_lang)
        return TranslateResponse(
            translated_text=translated,
            source_lang=data.source_lang,
            target_lang=data.target_lang,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
