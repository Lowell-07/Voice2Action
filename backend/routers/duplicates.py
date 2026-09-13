from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from backend.agents.duplicate_agent import generate_embedding, check_duplicates

router = APIRouter(prefix="/api/issues", tags=["Duplicates"])

class DuplicateCheckRequest(BaseModel):
    title: str
    description: str
    lat: float
    lng: float

class DuplicateIssue(BaseModel):
    id: str
    issue_id: str
    content_text: str
    similarity: float

@router.post("/check-duplicate", response_model=List[DuplicateIssue])
async def check_duplicate_issue(request: DuplicateCheckRequest):
    try:
        content_text = f"Title: {request.title}\nDescription: {request.description}"
        embedding = await generate_embedding(content_text)
        
        duplicates = await check_duplicates(
            lat=request.lat, 
            lng=request.lng, 
            new_embedding=embedding
        )
        
        return duplicates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
