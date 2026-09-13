import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from backend.agents.triage_agent import analyze_issue_triage, TriageResult
from backend.agents.duplicate_agent import generate_embedding
from backend import config

router = APIRouter(prefix="/api/issues", tags=["Issues"])

class TriageRequest(BaseModel):
    image_url: str
    title: str
    description: str

@router.post("/triage", response_model=TriageResult)
async def triage_issue(request: TriageRequest):
    try:
        result = await analyze_issue_triage(
            image_url=request.image_url,
            title=request.title,
            description=request.description
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class IssueCreateRequest(BaseModel):
    title: str
    description: str
    department: Optional[str] = None
    issue_type: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    lat: float
    lng: float
    media_images: List[str] = []
    reported_by: Optional[str] = None

class IssueCreateResponse(BaseModel):
    id: str
    message: str

@router.post("", response_model=IssueCreateResponse)
async def create_issue(request: IssueCreateRequest):
    if not config.supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    try:
        issue_id = str(uuid.uuid4())
        
        # 1. Insert Issue
        issue_data = {
            "id": issue_id,
            "title": request.title,
            "description": request.description,
            "department": request.department,
            "issue_type": request.issue_type,
            "address": request.address,
            "state": request.state,
            "city": request.city,
            "lat": request.lat,
            "lng": request.lng,
            "media_images": request.media_images,
        }
        if request.reported_by:
            issue_data["reported_by"] = request.reported_by

        config.supabase.table("issues").insert(issue_data).execute()

        # 2. Generate Embedding
        content_text = f"Title: {request.title}\nDescription: {request.description}"
        embedding = await generate_embedding(content_text)

        # 3. Insert Embedding
        embedding_id = str(uuid.uuid4())
        embedding_data = {
            "id": embedding_id,
            "issue_id": issue_id,
            "embedding": embedding,
            "content_text": content_text
        }
        config.supabase.table("issue_embeddings").insert(embedding_data).execute()

        return IssueCreateResponse(id=issue_id, message="Issue successfully created and indexed.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
