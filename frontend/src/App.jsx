import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  Plus, TrendingUp, TrendingDown, Calendar, 
  ChevronLeft, ChevronRight, X, Receipt, Wallet, PiggyBank,
  ShoppingBag, Utensils, Car, Film, FileText, Heart, BookOpen, MoreHorizontal,
  Trash2, RefreshCw, Table, PieChartIcon, Tag, LogOut, Lock, Sun, Moon
} from 'lucide-react';
import * as api from './api';

const ICONS = {
  'shopping-bag': ShoppingBag,
  'utensils': Utensils,
  'car': Car,
  'film': Film,
  'file-text': FileText,
  'heart': Heart,
  'book': BookOpen,
  'more-horizontal': MoreHorizontal,
};

const ICON_OPTIONS = [
  { value: 'shopping-bag', label: 'Shopping' },
  { value: 'utensils', label: 'Food' },
  { value: 'car', label: 'Car' },
  { value: 'film', label: 'Entertainment' },
  { value: 'file-text', label: 'Bills' },
  { value: 'heart', label: 'Health' },
  { value: 'book', label: 'Education' },
  { value: 'more-horizontal', label: 'Other' },
];

const COLOR_OPTIONS = [
  '#14B8A6', '#06B6D4', '#60A5FA', '#8B5CF6', 
  '#F87171', '#34D399', '#FBBF24', '#94A3B8',
  '#EC4899', '#FB923C', '#84CC16', '#EF4444'
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  }).format(amount);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Custom Donut Chart Label
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="dark:bg-dark-700 bg-white dark:border-dark-500 border-gray-200 border rounded-lg p-3">
        <p className="font-semibold" style={{ color: data.color }}>{data.name}</p>
        <p className="dark:text-gray-300 text-gray-700 font-mono">{formatCurrency(data.total)}</p>
        <p className="dark:text-gray-500 text-gray-600 text-sm">{data.count} transaction{data.count !== 1 ? 's' : ''}</p>
      </div>
    );
  }
  return null;
};

// Login Component
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.login(password);
      onLogin();
    } catch (err) {
      setError(err.message || 'Invalid password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-teal-500 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Makbuz</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your password to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 dark:bg-dark-700 bg-white dark:border-dark-600 border-gray-200 border rounded-xl focus:border-teal-500 text-lg"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              autoFocus
            />
          </div>
          
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-4 bg-teal-500 rounded-xl font-semibold text-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('monthly');
  const [displayMode, setDisplayMode] = useState('chart');
  const [stats, setStats] = useState(null);
  const [yearlyStats, setYearlyStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('makbuz-theme');
    return saved ? saved === 'dark' : true;
  });
  
  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showCategoryDetails, setShowCategoryDetails] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categoryExpenses, setCategoryExpenses] = useState([]);
  
  // Form states
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', category_id: '', date: '', is_recurring: 0, recurring_months: 0 });
  const [incomeForm, setIncomeForm] = useState({ amount: '', description: '', date: '', is_recurring: 0, recurring_months: 0 });
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#14B8A6', icon: 'shopping-bag' });
  const [submitting, setSubmitting] = useState(false);
  
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  // Apply theme on mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove('light');
      root.classList.add('dark');
      localStorage.setItem('makbuz-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('makbuz-theme', 'light');
    }
  }, [isDarkMode]);

  // Apply initial theme on mount (before React renders)
  useEffect(() => {
    const saved = localStorage.getItem('makbuz-theme');
    const root = document.documentElement;
    if (saved === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuthentication();
    
    // Listen for auth expiration
    const handleAuthExpired = () => setIsAuthenticated(false);
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  async function checkAuthentication() {
    const authenticated = await api.checkAuth();
    setIsAuthenticated(authenticated);
  }

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [month, year, view, isAuthenticated]);

  async function loadData() {
    setLoading(true);
    
    // Load categories first (critical for expense form)
    try {
      const cats = await api.getCategories();
      console.log('Categories loaded:', cats);
      setCategories(cats || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
    
    // Load stats and transactions
    try {
      const [statsData, trans] = await Promise.all([
        view === 'monthly' ? api.getMonthlyStats(month, year) : api.getYearlyStats(year),
        api.getTransactions(month, year)
      ]);
      
      if (view === 'monthly') {
        setStats(statsData);
      } else {
        setYearlyStats(statsData);
      }
      setTransactions(trans || []);
    } catch (error) {
      console.error('Failed to load stats/transactions:', error);
    }
    
    setLoading(false);
  }

  async function handleLogout() {
    await api.logout();
    setIsAuthenticated(false);
  }

  // Navigation
  function navigatePrev() {
    if (view === 'monthly') {
      setCurrentDate(new Date(year, month - 2, 1));
    } else {
      setCurrentDate(new Date(year - 1, 0, 1));
    }
  }

  function navigateNext() {
    if (view === 'monthly') {
      setCurrentDate(new Date(year, month, 1));
    } else {
      setCurrentDate(new Date(year + 1, 0, 1));
    }
  }

  // Category click handler
  async function handleCategoryClick(category) {
    setShowCategoryDetails(category);
    try {
      const expenses = await api.getExpenses({ 
        category_id: category.id, 
        month: view === 'monthly' ? month : undefined, 
        year 
      });
      setCategoryExpenses(expenses);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  }

  // Add expense
  async function handleAddExpense(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.createExpense({
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        category_id: parseInt(expenseForm.category_id),
      });
      setShowAddExpense(false);
      setExpenseForm({ amount: '', description: '', category_id: '', date: '', is_recurring: 0, recurring_months: 0 });
      loadData();
    } catch (error) {
      alert('Failed to add expense: ' + error.message);
    }
    setSubmitting(false);
  }

  // Add income
  async function handleAddIncome(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.createIncome({
        ...incomeForm,
        amount: parseFloat(incomeForm.amount),
      });
      setShowAddIncome(false);
      setIncomeForm({ amount: '', description: '', date: '', is_recurring: 0, recurring_months: 0 });
      loadData();
    } catch (error) {
      alert('Failed to add income: ' + error.message);
    }
    setSubmitting(false);
  }

  // Add category
  async function handleAddCategory(e) {
    e.preventDefault();
    if (submitting || !categoryForm.name.trim()) return;
    setSubmitting(true);
    try {
      await api.createCategory(categoryForm);
      setCategoryForm({ name: '', color: '#14B8A6', icon: 'shopping-bag' });
      loadData();
    } catch (error) {
      alert('Failed to add category: ' + error.message);
    }
    setSubmitting(false);
  }

  // Delete category
  async function handleDeleteCategory(id) {
    if (!confirm('Delete this category? This will fail if category has expenses.')) return;
    try {
      await api.deleteCategory(id);
      loadData();
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  }

  // Delete expense
  async function handleDeleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.deleteExpense(id);
      setCategoryExpenses(categoryExpenses.filter(e => e.id !== id));
      loadData();
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  }

  // Delete transaction (from table view)
  async function handleDeleteTransaction(transaction) {
    if (!confirm(`Delete this ${transaction.type}?`)) return;
    try {
      if (transaction.type === 'expense') {
        await api.deleteExpense(transaction.id);
      } else {
        await api.deleteIncome(transaction.id);
      }
      loadData();
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  }

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  // Prepare chart data
  const chartData = stats?.categories
    ?.filter(c => c.total > 0)
    ?.map(c => ({
      name: c.name,
      total: c.total,
      count: c.count,
      color: c.color,
    })) || [];

  const barChartData = yearlyStats?.monthly_breakdown?.map((m, i) => ({
    name: MONTHS[i],
    expenses: m.expenses,
    income: m.income,
  })) || [];

  // Calculate totals for table view
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen animated-bg p-4 md:p-8 pb-24 md:pb-8" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text tracking-tight">Makbuz</h1>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>expense tracker</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              {/* Category Manager Button */}
              <button
                onClick={() => setShowCategoryManager(true)}
                className="p-2 rounded-lg dark:bg-dark-700 bg-white dark:border-dark-600 border-gray-200 border dark:hover:bg-dark-600 hover:bg-gray-50 transition-colors"
                title="Manage Categories"
              >
                <Tag className="w-5 h-5 dark:text-gray-400 text-gray-600" />
              </button>
              
              {/* Display Mode Toggle */}
              <div className="flex gap-1 dark:bg-dark-700 bg-white p-1 rounded-lg">
                <button
                  onClick={() => setDisplayMode('chart')}
                  className={`p-2 rounded-md transition-all ${
                    displayMode === 'chart' 
                      ? 'dark:bg-dark-500 bg-gray-200 text-teal-400' 
                      : 'dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-gray-900'
                  }`}
                  title="Chart View"
                >
                  <PieChartIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDisplayMode('table')}
                  className={`p-2 rounded-md transition-all ${
                    displayMode === 'table' 
                      ? 'dark:bg-dark-500 bg-gray-200 text-teal-400' 
                      : 'dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-gray-900'
                  }`}
                  title="Table View"
                >
                  <Table className="w-4 h-4" />
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex gap-1 dark:bg-dark-700 bg-white p-1 rounded-lg">
                <button
                  onClick={() => setView('monthly')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      view === 'monthly' 
                        ? 'bg-teal-500 text-white' 
                        : 'dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-gray-900'
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setView('yearly')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    view === 'yearly' 
                      ? 'bg-teal-500 text-white' 
                      : 'dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-gray-900'
                  }`}
                >
                  Yearly
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg dark:bg-dark-700 bg-white dark:border-dark-600 border-gray-200 border dark:hover:bg-dark-600 hover:bg-gray-50 transition-colors"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 dark:text-gray-400 text-gray-600" />
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg dark:bg-dark-700 bg-white hover:bg-red-500/20 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={navigatePrev}
              className="p-2 rounded-lg dark:bg-dark-700 bg-white dark:border-dark-600 border-gray-200 border dark:hover:bg-dark-600 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-5 py-2.5 dark:bg-dark-700 bg-white rounded-lg min-w-[180px] justify-center">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span className="font-semibold">
                {view === 'monthly' ? `${MONTH_NAMES[month - 1]} ${year}` : year}
              </span>
            </div>
            <button 
              onClick={navigateNext}
              className="p-2 rounded-lg dark:bg-dark-700 bg-white dark:border-dark-600 border-gray-200 border dark:hover:bg-dark-600 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-slide-up">
              <div className="dark:bg-dark-700 bg-white rounded-xl p-6 card-hover dark:border-dark-600 border-gray-200 border">
                <div className="flex items-center justify-between mb-3">
                  <span className="dark:text-gray-400 text-gray-600 text-sm font-medium">Income</span>
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-400 font-mono">
                  {formatCurrency(view === 'monthly' ? stats?.total_income || 0 : yearlyStats?.total_income || 0)}
                </p>
              </div>

              <div className="dark:bg-dark-700 bg-white rounded-xl p-6 card-hover dark:border-dark-600 border-gray-200 border">
                <div className="flex items-center justify-between mb-3">
                  <span className="dark:text-gray-400 text-gray-600 text-sm font-medium">Expenses</span>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-rose-400 font-mono">
                  {formatCurrency(view === 'monthly' ? stats?.total_expenses || 0 : yearlyStats?.total_expenses || 0)}
                </p>
              </div>

              <div className="dark:bg-dark-700 bg-white rounded-xl p-6 card-hover dark:border-dark-600 border-gray-200 border">
                <div className="flex items-center justify-between mb-3">
                  <span className="dark:text-gray-400 text-gray-600 text-sm font-medium">Balance</span>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-teal-400" />
                  </div>
                </div>
                <p className={`text-2xl font-bold font-mono ${
                  (view === 'monthly' ? stats?.balance : yearlyStats?.balance) >= 0 
                    ? 'text-teal-400' 
                    : 'text-red-400'
                }`}>
                  {formatCurrency(view === 'monthly' ? stats?.balance || 0 : yearlyStats?.balance || 0)}
                </p>
              </div>
            </div>

            {/* Main Content - Chart or Table */}
            {displayMode === 'chart' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Donut Chart */}
                <div className="dark:bg-dark-700 bg-white rounded-xl p-6 dark:border-dark-600 border-gray-200 border animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <PiggyBank className="w-5 h-5 text-teal-400" />
                    Expense Breakdown
                  </h2>
                  
                  {chartData.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={130}
                            paddingAngle={2}
                            dataKey="total"
                            labelLine={false}
                            label={renderCustomLabel}
                            onClick={(data) => {
                              const category = stats.categories.find(c => c.name === data.name);
                              if (category) handleCategoryClick(category);
                            }}
                            cursor="pointer"
                          >
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color}
                                stroke="transparent"
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center dark:text-gray-500 text-gray-400">
                      No expenses yet this {view === 'monthly' ? 'month' : 'year'}
                    </div>
                  )}
                </div>

                {/* Category List or Bar Chart */}
                <div className="dark:bg-dark-700 bg-white rounded-xl p-6 dark:border-dark-600 border-gray-200 border animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  {view === 'monthly' ? (
                    <>
                      <h2 className="text-lg font-semibold mb-4">Categories</h2>
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {stats?.categories?.map((cat) => {
                          const IconComponent = ICONS[cat.icon] || MoreHorizontal;
                          const percentage = stats.total_expenses > 0 
                            ? ((cat.total / stats.total_expenses) * 100).toFixed(1) 
                            : 0;
                          
                          return (
                            <button
                              key={cat.id}
                              onClick={() => handleCategoryClick(cat)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg dark:bg-dark-600/50 bg-gray-50 dark:hover:bg-dark-600 hover:bg-gray-100 transition-all group"
                            >
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${cat.color}20` }}
                              >
                                <IconComponent className="w-5 h-5" style={{ color: cat.color }} />
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium">{cat.name}</p>
                                <p className="text-sm dark:text-gray-500 text-gray-600">{cat.count} transaction{cat.count !== 1 ? 's' : ''}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold font-mono" style={{ color: cat.color }}>{formatCurrency(cat.total)}</p>
                                <p className="text-sm dark:text-gray-500 text-gray-600">{percentage}%</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold mb-4">Monthly Overview</h2>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c2438" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#151b2b', 
                                border: '1px solid #1c2438',
                                borderRadius: '8px',
                                fontFamily: 'DM Mono, monospace'
                              }}
                              formatter={(value) => formatCurrency(value)}
                            />
                            <Bar dataKey="income" fill="#34D399" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Table View */
              <div className="dark:bg-dark-700 bg-white rounded-xl dark:border-dark-600 border-gray-200 border mb-8 animate-slide-up overflow-hidden">
                <div className="p-4 dark:border-b-dark-600 border-b-gray-200 border-b flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-semibold">
                    Transactions - {MONTH_NAMES[month - 1]} {year}
                  </h2>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-400 font-mono">+{formatCurrency(totalIncome)}</span>
                    <span className="text-rose-400 font-mono">-{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="dark:border-b-dark-600 border-b-gray-200 border-b text-left text-sm dark:text-gray-400 text-gray-600">
                        <th className="p-4 font-medium">Date</th>
                        <th className="p-4 font-medium">Description</th>
                        <th className="p-4 font-medium">Category</th>
                        <th className="p-4 font-medium text-right">Amount</th>
                        <th className="p-4 font-medium w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length > 0 ? (
                        transactions.map((t, idx) => (
                          <tr key={`${t.type}-${t.id}-${idx}`} className="dark:border-b-dark-600/50 border-b-gray-200/50 border-b dark:hover:bg-dark-600/30 hover:bg-gray-50">
                            <td className="p-4 text-sm dark:text-gray-400 text-gray-600 font-mono">{formatDate(t.date)}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span>{t.description}</span>
                                {t.is_recurring && (
                                  <RefreshCw className="w-3.5 h-3.5 text-teal-400" title="Recurring" />
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                style={{ backgroundColor: `${t.category_color}20`, color: t.category_color }}
                              >
                                {t.category}
                              </span>
                            </td>
                            <td className={`p-4 text-right font-mono font-semibold ${t.type === 'income' ? 'text-green-400' : 'text-rose-400'}`}>
                              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => handleDeleteTransaction(t)}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 dark:text-gray-500 text-gray-600 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-8 text-center dark:text-gray-500 text-gray-400">
                            No transactions this month
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons - Fixed on mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 dark:bg-dark-900 bg-gray-50 md:static md:bg-transparent md:p-0">
              <div className="flex justify-center gap-4 max-w-6xl mx-auto">
                <button
                  onClick={() => {
                    setIncomeForm({ ...incomeForm, date: new Date().toISOString().split('T')[0] });
                    setShowAddIncome(true);
                  }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-500 rounded-xl font-medium hover:bg-green-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Income</span>
                </button>
                <button
                  onClick={async () => {
                    // Ensure categories are loaded
                    if (categories.length === 0) {
                      try {
                        const cats = await api.getCategories();
                        setCategories(cats || []);
                      } catch (e) {
                        console.error('Failed to load categories:', e);
                      }
                    }
                    setExpenseForm({ 
                      ...expenseForm, 
                      date: new Date().toISOString().split('T')[0],
                      category_id: categories[0]?.id || ''
                    });
                    setShowAddExpense(true);
                  }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 rounded-xl font-medium hover:bg-teal-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Expense</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <Modal onClose={() => setShowAddExpense(false)} title="Add Expense">
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-sm dark:text-gray-400 text-gray-600 mb-2 font-medium">Amount (€)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="w-full font-mono text-lg"
              />
            </div>
            <div>
              <label className="block text-sm dark:text-gray-400 text-gray-600 mb-2 font-medium">Description</label>
              <input
                type="text"
                required
                placeholder="What did you spend on?"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm dark:text-gray-400 text-gray-600 mb-2 font-medium">Category</label>
              {categories.length === 0 ? (
                <div className="text-amber-400 text-sm p-3 bg-amber-500/10 rounded-lg">
                  No categories found. Please add categories first in the category manager (🏷️ icon).
                </div>
              ) : (
                <select
                  required
                  value={expenseForm.category_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category_id: e.target.value })}
                  className="w-full"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm dark:text-gray-400 text-gray-600 mb-2 font-medium">Date</label>
              <input
                type="date"
                required
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="space-y-3 p-3 dark:bg-dark-600/50 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="expense-recurring"
                  checked={expenseForm.is_recurring === 1}
                  onChange={(e) => setExpenseForm({ ...expenseForm, is_recurring: e.target.checked ? 1 : 0, recurring_months: e.target.checked ? expenseForm.recurring_months : 0 })}
                  className="w-4 h-4 rounded accent-teal-500"
                />
                <label htmlFor="expense-recurring" className="text-sm dark:text-gray-300 text-gray-700 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-teal-400" />
                  Recurring monthly (e.g., rent, subscriptions)
                </label>
              </div>
              {expenseForm.is_recurring === 1 && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={expenseForm.recurring_months || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                      setExpenseForm({ ...expenseForm, recurring_months: val });
                    }}
                    className="flex-1 text-sm font-mono"
                  />
                  <span className="text-sm dark:text-gray-300 text-gray-700">Months</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-teal-500 rounded-lg font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Expense'}
            </button>
          </form>
        </Modal>
      )}

      {/* Add Income Modal */}
      {showAddIncome && (
        <Modal onClose={() => setShowAddIncome(false)} title="Add Income">
          <form onSubmit={handleAddIncome} className="space-y-4">
            <div>
              <label className="block text-sm dark:text-gray-400 text-gray-600 mb-2 font-medium">Amount (€)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                className="w-full font-mono text-lg"
              />
            </div>
            <div>
              <label className="block text-sm dark:text-gray-400 text-gray-600 mb-2 font-medium">Description</label>
              <input
                type="text"
                required
                placeholder="Salary, freelance, etc."
                value={incomeForm.description}
                onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm dark:text-gray-400 text-gray-600 mb-2 font-medium">Date</label>
              <input
                type="date"
                required
                value={incomeForm.date}
                onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="space-y-3 p-3 dark:bg-dark-600/50 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="income-recurring"
                  checked={incomeForm.is_recurring === 1}
                  onChange={(e) => setIncomeForm({ ...incomeForm, is_recurring: e.target.checked ? 1 : 0, recurring_months: e.target.checked ? incomeForm.recurring_months : 0 })}
                  className="w-4 h-4 rounded accent-green-500"
                />
                <label htmlFor="income-recurring" className="text-sm dark:text-gray-300 text-gray-700 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-green-400" />
                  Recurring monthly (e.g., salary)
                </label>
              </div>
              {incomeForm.is_recurring === 1 && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={incomeForm.recurring_months || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                      setIncomeForm({ ...incomeForm, recurring_months: val });
                    }}
                    className="flex-1 text-sm font-mono"
                  />
                  <span className="text-sm dark:text-gray-300 text-gray-700">Months</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-green-500 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Income'}
            </button>
          </form>
        </Modal>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <Modal onClose={() => setShowCategoryManager(false)} title="Manage Categories" wide>
          <div className="space-y-6">
            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="space-y-4 p-4 dark:bg-dark-600/30 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm dark:text-gray-400 text-gray-600 uppercase tracking-wide">Add New Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm dark:text-gray-400 text-gray-600 mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="Category name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm dark:text-gray-400 text-gray-600 mb-2">Icon</label>
                  <select
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-full"
                  >
                    {ICON_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm dark:text-gray-400 text-gray-600 mb-2">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, color })}
                        className={`w-7 h-7 rounded-lg transition-all ${categoryForm.color === color ? 'ring-2 ring-white dark:ring-offset-dark-700 ring-offset-white' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || !categoryForm.name.trim()}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Add Category
              </button>
            </form>

            {/* Category List */}
            <div>
              <h3 className="font-semibold text-sm dark:text-gray-400 text-gray-600 uppercase tracking-wide mb-3">Existing Categories</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map(cat => {
                  const IconComponent = ICONS[cat.icon] || MoreHorizontal;
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-3 dark:bg-dark-600/30 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          <IconComponent className="w-4 h-4" style={{ color: cat.color }} />
                        </div>
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 dark:text-gray-500 text-gray-600 hover:text-red-400 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Category Details Modal */}
      {showCategoryDetails && (
        <Modal 
          onClose={() => { setShowCategoryDetails(null); setCategoryExpenses([]); }} 
          title={showCategoryDetails.name}
          wide
        >
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {categoryExpenses.length > 0 ? (
              categoryExpenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between p-4 dark:bg-dark-600/50 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{expense.description}</p>
                      {expense.is_recurring === 1 && (
                        <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
                      )}
                    </div>
                    <p className="text-sm dark:text-gray-500 text-gray-600">{formatDate(expense.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold font-mono" style={{ color: showCategoryDetails.color }}>
                      {formatCurrency(expense.amount)}
                    </p>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center dark:text-gray-500 text-gray-400 py-8">No expenses in this category</p>
            )}
          </div>
          <div className="mt-4 pt-4 dark:border-t-dark-600 border-t-gray-200 border-t flex justify-between items-center">
            <span className="dark:text-gray-400 text-gray-600 font-medium">Total</span>
            <span className="text-xl font-bold font-mono" style={{ color: showCategoryDetails.color }}>
              {formatCurrency(showCategoryDetails.total)}
            </span>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Modal Component
function Modal({ children, onClose, title, wide = false }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className={`dark:bg-dark-700 bg-white rounded-2xl dark:border-dark-600 border-gray-200 border max-h-[90vh] overflow-y-auto ${wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 dark:border-b-dark-600 border-b-gray-200 border-b sticky top-0 dark:bg-dark-700 bg-white z-10">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg dark:hover:bg-dark-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
