from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, AIMessage
from backend.services.llm import get_llm
from backend.services.tools import (
    analyze_basic_stats,
    detect_outliers,
    analyze_correlations,
    get_visualization_data
)
from backend.services.prompts import NARRATIVE_SUMMARY_PROMPT
import json


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    df_json: str
    analysis_results: dict
    narrative_summary: str


def analysis_node(state: AgentState):
    df_json = state["df_json"]
    
    basic_stats = analyze_basic_stats.invoke({"df_json": df_json})
    outliers = detect_outliers.invoke({"df_json": df_json})
    correlations = analyze_correlations.invoke({"df_json": df_json})
    
    analysis_results = {
        "basic_stats": json.loads(basic_stats),
        "outliers": json.loads(outliers),
        "correlations": json.loads(correlations)
    }
    
    return {
        "analysis_results": analysis_results,
        "messages": [AIMessage(content="Analysis completed successfully")]
    }


def narrative_generation_node(state: AgentState):
    llm = get_llm()
    analysis_results = state["analysis_results"]
    
    # Build visualization summary from flat dictionary
    viz_summary = []
    if "visualizations" in analysis_results and isinstance(analysis_results["visualizations"], dict):
        for viz_key in analysis_results["visualizations"].keys():
            # Parse the key to get chart type and column
            # Format: "histogram_age", "boxplot_salary", "scatter_age_vs_salary"
            viz_summary.append(f"- Generated {viz_key.replace('_', ' ')}")
    
    # Create context without the full visualization data (too large for LLM)
    context_data = {}
    
    # Only include essential stats (truncated) to stay within token limits
    if "basic_stats" in analysis_results:
        bs = analysis_results["basic_stats"]
        context_data["basic_stats"] = {
            "shape": bs.get("shape"),
            "columns": bs.get("columns", [])[:15],
            "duplicates": bs.get("duplicates"),
            "memory_usage": bs.get("memory_usage"),
            "numerical_columns": bs.get("numerical_columns", [])[:10],
            "categorical_columns": bs.get("categorical_columns", [])[:10],
        }
        # Include only top 5 numerical stats
        num_stats = bs.get("numerical_stats", {})
        context_data["basic_stats"]["numerical_stats"] = {k: v for i, (k, v) in enumerate(num_stats.items()) if i < 5}
        # Include only top 5 categorical stats
        cat_stats = bs.get("categorical_stats", {})
        context_data["basic_stats"]["categorical_stats"] = {k: v for i, (k, v) in enumerate(cat_stats.items()) if i < 5}
    
    if "correlations" in analysis_results:
        corr = analysis_results["correlations"]
        # Only keep top correlations if it's a dict
        if isinstance(corr, dict):
            context_data["correlations_summary"] = {k: v for i, (k, v) in enumerate(corr.items()) if i < 5}
        else:
            context_data["correlations_summary"] = str(corr)[:500]
    
    if "outliers" in analysis_results:
        context_data["outliers"] = analysis_results["outliers"]
    
    context_data["generated_visualizations_list"] = viz_summary[:10]

    # Truncate the JSON to a safe size
    context_json = json.dumps(context_data, indent=1, default=str)
    if len(context_json) > 3000:
        context_json = context_json[:3000] + "\n... (truncated)"

    prompt = f"""{NARRATIVE_SUMMARY_PROMPT}

Analysis Results:
{context_json}

Generate a comprehensive narrative summary of the dataset analysis."""
    
    response = llm.invoke([HumanMessage(content=prompt)])
    
    return {
        "narrative_summary": response.content,
        "messages": [AIMessage(content="Narrative summary generated")]
    }


def visualization_prep_node(state: AgentState):
    """Generate comprehensive visualizations from the CSV data"""
    df_json = state["df_json"]
    analysis_results = state["analysis_results"]
    
    # Dictionary to store all visualizations (flat structure for frontend)
    visualizations = {}
    
    numerical_cols = analysis_results["basic_stats"].get("numerical_columns", [])
    categorical_cols = analysis_results["basic_stats"].get("categorical_columns", [])
    
    # 1. HISTOGRAMS - Distribution of numerical columns
    for col in numerical_cols[:5]:  # Limit to first 5 numerical columns
        try:
            hist_data = get_visualization_data.invoke({
                "df_json": df_json,
                "chart_type": "histogram",
                "column": col
            })
            chart_data = json.loads(hist_data)
            if "plotly_chart" in chart_data:
                visualizations[f"histogram_{col}"] = chart_data["plotly_chart"]
        except Exception as e:
            print(f"Error generating histogram for {col}: {e}")
    
    # 2. BOX PLOTS - Show distribution and outliers for numerical columns
    for col in numerical_cols[:5]:  # Limit to first 5 numerical columns
        try:
            box_data = get_visualization_data.invoke({
                "df_json": df_json,
                "chart_type": "box",
                "column": col
            })
            chart_data = json.loads(box_data)
            if "plotly_chart" in chart_data:
                visualizations[f"boxplot_{col}"] = chart_data["plotly_chart"]
        except Exception as e:
            print(f"Error generating box plot for {col}: {e}")
    
    # 3. BAR CHARTS - Count plots for categorical columns
    for col in categorical_cols[:5]:  # Limit to first 5 categorical columns
        try:
            unique_count = analysis_results["basic_stats"]["categorical_stats"][col]["unique_values"]
            if unique_count <= 15:  # Only create bar chart if not too many categories
                bar_data = get_visualization_data.invoke({
                    "df_json": df_json,
                    "chart_type": "bar",
                    "column": col
                })
                chart_data = json.loads(bar_data)
                if "plotly_chart" in chart_data:
                    visualizations[f"bar_{col}"] = chart_data["plotly_chart"]
        except Exception as e:
            print(f"Error generating bar chart for {col}: {e}")
    
    # 4. PIE CHARTS - Distribution for categorical columns with few categories
    for col in categorical_cols[:3]:  # Limit to first 3 categorical columns
        try:
            unique_count = analysis_results["basic_stats"]["categorical_stats"][col]["unique_values"]
            if unique_count <= 10:  # Only create pie chart for small number of categories
                pie_data = get_visualization_data.invoke({
                    "df_json": df_json,
                    "chart_type": "pie",
                    "column": col
                })
                chart_data = json.loads(pie_data)
                if "plotly_chart" in chart_data:
                    visualizations[f"pie_{col}"] = chart_data["plotly_chart"]
        except Exception as e:
            print(f"Error generating pie chart for {col}: {e}")
    
    # 5. SCATTER PLOTS - Relationships between numerical columns
    if len(numerical_cols) >= 2:
        # Create scatter plots for first few numerical column pairs
        for i in range(min(3, len(numerical_cols)-1)):
            try:
                scatter_data = get_visualization_data.invoke({
                    "df_json": df_json,
                    "chart_type": "scatter",
                    "column": numerical_cols[i],
                    "second_column": numerical_cols[i+1]
                })
                chart_data = json.loads(scatter_data)
                if "plotly_chart" in chart_data:
                    visualizations[f"scatter_{numerical_cols[i]}_vs_{numerical_cols[i+1]}"] = chart_data["plotly_chart"]
            except Exception as e:
                print(f"Error generating scatter plot: {e}")
    
    # 6. CORRELATION HEATMAP - Overall correlation matrix
    if len(numerical_cols) >= 2:
        try:
            heatmap_data = get_visualization_data.invoke({
                "df_json": df_json,
                "chart_type": "correlation_heatmap",
                "column": "correlation"  # Dummy column name
            })
            chart_data = json.loads(heatmap_data)
            if "plotly_chart" in chart_data:
                visualizations["correlation_heatmap"] = chart_data["plotly_chart"]
        except Exception as e:
            print(f"Error generating correlation heatmap: {e}")
    
    # Store visualizations in analysis results
    analysis_results["visualizations"] = visualizations
    
    return {
        "analysis_results": analysis_results,
        "messages": [AIMessage(content=f"Generated {len(visualizations)} visualizations")]
    }


def create_analysis_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("analysis", analysis_node)
    workflow.add_node("narrative", narrative_generation_node)
    workflow.add_node("visualizations", visualization_prep_node)
    
    workflow.set_entry_point("analysis")
    workflow.add_edge("analysis", "visualizations")
    workflow.add_edge("visualizations", "narrative")
    workflow.add_edge("narrative", END)
    
    app = workflow.compile()
    return app
