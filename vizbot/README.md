# 🤖 NexusAI: Autonomous Data Intelligence Platform

**From Raw Data to Monthly Insights — In Seconds.**

> *NexusAI bridges the gap between massive enterprise data and actionable business intelligence. It empowers non-technical users to query SQL, NoSQL, and CSV data using natural language, automating the manual grunt work of data analysis.*

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.119+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.6+-purple.svg)](https://langchain-ai.github.io/langgraph/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📑 Table of Contents
- [Executive Summary](#-executive-summary)
- [The Problem](#-the-problem-statement)
- [The Solution](#-the-solution-nexusai)
- [Technical Architecture](#-technical-architecture)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [User Guide](#-user-guide)
- [Project Structure](#-project-structure)

---

## 🚀 Executive Summary

**NexusAI** is an advanced, autonomous data analysis platform designed to solve the "Last Mile" problem in analytics. While companies store petabytes of data in powerful engines like PostgreSQL and MongoDB, extracting value requires technical skill (SQL/Python) or manual effort. NexusAI provides a **unified, agentic interface** where an AI workforce understands user intent, navigates complex schemas, creates queries, fixes errors, and presents visual, narrative reports.

---

## 🎯 The Problem Statement

### 1. The "Data-Rich, Insight-Poor" Paradox
Modern enterprises generate massive volumes of data, yet stakeholders struggle to answer simple questions like *"Why did sales drop in November?"*.

### 2. The Monthly Reporting Bottleneck
Every month, data teams face a backlog of requests for recurring reports.
*   **Manual Querying**: Analysts spend **60%** of their time writing repetitive `SELECT * FROM...` SQL queries or debugging MongoDB aggregation pipelines.
*   **Fragility**: A slight schema change breaks hardcoded dashboards.
*   **Latency**: Business leaders wait days for reports that should take minutes.

### 3. The Technical Skill Gap
*   **SQL/NoSQL Complexity**: Valuable data is locked in databases that only engineers can access.
*   **Tool Fragmentation**: Analysis requires switching between DB clients (DBeaver), coding tools (Jupyter), and visualization tools (Tableau).

**The Need**: A system that can "speak database" and "speak business" simultaneously, acting as an always-on data analyst.

---

## 💡 The Solution: NexusAI

NexusAI automates the entire analytics pipeline using a **Multi-Agent Architecture**:

### ✅ **Dual-Mode Intelligence**
NexusAI seamlessly switches between two modes:
1.  **DataFrame Mode**: For rapid, in-memory analysis of uploaded CSV/Excel files using Pandas.
2.  **Database Mode**: For secure, direct querying of enterprise databases (PostgreSQL, MongoDB) without data movement.

### ✅ **Autonomous Routing**
A smart **Router** acts as the traffic controller, analyzing your request and deploying the right specialist:
*   *" Analyze this spreadsheet"* -> **CSVAgent** (Data Scientist)
*   *" Query the users table"* -> **PostgresAgent** (SQL Engineer)
*   *" Aggregated logs from Mongo"* -> **MongoAgent** (NoSQL Expert)

### ✅ **Reliability & Transparency**
Unlike black-box AI tools, NexusAI is **transparent**:
*   It **inspects schemas** first to avoid hallucinations.
*   It **shows you the code** (SQL/Mongo Queries) it generates.
*   It **self-corrects** if a query fails.

---

## 🏗️ Technical Architecture

NexusAI is built on a modern, scalable stack optimized for agentic workflows.

### 1. High-Level Design
```mermaid
graph TD
    User[User Interface (React)] --> API[FastAPI Backend]
    API --> Router{Chat Router}
    
    Subgraph "Agent Layer"
        Router -- "Mode: CSV" --> CSV[CSVAgent]
        Router -- "Mode: Postgres" --> PG[PostgresAgent]
        Router -- "Mode: Mongo" --> Mongo[MongoAgent]
    end
    
    Subgraph "Tool Layer"
        CSV --> Tools[Centralized Tools]
        PG --> Tools
        Mongo --> Tools
    end
    
    Tools --> Pandas[Pandas Engine]
    Tools --> SQL[SQLAlchemy]
    Tools --> PyMongo[PyMongo Client]
```

### 2. Component Breakdown

#### **A. The Agent Triad**
The core intelligence resides in minimal, specialized agents located in `backend/services/`:

| Agent | Tech Stack | Role |
|-------|------------|------|
| **CSVAgent** | `PandasDataFrameAgent` | Statistical analysis, cleaning, outlier detection. |
| **PostgresAgent** | `SQLAgent` + `SQLAlchemy` | Schema exploration, complex JOINs, SQL generation. |
| **MongoAgent** | `ReAct Agent` + `PyMongo` | Collection listing, JSON querying, Aggregation pipelines. |

#### **B. Centralized Tooling (`tools.py`)**
To ensure consistency, agents share a common toolset:
*   **`analyze_basic_stats`**: Automatic data profiling (missing values, types).
*   **`get_visualization_data`**: Generates Plotly JSON for Frontend rendering.
*   **`explore_database`**: Universal schema inspector.

#### **C. Frontend (React + Vite)**
A responsive, dark-mode dashboard that renders:
*   Markdown Chat responses.
*   Syntax-highlighted Code Blocks (SQL/JSON).
*   Interactive Plotly Charts (Zoom, Pan, Hover).

---

## ✨ Key Features

### 1. 📊 Automated CSV Analysis
Upload a file, and NexusAI performs an instant **Health Check**:
*   **Missing Value Detection**: Identifies gaps in data.
*   **Outlier Detection**: Uses IQR method to flag anomalies.
*   **Correlation Heatmaps**: Finds hidden relationships between variables.

### 2. 🗄️ Enterprise Database Integration
Connect directly to your infrastructure.
*   **PostgreSQL**: Fully supports complex SQL, JOINs, and filtering.
*   **MongoDB**: Supports nested document querying and Aggregation Framework.

### 3. 📈 Dynamic Visualization
NexusAI doesn't just tell you trends; it shows them.
It autonomously decides the best chart type:
*   **Time Series** -> Line Chart
*   **Categorical Comp.** -> Bar Chart
*   **Distributions** -> Histogram
*   **Relationships** -> Scatter Plot

### 4. 📝 Narrative Reporting
The AI doesn't just output numbers. It writes a **Monthly Report** style narrative:
> *"Revenue increased by 15% in Q4, primarily driven by the Electronics category. However, return rates also spiked in December..."*

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ (for Frontend)
- [Groq API Key](https://console.groq.com) (for LLM inference)

### 1. Installation

**Backend Setup**
```bash
git clone https://github.com/your-username/NexusAI.git
cd NexusAI

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt
```

**Frontend Setup**
```bash
cd frontend
npm install
```

### 2. Configuration
Create a `.env` file in the root directory:
```bash
GROQ_API_KEY=gsk_your_key_here...
```

### 3. Launch
**Start Backend**
```bash
# From root
uvicorn main:app --reload
```
**Start Frontend**
```bash
# From frontend/
npm run dev
```
Visit **http://localhost:5173** to access NexusAI.

---

## 📖 User Guide

### Scenario: The "Monthly Sales Report"
**Goal**: Analyze a 50MB CSV file of sales data for the board meeting.

1.  **Upload**: Drag `sales_2024.csv` into NexusAI.
2.  **Auto-Profile**: The system immediately shows "Dataset uploaded: 50k rows, 12 columns. Found 5% missing values in 'Region'."
3.  **Ask**: *"Give me a monthly breakdown of sales by category."*
4.  **Result**:
    *   **CSVAgent** cleans the date column.
    *   Groups data by Month and Category.
    *   Generates a **Stacked Bar Chart**.
    *   Writes a summary: *"Electronics dominated Q1, while Fashion peaked in Q3..."*

### Scenario: "Why are users churning?" (SQL)
**Goal**: Investigate churn in the live PostgreSQL database.

1.  **Connect**: Enter Host, Port, User, DB Name in the "Connect Database" modal.
2.  **Ask**: *"Show me the churn rate by subscription tier for users who joined in 2024."*
3.  **Result**:
    *   **PostgresAgent** queries the `users` and `subscriptions` tables.
    *   Writes SQL:
        ```sql
        SELECT tier, AVG(is_churned) as churn_rate 
        FROM users 
        JOIN subscriptions ON users.id = subscriptions.user_id 
        WHERE join_date >= '2024-01-01' 
        GROUP BY tier;
        ```
    *   Displays the result table and a Bar Chart comparing churn rates.

---

## 📁 Project Structure

```
NexusAI/
├── 🚀 main.py                     # API Entry Point
├── 📦 pyproject.toml              # Dependencies
├── 🔒 .env                        # Secrets (API Keys)
│
├── 🧠 backend/
│   ├── 🤖 services/               # Core Agent Logic📁 Project Structure
NexusAI/
├── 🚀 main.py                     # API Entry Point
├── 📦 pyproject.toml              # Dependencies
├── 🔒 .env                        # Secrets (API Keys)
│
├── 🧠 backend/
│   ├── 🤖 services/               # Core Agent Logic
│   │   ├── graph.py               # The Router (LangGraph)
│   │   ├── csv_agent.py           # Analyzes CSV files
│   │   ├── postgres_agent.py      # Querie
│   │   ├── graph.py               # The Router (LangGraph)
│   │   ├── csv_agent.py           # Analyzes CSV files
│   │   ├── postgres_agent.py      # Queries PostgreSQL
│   │   ├── mongo_agent.py         # Queries MongoDB
│   │   ├── tools.py               # Shared Tools (Stats, Plotly, DB Inspection)
│   │   ├── csv_analysis_graph.py  # CSV Analysis Workflow
│   │   ├── db_graph.py            # Database Analysis Workflow
│   │   ├── llm.py                 # LLM Configuration
│   │   └── prompts.py             # Prompt Templates
│   │
│   ├── � interactors/            # Business Logic Orchestrators
│   │   ├── analyzer.py            # CSV Analysis Orchestrator
│   │   └── db_analyzer.py         # DB Analysis Orchestrator
│   │
│   ├── �🌐 routes/                 # API Endpoints
│   │   ├── analysis.py            # File Upload & Analysis
│   │   └── database.py            # DB Connection & Querying
│   │
│   └── 📋 schemas/                # Pydantic Models
│       ├── analysis.py            # Request/Response Models
│       └── database.py            # DB Config Models
│
├── 🎨 frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx      # Main Chat & Viz Interface
│   │   │   ├── DbForm.tsx         # Database Connection Modal
│   │   │   └── FileUploader.tsx   # Drag-and-drop Upload
│   │   └── services/
│   │       └── api.ts             # Backend API Client
│   └── package.json
│
└── 📄 README.md                   # Project Documentation
```

---

<div align="center">
    <b>NexusAI</b> • Built with ❤️ by the Nexus Engineering Team
</div>