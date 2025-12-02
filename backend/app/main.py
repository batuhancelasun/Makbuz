from fastapi import FastAPI, Depends, HTTPException, Query, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
import os

from .database import engine, get_db, Base
from . import models, schemas
from .auth import verify_password, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_DAYS

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Makbuz", description="Personal Expense Tracker")

# CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ AUTH SCHEMAS ============

class LoginRequest(BaseModel):
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ============ SETTINGS SCHEMAS ============

class SettingsUpdate(BaseModel):
    currency: Optional[str] = None

# ============ SEED DATA ============

DEFAULT_CATEGORIES = [
    {"name": "Shopping", "color": "#14B8A6", "icon": "shopping-bag"},
    {"name": "Food & Dining", "color": "#FB923C", "icon": "utensils"},
    {"name": "Transportation", "color": "#60A5FA", "icon": "car"},
    {"name": "Entertainment", "color": "#8B5CF6", "icon": "film"},
    {"name": "Bills & Utilities", "color": "#F87171", "icon": "file-text"},
    {"name": "Healthcare", "color": "#34D399", "icon": "heart"},
    {"name": "Education", "color": "#FBBF24", "icon": "book"},
    {"name": "Other", "color": "#94A3B8", "icon": "more-horizontal"},
]

def seed_categories(db: Session):
    existing = db.query(models.Category).first()
    if not existing:
        for cat in DEFAULT_CATEGORIES:
            db.add(models.Category(**cat))
        db.commit()
        print(f"Seeded {len(DEFAULT_CATEGORIES)} default categories")

def seed_settings(db: Session):
    # Default currency
    existing = db.query(models.Settings).filter(models.Settings.key == "currency").first()
    if not existing:
        db.add(models.Settings(key="currency", value="EUR"))
        db.commit()

@app.on_event("startup")
def startup():
    db = next(get_db())
    seed_categories(db)
    seed_settings(db)
    db.close()

# ============ AUTH ENDPOINTS ============

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest, response: Response):
    if not verify_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    access_token = create_access_token(data={"authenticated": True})
    
    # Set cookie for browser
    response.set_cookie(
        key="makbuz_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=False  # Set to True if using HTTPS
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie("makbuz_token")
    return {"message": "Logged out"}

@app.get("/api/auth/check")
async def check_auth(request: Request):
    """Check if user is authenticated"""
    from .auth import security, verify_token
    
    # Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        if verify_token(token):
            return {"authenticated": True}
    
    # Check cookie
    token = request.cookies.get("makbuz_token")
    if token and verify_token(token):
        return {"authenticated": True}
    
    return {"authenticated": False}

# ============ SETTINGS ENDPOINTS ============

@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db), _: bool = Depends(get_current_user)):
    settings = db.query(models.Settings).all()
    return {s.key: s.value for s in settings}

@app.put("/api/settings")
def update_settings(
    settings: SettingsUpdate, 
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    if settings.currency:
        if settings.currency not in ["EUR"]:
            raise HTTPException(status_code=400, detail="Invalid currency")
        
        db_setting = db.query(models.Settings).filter(models.Settings.key == "currency").first()
        if db_setting:
            db_setting.value = settings.currency
        else:
            db.add(models.Settings(key="currency", value=settings.currency))
        db.commit()
    
    return {"message": "Settings updated"}

# ============ CATEGORY ENDPOINTS ============

@app.get("/api/categories", response_model=List[schemas.Category])
def get_categories(db: Session = Depends(get_db), _: bool = Depends(get_current_user)):
    categories = db.query(models.Category).all()
    # Auto-seed if no categories exist
    if not categories:
        for cat in DEFAULT_CATEGORIES:
            db.add(models.Category(**cat))
        db.commit()
        categories = db.query(models.Category).all()
    return categories

@app.post("/api/categories/seed")
def seed_default_categories(db: Session = Depends(get_db), _: bool = Depends(get_current_user)):
    """Manually seed default categories (won't duplicate existing)"""
    existing_names = {c.name for c in db.query(models.Category).all()}
    added = 0
    for cat in DEFAULT_CATEGORIES:
        if cat["name"] not in existing_names:
            db.add(models.Category(**cat))
            added += 1
    db.commit()
    return {"message": f"Added {added} categories"}

@app.post("/api/categories", response_model=schemas.Category)
def create_category(
    category: schemas.CategoryCreate, 
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.put("/api/categories/{category_id}", response_model=schemas.Category)
def update_category(
    category_id: int, 
    category: schemas.CategoryUpdate, 
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

@app.delete("/api/categories/{category_id}")
def delete_category(
    category_id: int, 
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category has expenses
    expense_count = db.query(models.Expense).filter(models.Expense.category_id == category_id).count()
    if expense_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete category with expenses")
    
    db.delete(db_category)
    db.commit()
    return {"message": "Category deleted"}

# ============ EXPENSE ENDPOINTS ============

@app.get("/api/expenses", response_model=List[schemas.ExpenseWithCategory])
def get_expenses(
    category_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    limit: int = Query(default=100, le=1000),
    offset: int = 0,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    query = db.query(models.Expense)
    
    if category_id:
        query = query.filter(models.Expense.category_id == category_id)
    if month:
        query = query.filter(extract('month', models.Expense.date) == month)
    if year:
        query = query.filter(extract('year', models.Expense.date) == year)
    
    return query.order_by(models.Expense.date.desc()).offset(offset).limit(limit).all()

@app.post("/api/expenses", response_model=schemas.Expense)
def create_expense(
    expense: schemas.ExpenseCreate, 
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    # Verify category exists
    category = db.query(models.Category).filter(models.Category.id == expense.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.put("/api/expenses/{expense_id}", response_model=schemas.Expense)
def update_expense(
    expense_id: int, 
    expense: schemas.ExpenseUpdate, 
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_data = expense.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_expense, key, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.delete("/api/expenses/{expense_id}")
def delete_expense(
    expense_id: int, 
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(db_expense)
    db.commit()
    return {"message": "Expense deleted"}

# ============ INCOME ENDPOINTS ============

@app.get("/api/incomes", response_model=List[schemas.Income])
def get_incomes(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    query = db.query(models.Income)
    
    if month:
        query = query.filter(extract('month', models.Income.date) == month)
    if year:
        query = query.filter(extract('year', models.Income.date) == year)
    
    return query.order_by(models.Income.date.desc()).all()

@app.post("/api/incomes", response_model=schemas.Income)
def create_income(
    income: schemas.IncomeCreate, 
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    db_income = models.Income(**income.model_dump())
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income

@app.put("/api/incomes/{income_id}", response_model=schemas.Income)
def update_income(
    income_id: int, 
    income: schemas.IncomeUpdate, 
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    db_income = db.query(models.Income).filter(models.Income.id == income_id).first()
    if not db_income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    update_data = income.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_income, key, value)
    
    db.commit()
    db.refresh(db_income)
    return db_income

@app.delete("/api/incomes/{income_id}")
def delete_income(
    income_id: int, 
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    db_income = db.query(models.Income).filter(models.Income.id == income_id).first()
    if not db_income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    db.delete(db_income)
    db.commit()
    return {"message": "Income deleted"}

# ============ TRANSACTIONS ENDPOINT (Table View) ============

@app.get("/api/transactions")
def get_transactions(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    """Get all transactions (expenses and income) for a given period"""
    if month is None:
        month = datetime.now().month
    if year is None:
        year = datetime.now().year
    
    # Get expenses for the period
    expenses = db.query(models.Expense).filter(
        extract('month', models.Expense.date) == month,
        extract('year', models.Expense.date) == year
    ).all()
    
    # Get recurring expenses (from previous months that should apply)
    recurring_expenses = db.query(models.Expense).filter(
        models.Expense.is_recurring == 1,
        models.Expense.date <= date(year, month, 28)
    ).all()
    
    # Get income for the period
    incomes = db.query(models.Income).filter(
        extract('month', models.Income.date) == month,
        extract('year', models.Income.date) == year
    ).all()
    
    # Get recurring income
    recurring_incomes = db.query(models.Income).filter(
        models.Income.is_recurring == 1,
        models.Income.date <= date(year, month, 28)
    ).all()
    
    transactions = []
    
    # Add regular expenses
    seen_recurring_expenses = set()
    for exp in expenses:
        cat = db.query(models.Category).filter(models.Category.id == exp.category_id).first()
        transactions.append({
            "id": exp.id,
            "type": "expense",
            "amount": exp.amount,
            "description": exp.description,
            "category": cat.name if cat else "Unknown",
            "category_color": cat.color if cat else "#94A3B8",
            "date": exp.date.isoformat(),
            "is_recurring": exp.is_recurring == 1
        })
        if exp.is_recurring == 1:
            seen_recurring_expenses.add(exp.id)
    
    # Add recurring expenses that weren't already added
    for exp in recurring_expenses:
        if exp.id not in seen_recurring_expenses:
            cat = db.query(models.Category).filter(models.Category.id == exp.category_id).first()
            transactions.append({
                "id": exp.id,
                "type": "expense",
                "amount": exp.amount,
                "description": f"{exp.description} (recurring)",
                "category": cat.name if cat else "Unknown",
                "category_color": cat.color if cat else "#94A3B8",
                "date": date(year, month, min(exp.date.day, 28)).isoformat(),
                "is_recurring": True
            })
    
    # Add regular income
    seen_recurring_incomes = set()
    for inc in incomes:
        transactions.append({
            "id": inc.id,
            "type": "income",
            "amount": inc.amount,
            "description": inc.description,
            "category": "Income",
            "category_color": "#34D399",
            "date": inc.date.isoformat(),
            "is_recurring": inc.is_recurring == 1
        })
        if inc.is_recurring == 1:
            seen_recurring_incomes.add(inc.id)
    
    # Add recurring income that wasn't already added
    for inc in recurring_incomes:
        if inc.id not in seen_recurring_incomes:
            transactions.append({
                "id": inc.id,
                "type": "income",
                "amount": inc.amount,
                "description": f"{inc.description} (recurring)",
                "category": "Income",
                "category_color": "#34D399",
                "date": date(year, month, min(inc.date.day, 28)).isoformat(),
                "is_recurring": True
            })
    
    # Sort by date descending
    transactions.sort(key=lambda x: x["date"], reverse=True)
    
    return transactions

# ============ DASHBOARD/STATS ENDPOINTS ============

@app.get("/api/stats/monthly")
def get_monthly_stats(
    month: int = Query(default=None),
    year: int = Query(default=None),
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    if month is None:
        month = datetime.now().month
    if year is None:
        year = datetime.now().year
    
    # Get total expenses by category
    category_totals = db.query(
        models.Category.id,
        models.Category.name,
        models.Category.color,
        models.Category.icon,
        func.coalesce(func.sum(models.Expense.amount), 0).label('total'),
        func.count(models.Expense.id).label('count')
    ).outerjoin(
        models.Expense,
        (models.Category.id == models.Expense.category_id) &
        (extract('month', models.Expense.date) == month) &
        (extract('year', models.Expense.date) == year)
    ).group_by(models.Category.id).all()
    
    # Get total income
    total_income = db.query(func.coalesce(func.sum(models.Income.amount), 0)).filter(
        extract('month', models.Income.date) == month,
        extract('year', models.Income.date) == year
    ).scalar()
    
    total_expenses = sum(cat.total for cat in category_totals)
    
    categories = [
        {
            "id": cat.id,
            "name": cat.name,
            "color": cat.color,
            "icon": cat.icon,
            "total": float(cat.total),
            "count": cat.count
        }
        for cat in category_totals
    ]
    
    return {
        "month": month,
        "year": year,
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "balance": float(total_income - total_expenses),
        "categories": categories
    }

@app.get("/api/stats/yearly")
def get_yearly_stats(
    year: int = Query(default=None),
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user)
):
    if year is None:
        year = datetime.now().year
    
    # Monthly breakdown
    monthly_data = []
    for month in range(1, 13):
        expenses = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
            extract('month', models.Expense.date) == month,
            extract('year', models.Expense.date) == year
        ).scalar()
        
        income = db.query(func.coalesce(func.sum(models.Income.amount), 0)).filter(
            extract('month', models.Income.date) == month,
            extract('year', models.Income.date) == year
        ).scalar()
        
        monthly_data.append({
            "month": month,
            "expenses": float(expenses),
            "income": float(income),
            "balance": float(income - expenses)
        })
    
    total_income = sum(m["income"] for m in monthly_data)
    total_expenses = sum(m["expenses"] for m in monthly_data)
    
    return {
        "year": year,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": total_income - total_expenses,
        "monthly_breakdown": monthly_data
    }

# ============ SERVE FRONTEND ============

# Check if static files exist (production mode)
static_path = "/app/static"
if os.path.exists(static_path):
    app.mount("/assets", StaticFiles(directory=f"{static_path}/assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # API routes are handled above
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        file_path = f"{static_path}/{full_path}"
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(f"{static_path}/index.html")
