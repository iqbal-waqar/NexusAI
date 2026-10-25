from typing import Optional, Literal
import os

class SessionManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SessionManager, cls).__new__(cls)
            cls._instance.active_db_config = None
            cls._instance.active_mode = None 
        return cls._instance

    def set_db_config(self, config: dict, db_type: Literal['postgresql', 'mongodb']):
        self.active_db_config = {
            "type": db_type,
            "config": config
        }
        self.active_mode = 'db'
        
    def set_csv_mode(self):
        self.active_mode = 'csv'
        self.active_db_config = None

    def get_active_db(self):
        return self.active_db_config

    def get_mode(self):
        return self.active_mode

session_manager = SessionManager()
