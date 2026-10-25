from backend.services.db_graph import create_database_analysis_graph
from backend.schemas.database import PostgreSQLConnection, MongoDBConnection
from typing import Dict, Any


class DatabaseAnalyzer:
    def __init__(self):
        self.graph = create_database_analysis_graph()
    
    async def analyze_postgresql(self, config: PostgreSQLConnection) -> Dict[str, Any]:
        """
        Analyze PostgreSQL database and return comprehensive analysis results.
        
        Args:
            config: PostgreSQL connection configuration
            
        Returns:
            Dictionary containing narrative summary and analysis results
        """
        try:
            connection_string = f"postgresql://{config.username}:{config.password}@{config.host}:{config.port}/{config.database}"
            
            initial_state = {
                "messages": [],
                "db_type": "postgresql",
                "connection_string": connection_string,
                "database_name": config.database,
                "database_info": {},
                "analysis_results": {},
                "narrative_summary": "",
                "table_data": {}
            }
            
            final_state = self.graph.invoke(initial_state)
            
            response = {
                "narrative_summary": final_state["narrative_summary"],
                "database_info": final_state["database_info"],
                "tables_or_collections": final_state["database_info"],
                "analysis_results": final_state["analysis_results"],
                "visualizations": final_state["analysis_results"].get("visualizations", {}),
                "status": "success",
                "message": "PostgreSQL database analysis completed successfully"
            }
            
            return response
            
        except Exception as e:
            raise Exception(f"Error during PostgreSQL analysis: {str(e)}")
    
    async def analyze_mongodb(self, config: MongoDBConnection) -> Dict[str, Any]:
        """
        Analyze MongoDB database and return comprehensive analysis results.
        
        Args:
            config: MongoDB connection configuration
            
        Returns:
            Dictionary containing narrative summary and analysis results
        """
        try:
            connection_string = config.connection_uri
            
            initial_state = {
                "messages": [],
                "db_type": "mongodb",
                "connection_string": connection_string,
                "database_name": config.database,
                "database_info": {},
                "analysis_results": {},
                "narrative_summary": "",
                "table_data": {}
            }
            
            final_state = self.graph.invoke(initial_state)
            
            response = {
                "narrative_summary": final_state["narrative_summary"],
                "database_info": final_state["database_info"],
                "tables_or_collections": final_state["database_info"],
                "analysis_results": final_state["analysis_results"],
                "visualizations": final_state["analysis_results"].get("visualizations", {}),
                "status": "success",
                "message": "MongoDB database analysis completed successfully"
            }
            
            return response
            
        except Exception as e:
            raise Exception(f"Error during MongoDB analysis: {str(e)}")
    
    async def test_postgresql_connection(self, config: PostgreSQLConnection) -> Dict[str, Any]:
        """
        Test PostgreSQL database connection.
        
        Args:
            config: PostgreSQL connection configuration
            
        Returns:
            Dictionary containing connection test result
        """
        try:
            import psycopg2
            conn = psycopg2.connect(
                host=config.host,
                port=config.port,
                database=config.database,
                user=config.username,
                password=config.password
            )
            conn.close()
            return {"status": "success", "message": "PostgreSQL connection successful"}
        except Exception as e:
            raise Exception(f"PostgreSQL connection failed: {str(e)}")
    
    async def test_mongodb_connection(self, config: MongoDBConnection) -> Dict[str, Any]:
        """
        Test MongoDB database connection.
        
        Args:
            config: MongoDB connection configuration
            
        Returns:
            Dictionary containing connection test result
        """
        try:
            from pymongo import MongoClient
            
            connection_string = config.connection_uri
            
            client = MongoClient(connection_string, serverSelectionTimeoutMS=5000)
            client.server_info()
            client.close()
            return {"status": "success", "message": "MongoDB connection successful"}
        except Exception as e:
            raise Exception(f"MongoDB connection failed: {str(e)}")
    
    async def analyze_database(self, request) -> Dict[str, Any]:
        """
        Analyze database based on the request type.
        
        Args:
            request: Database connection request
            
        Returns:
            Analysis results
        """
        if request.db_type == "postgresql":
            if not request.postgresql_config:
                raise ValueError("PostgreSQL configuration is required")
            return await self.analyze_postgresql(request.postgresql_config)
        
        elif request.db_type == "mongodb":
            if not request.mongodb_config:
                raise ValueError("MongoDB configuration is required")
            return await self.analyze_mongodb(request.mongodb_config)
        
        else:
            raise ValueError("Invalid database type. Must be 'postgresql' or 'mongodb'")
    
    async def test_database_connection(self, request) -> Dict[str, Any]:
        """
        Test database connection based on the request type.
        
        Args:
            request: Database connection request
            
        Returns:
            Connection test result
        """
        if request.db_type == "postgresql":
            if not request.postgresql_config:
                raise ValueError("PostgreSQL configuration is required")
            return await self.test_postgresql_connection(request.postgresql_config)
        
        elif request.db_type == "mongodb":
            if not request.mongodb_config:
                raise ValueError("MongoDB configuration is required")
            return await self.test_mongodb_connection(request.mongodb_config)
        
        else:
            raise ValueError("Invalid database type. Must be 'postgresql' or 'mongodb'")
