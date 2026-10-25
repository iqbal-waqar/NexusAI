from typing import Dict, Any, Optional
import pandas as pd
import os
from langchain_experimental.agents.agent_toolkits import create_pandas_dataframe_agent
from langchain.agents.agent_types import AgentType
from langchain_groq import ChatGroq

from backend.config import get_settings

class CSVAgent:
    def __init__(self, llm: ChatGroq):
        self.llm = llm
        self.active_agents = {}

    def get_agent(self, file_path: str):
        filename = os.path.basename(file_path)
        
        if filename not in self.active_agents:
            try:
                df = pd.read_csv(file_path)
                agent = create_pandas_dataframe_agent(
                    self.llm,
                    df,
                    verbose=True,
                    agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
                    allow_dangerous_code=True
                )
                self.active_agents[filename] = agent
            except Exception as e:
                raise Exception(f"Failed to load CSV context: {str(e)}")
        
        return self.active_agents[filename]

    async def chat(self, file_path: str, message: str) -> Dict[str, Any]:
        if not file_path or not os.path.exists(file_path):
             return {"response": "No CSV file found. Please upload a file first.", "status": "error"}

        try:
            agent = self.get_agent(file_path)
            
            # Load df locally for context (safe and reliable)
            df_preview = pd.read_csv(file_path)
            df_context = f"""
Dataframe Summary:
- Rows: {df_preview.shape[0]}
- Columns: {df_preview.shape[1]}
- Column Names: {list(df_preview.columns)}
- Sample Data:
{df_preview.head(3).to_markdown()}
"""
            
            restricted_prompt = (
                "You are an expert Data Scientist. Analysis the provided dataframe accurately. "
                "You must ONLY answer questions related to the provided dataframe or data analysis tasks. "
                "If the user asks about general topics (e.g., recipes, history, jokes), reply with: 'Please ask a relevant question concerning the analyzed dataset.' "
                f"\n\nCONTEXT:\n{df_context}\n"
                "\nCRITICAL INSTRUCTIONS:\n"
                "1. Always basic your answer on the actual data.\n"
                "2. For row counts, ALWAYS use `len(df)` or `df.shape[0]`.\n"
                "3. Provide DETAILED, ACCURATE answers.\n"
                f"\n\nUser Query: {message}"
            )
            
            response = agent.invoke(restricted_prompt)
            answer = response.get('output', "I couldn't generate an answer.")
            
            return {
                "response": answer,
                "status": "success"
            }
        except Exception as e:
            return {"response": f"I encountered an error trying to answer that: {str(e)}", "status": "error"}
