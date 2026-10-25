from pydantic import BaseModel
from typing import Optional, Literal


class PostgreSQLConnection(BaseModel):
    host: str
    port: int = 5432
    database: str
    username: str
    password: str


class MongoDBConnection(BaseModel):
    connection_uri: str  # Full MongoDB connection URI (e.g., mongodb://user:pass@host:port/ or mongodb+srv://...)
    database: str


class DatabaseConnectionRequest(BaseModel):
    db_type: Literal["postgresql", "mongodb"]
    postgresql_config: Optional[PostgreSQLConnection] = None
    mongodb_config: Optional[MongoDBConnection] = None
