import base64
import json
import logging

import httpx

from app.config import settings


logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

def _clean_json_response(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        text = text.rsplit("```", 1)[0]
    return text.strip()


def _parse_json_response(text: str) -> dict:
    try:
        return json.loads(_clean_json_response(text))
    except json.JSONDecodeError:
        logger.error("Gemini returned malformed JSON (%d chars): %r", len(text), text[:2000])
        raise


ITEMS_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "items": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "item_name": {"type": "STRING"},
                    "quantity": {"type": "NUMBER", "nullable": True},
                    "unit": {"type": "STRING", "nullable": True},
                    "bought_price": {"type": "NUMBER", "nullable": True},
                },
                "required": ["item_name"],
            },
        },
    },
    "required": ["items"],
}


async def _fetch_remote_image(image_url: str) -> tuple[bytes, str]:
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(image_url, timeout=30.0)
            resp.raise_for_status()
        except httpx.RequestError as e:
            logger.error("Error fetching image from %s: %s", image_url, e)
            raise
    return resp.content, resp.headers.get("content-type", "image/jpeg")


async def call_gemini(
    prompt: str,
    image_bytes: bytes | None = None,
    image_mime_type: str = "image/jpeg",
    image_url: str | None = None,
    audio_bytes: bytes | None = None,
    audio_mime_type: str = "audio/m4a",
    response_schema: dict | None = None,
) -> str:
    """Call Gemini Flash API with a text prompt and an optional image or audio clip.

    Pass `image_bytes` for images uploaded to this server (the normal case
    for mobile apps). `image_url` is only for images already hosted at a
    public http(s) URL — never a device-local `file://` path. Pass
    `audio_bytes` for a recorded audio clip uploaded to this server.
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")

    parts = [{"text": prompt}]

    if audio_bytes is not None:
        audio_data = base64.b64encode(audio_bytes).decode("utf-8")
        parts.insert(0, {
            "inline_data": {"mime_type": audio_mime_type, "data": audio_data}
        })
    elif image_bytes is not None:
        img_data = base64.b64encode(image_bytes).decode("utf-8")
        parts.insert(0, {
            "inline_data": {"mime_type": image_mime_type, "data": img_data}
        })
    elif image_url:
        if not image_url.startswith(("http://", "https://")):
            raise ValueError(
                f"image_url '{image_url}' is not a fetchable http(s) URL. "
                "Upload the file to the server and pass its bytes via "
                "`image_bytes` instead."
            )
        content, content_type = await _fetch_remote_image(image_url)
        img_data = base64.b64encode(content).decode("utf-8")
        parts.insert(0, {
            "inline_data": {"mime_type": content_type, "data": img_data}
        })

    generation_config: dict = {
        "temperature": 0.1,
        "maxOutputTokens": 16384,
        "thinkingConfig": {"thinkingBudget": 0},
    }
    if response_schema is not None:
        generation_config["responseMimeType"] = "application/json"
        generation_config["responseSchema"] = response_schema

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": generation_config,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GEMINI_API_URL,
            headers={"x-goog-api-key": settings.GEMINI_API_KEY},
            json=payload,
            timeout=60.0,
        )
        response.raise_for_status()
        data = response.json()

    candidates = data.get("candidates", [])
    if not candidates:
        return ""
    if candidates[0].get("finishReason") == "MAX_TOKENS":
        logger.error("Gemini response truncated by MAX_TOKENS (maxOutputTokens=%s)", generation_config["maxOutputTokens"])
        raise ValueError("Gemini response was truncated (too long). Try a shorter recording or fewer items at once.")
    content_parts = candidates[0].get("content", {}).get("parts", [])
    return content_parts[0].get("text", "") if content_parts else ""


async def extract_bill_data(
    image_bytes: bytes,
    image_mime_type: str = "image/jpeg",
    language: str = "en",
) -> dict:
    lang_instruction = "The bill may be in Tamil." if language == "ta" else ""
    prompt = f"""Analyze this shopping bill/receipt image and extract structured data.
{lang_instruction}
Return a valid JSON object with these fields:
- "shop_name": string or null
- "shop_address": string or null (full address printed on the bill)
- "shop_phone": string or null (phone number on the bill)
- "shop_gstin": string or null (GST Identification Number, e.g. "29AABCT1332L1ZT")
- "bill_date": string in "YYYY-MM-DD" format or null
- "items": array of objects, each with:
  - "item_name": string
  - "quantity": number or null
  - "unit": string or null (kg, litre, piece, pack, etc.)
  - "mrp": number or null
  - "discount": number or null
  - "bought_price": number (final price paid for this item)
- "total_amount": number or null

Return ONLY the JSON, no markdown, no explanation."""

    text = await call_gemini(prompt, image_bytes=image_bytes, image_mime_type=image_mime_type)
    return _parse_json_response(text)


async def extract_prescription_data(
    image_bytes: bytes,
    image_mime_type: str = "image/jpeg",
    language: str = "en",
) -> dict:
    lang_instruction = "The prescription may be in Tamil." if language == "ta" else ""
    prompt = f"""Analyze this medical prescription or hospital bill image and extract structured data.
{lang_instruction}
Return a valid JSON object with these fields:
- "doctor_name": string or null
- "doctor_qualification": string or null (e.g. "MBBS, MD", "BDS", qualifications printed after the name)
- "doctor_registration_id": string or null (registration/license number printed on prescription)
- "hospital_name": string or null
- "hospital_address": string or null (full address of the hospital/clinic)
- "hospital_phone": string or null (phone number of the hospital/clinic)
- "visit_date": string in "YYYY-MM-DD" format or null
- "diagnosis": string or null
- "reason_for_visit": string or null (chief complaint or reason for the visit)
- "medicines": array of objects, each with:
  - "name": string
  - "dosage": string or null (e.g., "500mg")
  - "frequency": string or null (e.g., "twice daily")
  - "duration": string or null (e.g., "5 days")
  - "timing": string or null ("before_food", "after_food", or "with_food")
  - "morning": boolean
  - "afternoon": boolean
  - "night": boolean
- "follow_up_date": string in "YYYY-MM-DD" format or null

Return ONLY the JSON, no markdown, no explanation."""

    text = await call_gemini(prompt, image_bytes=image_bytes, image_mime_type=image_mime_type)
    return _parse_json_response(text)


async def extract_items_from_audio(
    audio_bytes: bytes,
    audio_mime_type: str = "audio/m4a",
    language: str = "en",
) -> dict:
    """Transcribe a recorded shopping list and convert it into structured items in one call."""
    lang_instruction = "The audio may be in Tamil; translate item names to English." if language == "ta" else ""
    prompt = f"""Listen to this audio recording of a spoken shopping list and extract structured items.
{lang_instruction}
Return a valid JSON object with:
- "items": array of objects, each with:
  - "item_name": string
  - "quantity": number or null
  - "unit": string or null
  - "bought_price": number or null

Return ONLY the JSON, no markdown, no explanation."""

    text = await call_gemini(
        prompt, audio_bytes=audio_bytes, audio_mime_type=audio_mime_type, response_schema=ITEMS_SCHEMA
    )
    return _parse_json_response(text)


async def extract_voice_to_items(text: str, language: str = "en") -> dict:
    """Convert voice-transcribed text into structured shopping items."""
    lang_instruction = "The text is in Tamil, translate item names to English." if language == "ta" else ""
    prompt = f"""Convert this spoken shopping list into structured items.
{lang_instruction}
Input text: "{text}"

Return a valid JSON object with:
- "items": array of objects, each with:
  - "item_name": string
  - "quantity": number or null
  - "unit": string or null
  - "bought_price": number or null

Return ONLY the JSON, no markdown, no explanation."""

    result = await call_gemini(prompt, response_schema=ITEMS_SCHEMA)
    return _parse_json_response(result)


async def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """Translate text between English and Tamil."""
    source = "Tamil" if source_lang == "ta" else "English"
    target = "Tamil" if target_lang == "ta" else "English"
    prompt = f"Translate the following text from {source} to {target}. Return only the translated text, nothing else.\n\nText: {text}"
    return await call_gemini(prompt)
