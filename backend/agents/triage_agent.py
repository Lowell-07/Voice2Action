import os
import json
import httpx
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import Optional
from backend import config

api_key = os.getenv("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=api_key) if api_key else None

class TriageResult(BaseModel):
    is_valid: bool
    rejection_reason: Optional[str] = None
    suggested_department: Optional[str] = None
    severity: Optional[int] = None

system_instruction = """
You are a highly capable AI assistant for a civic issue reporting platform. 
Your job is to evaluate if the reported issue is a real civic issue.
- Check for selfies, memes, or inappropriate content.
- Verify if the description matches the provided image.
- Assign a severity score from 1 to 10 (1 = low priority, 10 = critical emergency).
- Suggest the appropriate government department (e.g., 'Sanitation', 'Roads', 'Water', 'Electricity').

You must respond with a valid JSON object matching this schema:
{
  "is_valid": boolean,
  "rejection_reason": string (if not valid, explain why),
  "suggested_department": string (if valid),
  "severity": integer (1-10)
}
"""

async def analyze_issue_triage(image_url: str, title: str, description: str) -> TriageResult:
    # Ideally, we would fetch the image bytes and pass them to the Gemini API.
    # If the URL is publicly accessible, we can fetch it, otherwise we just use the URL in the prompt.
    image_part = None
    if image_url.startswith("http"):
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(image_url, timeout=10.0)
                if resp.status_code == 200:
                    mime_type = resp.headers.get("content-type", "image/jpeg")
                    image_part = {
                        "mime_type": mime_type,
                        "data": resp.content
                    }
        except Exception:
            pass # Fallback to just sending the URL text
            
    if gemini_client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    
    prompt = f"Title: {title}\nDescription: {description}\n"
    if not image_part:
        prompt += f"Image URL: {image_url}\nPlease analyze this issue based on the provided text and URL."
        contents = [prompt]
    else:
        prompt += "Please analyze this issue based on the provided text and image."
        contents = [
            prompt,
            types.Part.from_bytes(
                data=image_part["data"],
                mime_type=image_part["mime_type"],
            ),
        ]
    
    response = await gemini_client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
        ),
    )
    
    try:
        data = json.loads(response.text)
        return TriageResult(**data)
    except Exception as e:
        return TriageResult(
            is_valid=False,
            rejection_reason=f"Failed to parse AI response: {str(e)}"
        )
