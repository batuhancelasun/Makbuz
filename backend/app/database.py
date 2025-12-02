from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////app/data/makbuz.db")

# Create data directory if it doesn't exist (use absolute path)
data_dir = Path("/app/data")
data_dir.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

