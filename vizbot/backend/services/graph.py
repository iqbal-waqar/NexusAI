from typing import TypedDict, Annotated, Dict, Any, Literal
from langgraph.graph import StateGraph, END
from backend.services.csv_agent import CSVAgent
from backend.services.postgres_agent import PostgresAgent
from backend.services.mongo_agent import MongoAgent
from backend.session_manager import session_manager
from langchain.chat_models.base import BaseChatModel

class ChatRouterState(TypedDict):
    message: str
    db_info: Dict[str, Any]
    agent_response: Dict[str, Any]
    user_session_mode: str

def route_request(state: ChatRouterState) -> Literal["csv_agent", "postgres_agent", "mongo_agent", "error"]:
    """
    Router node that decides which agent to call based on session mode.
    """
    mode = state.get("user_session_mode")
    db_info = state.get("db_info", {})
    
    if mode == 'db' and db_info:
        db_type = db_info.get('type')
        if db_type == 'postgresql':
            return "postgres_agent"
        elif db_type == 'mongodb':
            return "mongo_agent"
        else:
            return "error"
    elif mode == 'csv':
        return "csv_agent"
    else:
        # If no mode is set (e.g. server restart), do not default to CSV.
        return "error"

async def call_csv_agent(state: ChatRouterState, csv_agent: CSVAgent):
    import os
    STORAGE_DIR = "backend/storage"
    files = [os.path.join(STORAGE_DIR, f) for f in os.listdir(STORAGE_DIR) if f.endswith('.csv')]
    file_path = max(files, key=os.path.getctime) if files else None
    
    if not file_path:
        return {"agent_response": {"response": "No CSV file found.", "status": "error"}}
        
    result = await csv_agent.chat(file_path, state["message"])
    return {"agent_response": result}

async def call_postgres_agent(state: ChatRouterState, pg_agent: PostgresAgent):
    config = state["db_info"]["config"]
    result = await pg_agent.chat(config, state["message"])
    return {"agent_response": result}

async def call_mongo_agent(state: ChatRouterState, mongo_agent: MongoAgent):
    config = state["db_info"]["config"]
    result = await mongo_agent.chat(config, state["message"])
    return {"agent_response": result}

def create_chat_graph(llm: BaseChatModel):
    csv_agent = CSVAgent(llm)
    pg_agent = PostgresAgent(llm)
    mongo_agent = MongoAgent(llm)

    async def csv_node(state):
        return await call_csv_agent(state, csv_agent)

    async def pg_node(state):
        return await call_postgres_agent(state, pg_agent)

    async def mongo_node(state):
        return await call_mongo_agent(state, mongo_agent)
    
    workflow = StateGraph(ChatRouterState)
    
    workflow.add_node("csv_agent", csv_node)
    workflow.add_node("postgres_agent", pg_node)
    workflow.add_node("mongo_agent", mongo_node)
    workflow.add_node("error", lambda s: {"agent_response": {"response": "No active session detected. Please upload a CSV file or connect to a database.", "status": "error"}})
    
    workflow.set_conditional_entry_point(
        route_request,
        {
            "csv_agent": "csv_agent",
            "postgres_agent": "postgres_agent",
            "mongo_agent": "mongo_agent",
            "error": "error"
        }
    )
    
    workflow.add_edge("csv_agent", END)
    workflow.add_edge("postgres_agent", END)
    workflow.add_edge("mongo_agent", END)
    workflow.add_edge("error", END)
    
    return workflow.compile()
