from sqlalchemy import create_engine, text
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

def run_migrations():
    """Run database migrations to add missing columns"""
    try:
        with engine.connect() as conn:
            # Check and add recurring_months to expenses table
            try:
                conn.execute(text("SELECT recurring_months FROM expenses LIMIT 1"))
            except Exception:
                print("Adding recurring_months column to expenses table...")
                conn.execute(text("ALTER TABLE expenses ADD COLUMN recurring_months INTEGER DEFAULT 0"))
                conn.commit()
                print("Migration complete: added recurring_months to expenses")
            
            # Check and add recurring_months to incomes table
            try:
                conn.execute(text("SELECT recurring_months FROM incomes LIMIT 1"))
            except Exception:
                print("Adding recurring_months column to incomes table...")
                conn.execute(text("ALTER TABLE incomes ADD COLUMN recurring_months INTEGER DEFAULT 0"))
                conn.commit()
                print("Migration complete: added recurring_months to incomes")
    except Exception as e:
        print(f"Migration check failed (this is OK for new databases): {e}")

