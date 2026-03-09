from sqlalchemy import Column, Integer, String
from .database import Base

class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)
    response = Column(String)
