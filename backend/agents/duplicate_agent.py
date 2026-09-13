import os
from backend import config
from google import genai
from google.genai import types

api_key = os.getenv("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=api_key) if api_key else None

async def generate_embedding(text: str) -> list[float]:
    """Generates a 768-dimensional text embedding using Gemini."""
    if gemini_client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    result = await gemini_client.aio.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
    )
    return result.embeddings[0].values

async def check_duplicates(lat: float, lng: float, new_embedding: list[float]) -> list[dict]:
    """Queries Supabase for duplicate issues within 500 meters with >0.85 similarity."""
    if not config.supabase:
        return []

    try:
        # Call the Supabase RPC function for vector similarity + distance search
        response = config.supabase.rpc(
            "match_issues",
            {
                "query_embedding": new_embedding,
                "match_threshold": 0.85,
                "match_count": 5,
                "p_lat": lat,
                "p_lng": lng,
                "radius_meters": 500
            }
        ).execute()
        return response.data
    except Exception as e:
        print(f"Error checking duplicates: {e}")
        return []
