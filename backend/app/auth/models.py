from sqlalchemy import Column, Integer, String, DateTime
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Required field
    study_field = Column(String, nullable=False)

    # Optional student fields
    semester = Column(String, nullable=True)
    college_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    # Password reset
    reset_token = Column(String, nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)
