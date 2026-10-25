from typing import Dict, Any
from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq
from sqlalchemy import create_engine, text


class PostgresAgent:
    def __init__(self, llm: ChatGroq):
        self.llm = llm

    def _get_schema(self, uri: str) -> str:
        """Get a compact schema string directly from PostgreSQL (no LLM call)."""
        engine = create_engine(uri)
        try:
            with engine.connect() as conn:
                tables_result = conn.execute(text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                ))
                tables = [row[0] for row in tables_result]

                schema_parts = []
                for table in tables:
                    cols_result = conn.execute(text(
                        f"SELECT column_name, data_type FROM information_schema.columns "
                        f"WHERE table_name = '{table}' ORDER BY ordinal_position"
                    ))
                    cols = [f"{row[0]} ({row[1]})" for row in cols_result]
                    count = conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
                    schema_parts.append(f"Table: {table} ({count} rows)\n  Columns: {', '.join(cols)}")

                return "\n".join(schema_parts)
        finally:
            engine.dispose()

    async def chat(self, config: Dict[str, Any], message: str) -> Dict[str, Any]:
        try:
            uri = f"postgresql+psycopg2://{config['username']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"

            # Step 1: Get real schema (zero LLM calls - pure SQL)
            schema = self._get_schema(uri)

            # Step 2: ONE LLM call → generate SQL query
            sql_prompt = f"""You are a PostgreSQL expert. Given this database schema, write ONLY a SQL query to answer the question.

SCHEMA:
{schema}

QUESTION: {message}

Respond with ONLY the raw SQL query, nothing else. No explanation, no markdown, just the query."""

            sql_response = self.llm.invoke([HumanMessage(content=sql_prompt)])
            sql_query = sql_response.content.strip()
            
            # Clean up: remove markdown code fences if the LLM added them
            if sql_query.startswith("```sql"):
                sql_query = sql_query[6:]
            if sql_query.startswith("```"):
                sql_query = sql_query[3:]
            if sql_query.endswith("```"):
                sql_query = sql_query[:-3]
            sql_query = sql_query.strip()

            # Step 3: Execute the SQL against the REAL database
            engine = create_engine(uri)
            try:
                with engine.connect() as conn:
                    result = conn.execute(text(sql_query))
                    rows = result.fetchall()
                    columns = list(result.keys()) if result.returns_rows else []

                    # Format results
                    if len(rows) == 0:
                        result_text = "No results found."
                    elif len(rows) == 1 and len(columns) == 1:
                        result_text = str(rows[0][0])
                    else:
                        header = " | ".join(columns)
                        row_strings = [" | ".join(str(val) for val in row) for row in rows[:25]]
                        result_text = f"{header}\n" + "\n".join(row_strings)
                        if len(rows) > 25:
                            result_text += f"\n... ({len(rows)} total rows)"
            finally:
                engine.dispose()

            # Step 4: ONE LLM call → explain the real results
            explain_prompt = f"""Given this SQL query, its real results, and the user's question, write a clear answer.

Question: {message}
SQL Query: {sql_query}
Query Results: {result_text}

Respond in EXACTLY this format:

**SQL QUERY:**
```sql
{sql_query}
```

**RESULT:** {result_text}

**ANSWER:**
[Write a clear natural language explanation using the EXACT numbers from the results above. Be specific and accurate.]"""

            final_response = self.llm.invoke([HumanMessage(content=explain_prompt)])
            return {"response": final_response.content, "status": "success"}

        except Exception as e:
            return {"response": f"PostgreSQL chat error: {str(e)}", "status": "error"}
