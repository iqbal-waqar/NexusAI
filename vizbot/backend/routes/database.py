from fastapi import APIRouter, HTTPException
from backend.interactors.db_analyzer import DatabaseAnalyzer
from backend.schemas.database import (
    DatabaseConnectionRequest,
    PostgreSQLConnection,
    MongoDBConnection
)
from typing import Dict, Any

router = APIRouter(prefix="/api/database", tags=["database"])

db_analyzer = DatabaseAnalyzer()


@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_database(request: DatabaseConnectionRequest):
    try:
        from backend.session_manager import session_manager # Import here to avoid circular imports if any
        
        # Save session context
        if request.db_type == "postgresql" and request.postgresql_config:
            session_manager.set_db_config(request.postgresql_config.dict(), "postgresql")
        elif request.db_type == "mongodb" and request.mongodb_config:
            session_manager.set_db_config(request.mongodb_config.dict(), "mongodb")
            
        result = await db_analyzer.analyze_database(request)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/test-connection")
async def test_database_connection(request: DatabaseConnectionRequest):
    try:
        result = await db_analyzer.test_database_connection(request)
        return result
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection failed: {str(e)}")
