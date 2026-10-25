from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, AIMessage
from backend.services.llm import get_llm
from backend.services.tools import (
    explore_postgresql_database,
    query_postgresql_table,
    explore_mongodb_database,
    query_mongodb_collection,
    analyze_basic_stats, 
    get_visualization_data
)
from backend.services.prompts import NARRATIVE_SUMMARY_PROMPT
import json


class DatabaseAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    db_type: str
    connection_string: str
    database_name: str
    database_info: dict
    analysis_results: dict
    narrative_summary: str
    table_data: dict  


def explore_database_node(state: DatabaseAgentState):
    db_type = state["db_type"]
    connection_string = state["connection_string"]
    database_name = state.get("database_name", "")
    
    if db_type == "postgresql":
        db_info = explore_postgresql_database.invoke({"connection_string": connection_string})
        db_info_dict = json.loads(db_info)
    else: 
        db_info = explore_mongodb_database.invoke({
            "connection_string": connection_string,
            "database_name": database_name
        })
        db_info_dict = json.loads(db_info)
    
    return {
        "database_info": db_info_dict,
        "messages": [AIMessage(content=f"Database exploration completed. Found {db_info_dict.get('total_tables', db_info_dict.get('total_collections', 0))} tables/collections.")]
    }


def analyze_tables_node(state: DatabaseAgentState):
    db_type = state["db_type"]
    connection_string = state["connection_string"]
    database_name = state.get("database_name", "")
    database_info = state["database_info"]
    
    table_analyses = []
    table_data = {}
    
    if db_type == "postgresql":
        tables = database_info.get("tables", [])[:3]  
        
        for table in tables:
            table_name = table["name"]
            
            print(f"DEBUG: Analyzing table '{table_name}'")
            try:
                data_json = query_postgresql_table.invoke({
                    "connection_string": connection_string,
                    "table_name": table_name,
                    "limit": 1000
                })
                print(f"DEBUG: Data fetched for '{table_name}', size: {len(data_json)}")
                
                # Check for error in data_json 
                if "error" in data_json and "traceback" in data_json:
                     print(f"DEBUG: Query returned error for '{table_name}': {data_json}")
            
                basic_stats = analyze_basic_stats.invoke({"df_json": data_json})
                table_analyses.append({
                    "table_name": table_name,
                    "stats": json.loads(basic_stats),
                    "type": "table"
                })
                table_data[table_name] = data_json
                print(f"DEBUG: Stats generated for '{table_name}'")
            except Exception as e:
                print(f"DEBUG: Exception analyzing '{table_name}': {str(e)}")
                pass
    
    else: 
        collections = database_info.get("collections", [])[:3] 
        
        for collection in collections:
            collection_name = collection["name"]
            
            data_json = query_mongodb_collection.invoke({
                "connection_string": connection_string,
                "database_name": database_name,
                "collection_name": collection_name,
                "limit": 1000
            })
            
            try:
                basic_stats = analyze_basic_stats.invoke({"df_json": data_json})
                table_analyses.append({
                    "collection_name": collection_name,
                    "stats": json.loads(basic_stats),
                    "type": "collection"
                })
                table_data[collection_name] = data_json
            except:
                pass
    
    # Aggregate stats for the "basic_stats" top-level object expected by Frontend
    total_rows = 0
    total_cols = 0
    total_memory = 0
    all_numerical = []
    all_categorical = []
    all_datetime = []
    agg_missing = {}
    agg_duplicates = 0
    
    for analysis in table_analyses:
        stats = analysis["stats"]
        
        # Use legitimate row count from metadata if available, else fallback to sample size
        real_row_count = stats["shape"]["rows"] 
        table_name = analysis.get("table_name", analysis.get("collection_name", ""))
        
        if db_type == "postgresql":
            for t in database_info.get("tables", []):
                if t["name"] == table_name:
                    meta_count = t.get("row_count")
                    real_row_count = meta_count if meta_count is not None and meta_count > 0 else stats["shape"]["rows"]
                    break
        else: # mongodb
            for c in database_info.get("collections", []):
                if c["name"] == table_name:
                    meta_count = c.get("document_count")
                    real_row_count = meta_count if meta_count is not None and meta_count > 0 else stats["shape"]["rows"]
                    break
                    
        total_rows += real_row_count
        
        total_cols += stats["shape"]["columns"]
        total_memory += stats["memory_usage"]
        agg_duplicates += stats["duplicates"]
        
        prefix = table_name
        all_numerical.extend([f"{prefix}.{c}" for c in stats["numerical_columns"]])
        all_categorical.extend([f"{prefix}.{c}" for c in stats["categorical_columns"]])
        all_datetime.extend([f"{prefix}.{c}" for c in stats["datetime_columns"]])
        
        for k, v in stats["missing_values"].items():
            agg_missing[f"{prefix}.{k}"] = v

    aggregate_basic_stats = {
        "shape": {"rows": total_rows, "columns": total_cols},
        "columns": all_numerical + all_categorical + all_datetime,
        "dtypes": {}, # Simplified
        "missing_values": agg_missing,
        "missing_percentage": {}, # Simplified
        "duplicates": agg_duplicates,
        "memory_usage": round(total_memory, 2),
        "numerical_columns": all_numerical,
        "categorical_columns": all_categorical,
        "datetime_columns": all_datetime,
        "numerical_stats": {},
        "categorical_stats": {}
    }
    
    return {
        "analysis_results": {
            "table_analyses": table_analyses,
            "basic_stats": aggregate_basic_stats
        },
        "table_data": table_data,
        "messages": [AIMessage(content=f"Analyzed {len(table_analyses)} tables/collections")]
    }


def database_visualization_node(state: DatabaseAgentState):
    # Visualizations disabled as per user request
    analysis_results = state["analysis_results"]
    analysis_results["visualizations"] = {"univariate": [], "bivariate": []}
    
    return {
        "analysis_results": analysis_results,
        "messages": [AIMessage(content="Database visualizations skipped")]
    }


def database_narrative_node(state: DatabaseAgentState):
    llm = get_llm()
    database_info = state["database_info"]
    analysis_results = state["analysis_results"]
    db_type = state["db_type"]
    
    # Truncate table analyses to fit within token limits
    table_analyses = analysis_results.get("table_analyses", [])
    truncated_analyses = []
    
    for analysis in table_analyses[:3]: # Limit to 3 tables
        stats = analysis.get("stats", {})
        truncated_stats = {
            "shape": stats.get("shape"),
            "numerical_columns": stats.get("numerical_columns", [])[:5],
            "categorical_columns": stats.get("categorical_columns", [])[:5],
        }
        # Only include top 3 numerical and categorical stats
        if "numerical_stats" in stats:
            truncated_stats["numerical_stats"] = {k: v for i, (k, v) in enumerate(stats["numerical_stats"].items()) if i < 3}
        if "categorical_stats" in stats:
            truncated_stats["categorical_stats"] = {k: v for i, (k, v) in enumerate(stats["categorical_stats"].items()) if i < 3}
            
        truncated_analyses.append({
            "table_name": analysis.get("table_name", analysis.get("collection_name", "")),
            "type": analysis.get("type", ""),
            "stats": truncated_stats
        })
        
    analysis_for_llm = {
        "table_analyses": truncated_analyses
    }
    
    analysis_json = json.dumps(analysis_for_llm, indent=1, default=str)
    if len(analysis_json) > 2000:
        analysis_json = analysis_json[:2000] + "\n... (truncated)"
        
    db_info_json = json.dumps(database_info, indent=1, default=str)
    if len(db_info_json) > 1000:
        db_info_json = db_info_json[:1000] + "\n... (truncated)"
    
    prompt = f"""{NARRATIVE_SUMMARY_PROMPT}

Database Type: {db_type.upper()}

Database Structure:
{db_info_json}

Analysis Results:
{analysis_json}

CRITICAL INSTRUCTIONS FOR ACCURACY:
1. You are analyzing a REAL database. Do NOT hallucinate tables or columns.
2. Use ONLY the data provided in the "Analysis Results" JSON.
3. If data is missing or incomplete, explicitly state that limitation.
4. Calculations (counts, means, etc.) MUST stem directly from the provided stats.
5. Reference the generated visualizations (Histograms, Bar Charts) in your narrative as evidence.

Generate a comprehensive, 100% ACCURATE narrative summary of the database analysis."""
    
    response = llm.invoke([HumanMessage(content=prompt)])
    
    return {
        "narrative_summary": response.content,
        "messages": [AIMessage(content="Database narrative summary generated")]
    }


def create_database_analysis_graph():
    workflow = StateGraph(DatabaseAgentState)
    
    workflow.add_node("explore", explore_database_node)
    workflow.add_node("analyze", analyze_tables_node)
    workflow.add_node("visualizations", database_visualization_node)
    workflow.add_node("narrative", database_narrative_node)
    
    workflow.set_entry_point("explore")
    workflow.add_edge("explore", "analyze")
    workflow.add_edge("analyze", "visualizations")
    workflow.add_edge("visualizations", "narrative")
    workflow.add_edge("narrative", END)
    
    app = workflow.compile()
    return app
