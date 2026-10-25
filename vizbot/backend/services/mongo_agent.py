from typing import Dict, Any
from langchain_groq import ChatGroq
from pymongo import MongoClient
import json
from bson import ObjectId

class MongoAgent:
    def __init__(self, llm: ChatGroq):
        self.llm = llm
        self.connection_string = None
        self.database_name = None

    def _convert_objectid(self, obj):
        """Recursively convert ObjectId to string"""
        if isinstance(obj, dict):
            return {k: self._convert_objectid(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_objectid(item) for item in obj]
        elif isinstance(obj, ObjectId):
            return str(obj)
        else:
            return obj

    def _get_schema(self):
        """Get database schema information"""
        try:
            client = MongoClient(self.connection_string)
            db = client[self.database_name]
            
            collections = db.list_collection_names()
            schema_info = {}
            
            for coll_name in collections:
                sample_doc = db[coll_name].find_one()
                if sample_doc:
                    fields = list(sample_doc.keys())
                    schema_info[coll_name] = {
                        "fields": fields,
                        "sample": self._convert_objectid(sample_doc)
                    }
            
            client.close()
            return schema_info
        except Exception as e:
            return {"error": str(e)}

    def _execute_pipeline(self, collection_name: str, pipeline: list):
        """Execute aggregation pipeline"""
        try:
            client = MongoClient(self.connection_string)
            db = client[self.database_name]
            
            results = list(db[collection_name].aggregate(pipeline))
            results = self._convert_objectid(results)
            
            client.close()
            return {"success": True, "results": results, "count": len(results)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def chat(self, config: Dict[str, Any], message: str) -> Dict[str, Any]:
        try:
            self.connection_string = config.get('connection_uri', 'mongodb://localhost:27017/')
            self.database_name = config['database']
            
            # Get schema information
            schema = self._get_schema()
            
            if "error" in schema:
                return {
                    "response": f"Error connecting to database: {schema['error']}",
                    "status": "error"
                }
            
            # Create a comprehensive prompt for the LLM
            prompt = f"""You are a MongoDB expert. Generate the SIMPLEST and MOST EFFICIENT MongoDB aggregation pipeline to answer the question.

DATABASE: {self.database_name}

AVAILABLE COLLECTIONS AND SCHEMA:
{json.dumps(schema, indent=2)}

USER QUESTION: {message}

CRITICAL GUIDELINES - USE THE SIMPLEST APPROACH:

1. **Top N per group** (e.g., "top 5 students from each college"):
   - SIMPLE WAY: Sort DESC → Group with $push → Project with $slice
   - Example: [{{"$sort": {{"cgpa": -1}}}}, {{"$group": {{"_id": "$college_id", "students": {{"$push": "$$ROOT"}}}}}}, {{"$project": {{"top5": {{"$slice": ["$students", 5]}}}}}}]
   - DO NOT use $unwind, $match, or multiple $group stages!

2. **Average per group**:
   - Example: [{{"$group": {{"_id": "$program", "avg_cgpa": {{"$avg": "$cgpa"}}}}}}]

3. **Count by field**:
   - Example: [{{"$group": {{"_id": "$city", "count": {{"$sum": 1}}}}}}, {{"$sort": {{"count": -1}}}}]

4. **Lowest/Highest value**:
   - Use $sort and $limit
   - Example: [{{"$sort": {{"cgpa": 1}}}}, {{"$limit": 1}}]

5. **Trends over time**:
   - Example: [{{"$group": {{"_id": "$semester", "avg_cgpa": {{"$avg": "$cgpa"}}}}}}, {{"$sort": {{"_id": 1}}}}]

RULES:
- Use the MINIMUM number of stages
- Avoid unnecessary $match, $unwind, or complex logic
- Keep it simple and efficient
- Use proper field names from the schema

RESPOND IN THIS EXACT JSON FORMAT (no extra text):
{{
  "collection": "collection_name",
  "pipeline": [your aggregation pipeline here],
  "explanation": "Brief explanation"
}}"""

            # Get LLM response
            response = self.llm.invoke(prompt)
            response_text = response.content.strip()
            
            # Extract JSON from response
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            # Parse the JSON response
            try:
                query_info = json.loads(response_text)
            except json.JSONDecodeError:
                # Try to find JSON in the response
                import re
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    query_info = json.loads(json_match.group())
                else:
                    return {
                        "response": f"Error: Could not parse LLM response as JSON.\n\nResponse: {response_text}",
                        "status": "error"
                    }
            
            collection = query_info.get("collection")
            pipeline = query_info.get("pipeline")
            explanation = query_info.get("explanation", "")
            
            if not collection or not pipeline:
                return {
                    "response": "Error: Invalid query format from LLM",
                    "status": "error"
                }
            
            # Execute the pipeline
            result = self._execute_pipeline(collection, pipeline)
            
            if not result.get("success"):
                return {
                    "response": f"Error executing query: {result.get('error')}",
                    "status": "error"
                }
            
            # Format the final response
            results = result.get("results", [])
            count = result.get("count", 0)
            
            final_response = f"""**MONGODB QUERY:**
```json
{json.dumps(pipeline, indent=2)}
```

**ANSWER:**
{explanation}

**RESULTS:** Found {count} result(s).

```json
{json.dumps(results[:10] if len(results) > 10 else results, indent=2)}
```
"""
            
            if len(results) > 10:
                final_response += f"\n\n*(Showing first 10 of {count} results)*"
            
            return {"response": final_response, "status": "success"}
            
        except Exception as e:
            import traceback
            return {
                "response": f"Error: {str(e)}\n\n{traceback.format_exc()}",
                "status": "error"
            }
