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
    """Run database migrations to add missing columns and tables"""
    try:
        with engine.connect() as conn:
            # Create items table if it doesn't exist
            try:
                conn.execute(text("SELECT 1 FROM items LIMIT 1"))
            except Exception:
                print("Creating items table...")
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name VARCHAR NOT NULL UNIQUE,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                conn.commit()
                print("Migration complete: created items table")
            
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
            
            # Check and add item_id to expenses table
            try:
                conn.execute(text("SELECT item_id FROM expenses LIMIT 1"))
            except Exception:
                print("Adding item_id column to expenses table...")
                conn.execute(text("ALTER TABLE expenses ADD COLUMN item_id INTEGER"))
                conn.commit()
                print("Migration complete: added item_id to expenses")
    except Exception as e:
        print(f"Migration check failed (this is OK for new databases): {e}")

