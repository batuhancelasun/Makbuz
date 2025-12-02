from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    color = Column(String, default="#8B5CF6")  # Default purple
    icon = Column(String, default="shopping-bag")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    expenses = relationship("Expense", back_populates="category")

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    date = Column(Date, nullable=False)
    is_recurring = Column(Integer, default=0)  # 0: one-time, 1: monthly
    recurring_months = Column(Integer, default=0)  # 0: infinite, >0: number of months
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    category = relationship("Category", back_populates="expenses")

class Income(Base):
    __tablename__ = "incomes"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    is_recurring = Column(Integer, default=0)  # 0: one-time, 1: monthly
    recurring_months = Column(Integer, default=0)  # 0: infinite, >0: number of months
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Settings(Base):
    __tablename__ = "settings"
    
    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)

