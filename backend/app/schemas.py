from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

# Item schemas
class ItemBase(BaseModel):
    name: str

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ItemWithCount(Item):
    count: int = 0

# Category schemas
class CategoryBase(BaseModel):
    name: str
    color: Optional[str] = "#8B5CF6"
    icon: Optional[str] = "shopping-bag"

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class Category(CategoryBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CategoryWithTotal(Category):
    total: float = 0
    expense_count: int = 0

# Expense schemas
class ExpenseBase(BaseModel):
    amount: float
    description: str
    category_id: int
    item_id: Optional[int] = None
    date: date
    is_recurring: Optional[int] = 0
    recurring_months: Optional[int] = 0  # 0: infinite, >0: number of months

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    item_id: Optional[int] = None
    date: Optional[date] = None
    is_recurring: Optional[int] = None
    recurring_months: Optional[int] = None

class Expense(ExpenseBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ExpenseWithCategory(Expense):
    category: Category
    item: Optional[Item] = None

# Income schemas
class IncomeBase(BaseModel):
    amount: float
    description: str
    date: date
    is_recurring: Optional[int] = 0
    recurring_months: Optional[int] = 0  # 0: infinite, >0: number of months

class IncomeCreate(IncomeBase):
    pass

class IncomeUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[date] = None
    is_recurring: Optional[int] = None
    recurring_months: Optional[int] = None

class Income(IncomeBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard schemas
class MonthlyStats(BaseModel):
    month: str
    year: int
    total_income: float
    total_expenses: float
    balance: float
    categories: List[CategoryWithTotal]

class YearlyStats(BaseModel):
    year: int
    total_income: float
    total_expenses: float
    balance: float
    monthly_breakdown: List[dict]

