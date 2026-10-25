from typing import Dict, Any, List
from langchain_groq import ChatGroq

from backend.config import get_settings
from backend.session_manager import session_manager
from backend.services.graph import create_chat_graph

class ChatService:
    def __init__(self):
        self.settings = get_settings()
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0, 
            api_key=self.settings.GROQ_API_KEY
        )
        self.router_graph = create_chat_graph(self.llm)



    async def chat(self, message: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
        mode = session_manager.get_mode()
        db_info = session_manager.get_active_db()

        state = {
            "message": message,
            "db_info": db_info,
            "user_session_mode": mode,
            "agent_response": {}
        }
        
        result = await self.router_graph.ainvoke(state)
        
        agent_response = result.get("agent_response", {})
        if not agent_response:
             return {"response": "No response generated.", "status": "error"}
             
        return agent_response
