import os
from sqlalchemy import create_url, create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load env variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

# Create SQLAlchemy engine.
# Note: check_same_thread is only required for SQLite.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency to retrieve database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create database tables and seed default admin if needed."""
    from models import Base, DBAdmin
    from security import get_password_hash
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Seed default admin
    db = SessionLocal()
    try:
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "KarpagamAdmin2026!")
        
        # Check if any admin exists
        existing_admin = db.query(DBAdmin).filter(DBAdmin.username == admin_username).first()
        if not existing_admin:
            hashed_pw = get_password_hash(admin_password)
            default_admin = DBAdmin(username=admin_username, hashed_password=hashed_pw)
            db.add(default_admin)
            db.commit()
            print(f"Database initialized. Seeded default admin: '{admin_username}'")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
