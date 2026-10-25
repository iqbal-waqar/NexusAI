from fastapi import APIRouter, HTTPException
from backend.schemas.chat import ChatRequest, ChatResponse
from backend.services.chat import ChatService

router = APIRouter()
chat_service = ChatService()
@router.post("/chat", response_model=ChatResponse)
async def chat_with_csv(request: ChatRequest):
    """
    Chat endpoint that uses the last uploaded CSV as context.
    """
    try:
        # Convert pydantic models to dicts if needed by service
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.history]
        result = await chat_service.chat(request.message, history_dicts)
        return ChatResponse(response=result["response"], status=result["status"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
