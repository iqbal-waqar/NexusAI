from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.interactors.analyzer import DataAnalyzer
from typing import Dict, Any
import os

router = APIRouter(prefix="/api", tags=["analysis"])

analyzer = DataAnalyzer()
STORAGE_DIR = "backend/storage"

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        from backend.session_manager import session_manager
        session_manager.set_csv_mode() 

        await file.seek(0)
        content = await file.read()
        result = await analyzer.analyze_csv(content, filename=file.filename)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "VizBot Analytics API"}
