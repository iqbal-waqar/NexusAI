import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.analysis import router as analysis_router
from backend.routes.database import router as database_router
from backend.routes.chat import router as chat_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="NexusAI Analytics API",
    description="Intelligent Data Cloud & Exploratory Analysis API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router)
app.include_router(database_router)
app.include_router(chat_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Welcome to NexusAI Analytics API",
        "version": "1.0.0",
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
