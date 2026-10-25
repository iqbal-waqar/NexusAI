import pandas as pd
from io import BytesIO
from backend.services.csv_analysis_graph import create_analysis_graph
from typing import Dict, Any
import os

STORAGE_DIR = "backend/storage"

class DataAnalyzer:
    def __init__(self):
        self.graph = create_analysis_graph()
        if not os.path.exists(STORAGE_DIR):
            os.makedirs(STORAGE_DIR)
    
    async def analyze_csv(self, file_content: bytes, filename: str = "latest.csv") -> Dict[str, Any]:
        """
        Analyze CSV file, save it for chat, and return comprehensive analysis results.
        """
        try:
            file_path = os.path.join(STORAGE_DIR, filename)
            with open(file_path, "wb") as f:
                f.write(file_content)

            if not file_content:
                 raise ValueError("File content is empty bytes")

            try:
                df = pd.read_csv(BytesIO(file_content))
            except pd.errors.EmptyDataError:
                raise ValueError("CSV file contains no data")
            
            if df.empty:
                raise ValueError("CSV DataFrame is empty")

            for col in df.columns:
                try:
                    df[col] = pd.to_numeric(df[col], errors='ignore')
                except:
                    pass
                
                if df[col].dtype == 'object':
                    try:
                        sample = df[col].dropna().iloc[0] if not df[col].dropna().empty else ""
                        sample_str = str(sample).strip()
                        if sample_str and (sample_str[0].isdigit() or sample_str.startswith('20') or sample_str.startswith('19')):
                            df[col] = pd.to_datetime(df[col], errors='ignore')
                    except:
                        pass
            
            df_json = df.to_json(orient='records', date_format='iso')
            
            initial_state = {
                "messages": [],
                "df_json": df_json,
                "analysis_results": {},
                "narrative_summary": ""
            }
            
            final_state = self.graph.invoke(initial_state)
            
            response = {
                "narrative_summary": final_state["narrative_summary"],
                "analysis_results": final_state["analysis_results"],
                "status": "success",
                "message": "Analysis completed successfully"
            }
            
            return response
            
        except pd.errors.EmptyDataError:
            raise ValueError("CSV file is empty or invalid")
        except pd.errors.ParserError as e:
            raise ValueError(f"Error parsing CSV file: {str(e)}")
        except Exception as e:
            raise Exception(f"Error during analysis: {str(e)}")
    