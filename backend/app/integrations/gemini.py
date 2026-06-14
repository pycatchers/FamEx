import base64
import json

import httpx

from app.config import settings


GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


async def call_gemini(prompt: str, image_url: str | None = None) -> str:
    """Call Gemini Flash API with text prompt and optional image URL."""
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")

    parts = [{"text": prompt}]

    if image_url:
        async with httpx.AsyncClient() as client:
            img_response = await client.get(image_url, timeout=30.0)
            img_response.raise_for_status()
            img_data = base64.b64encode(img_response.content).decode("utf-8")
            content_type = img_response.headers.get("content-type", "image/jpeg")
            parts.insert(0, {
                "inline_data": {
                    "mime_type": content_type,
                    "data": img_data,
                }
            })

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 4096,
        },
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{GEMINI_API_URL}?key={settings.GEMINI_API_KEY}",
            json=payload,
            timeout=60.0,
        )
        response.raise_for_status()
        data = response.json()

    candidates = data.get("candidates", [])
    if not candidates:
        return ""
    content_parts = candidates[0].get("content", {}).get("parts", [])
    return content_parts[0].get("text", "") if content_parts else ""


async def extract_bill_data(image_url: str, language: str = "en") -> dict:
    """Extract structured bill data from an image."""
    lang_instruction = "The bill may be in Tamil." if language == "ta" else ""
    prompt = f"""Analyze this shopping bill/receipt image and extract structured data.
{lang_instruction}
Return a valid JSON object with these fields:
- "shop_name": string or null
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

    text = await call_gemini(prompt, image_url)
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        text = text.rsplit("```", 1)[0]
    return json.loads(text)


async def extract_prescription_data(image_url: str, language: str = "en") -> dict:
    """Extract structured prescription data from an image."""
    lang_instruction = "The prescription may be in Tamil." if language == "ta" else ""
    prompt = f"""Analyze this medical prescription image and extract structured data.
{lang_instruction}
Return a valid JSON object with these fields:
- "doctor_name": string or null
- "hospital_name": string or null
- "visit_date": string in "YYYY-MM-DD" format or null
- "diagnosis": string or null
- "medicines": array of objects, each with:
  - "name": string
  - "dosage": string or null (e.g., "500mg")
  - "frequency": string or null (e.g., "twice daily")
  - "duration": string or null (e.g., "5 days")
  - "timing": string or null (e.g., "after food")
- "follow_up_date": string in "YYYY-MM-DD" format or null

Return ONLY the JSON, no markdown, no explanation."""

    text = await call_gemini(prompt, image_url)
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        text = text.rsplit("```", 1)[0]
    return json.loads(text)


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

    result = await call_gemini(prompt)
    result = result.strip()
    if result.startswith("```"):
        result = result.split("\n", 1)[1] if "\n" in result else result[3:]
        result = result.rsplit("```", 1)[0]
    return json.loads(result)


async def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """Translate text between English and Tamil."""
    source = "Tamil" if source_lang == "ta" else "English"
    target = "Tamil" if target_lang == "ta" else "English"
    prompt = f"Translate the following text from {source} to {target}. Return only the translated text, nothing else.\n\nText: {text}"
    return await call_gemini(prompt)
