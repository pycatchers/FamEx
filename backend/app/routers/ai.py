from fastapi import APIRouter, Depends, HTTPException
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

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


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
    bill_date: str | None = None
    items: list[OCRBillItem] = []
    total_amount: float | None = None
    raw_text: str | None = None


@router.post("/ocr/bill", response_model=OCRBillResponse)
async def ocr_bill(
    data: OCRBillRequest,
    current_user: User = Depends(get_current_user),
):
    """Extract structured data from a shopping bill image using Gemini AI."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    try:
        result = await extract_bill_data(data.image_url, data.language)
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
            bill_date=result.get("bill_date"),
            items=items,
            total_amount=result.get("total_amount"),
        )
    except Exception as e:
        return OCRBillResponse(raw_text=f"Extraction failed: {str(e)}")


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
    timing: str | None = None


class OCRPrescriptionResponse(BaseModel):
    doctor_name: str | None = None
    hospital_name: str | None = None
    visit_date: str | None = None
    diagnosis: str | None = None
    medicines: list[OCRMedicine] = []
    follow_up_date: str | None = None
    raw_text: str | None = None


@router.post("/ocr/prescription", response_model=OCRPrescriptionResponse)
async def ocr_prescription(
    data: OCRPrescriptionRequest,
    current_user: User = Depends(get_current_user),
):
    """Extract structured data from a prescription image using Gemini AI."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    try:
        result = await extract_prescription_data(data.image_url, data.language)
        medicines = [
            OCRMedicine(
                name=med.get("name", "Unknown"),
                dosage=med.get("dosage"),
                frequency=med.get("frequency"),
                duration=med.get("duration"),
                timing=med.get("timing"),
            )
            for med in result.get("medicines", [])
        ]
        return OCRPrescriptionResponse(
            doctor_name=result.get("doctor_name"),
            hospital_name=result.get("hospital_name"),
            visit_date=result.get("visit_date"),
            diagnosis=result.get("diagnosis"),
            medicines=medicines,
            follow_up_date=result.get("follow_up_date"),
        )
    except Exception as e:
        return OCRPrescriptionResponse(raw_text=f"Extraction failed: {str(e)}")


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
