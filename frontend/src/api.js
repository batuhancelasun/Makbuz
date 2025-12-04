const API_BASE = '/api';

// Store token in memory
let authToken = localStorage.getItem('makbuz_token') || null;

// Generic fetch wrapper with auth
async function fetchAPI(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    credentials: 'include', // Include cookies
    ...options,
  });
  
  if (response.status === 401) {
    // Clear token and redirect to login
    authToken = null;
    localStorage.removeItem('makbuz_token');
    window.dispatchEvent(new Event('auth-expired'));
    throw new Error('Session expired');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Request failed');
  }
  
  return response.json();
}

// Auth
export const login = async (password) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Invalid password' }));
    throw new Error(error.detail || 'Login failed');
  }
  
  const data = await response.json();
  authToken = data.access_token;
  localStorage.setItem('makbuz_token', authToken);
  return data;
};

export const logout = async () => {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (e) {
    // Ignore errors
  }
  authToken = null;
  localStorage.removeItem('makbuz_token');
};

export const checkAuth = async () => {
  try {
    const response = await fetch(`${API_BASE}/auth/check`, {
      credentials: 'include',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
    });
    const data = await response.json();
    return data.authenticated;
  } catch (e) {
    return false;
  }
};

// Settings
export const getSettings = () => fetchAPI('/settings');
export const updateSettings = (data) => fetchAPI('/settings', {
  method: 'PUT',
  body: JSON.stringify(data),
});

// Categories
export const getCategories = () => fetchAPI('/categories');
export const createCategory = (data) => fetchAPI('/categories', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const updateCategory = (id, data) => fetchAPI(`/categories/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const deleteCategory = (id) => fetchAPI(`/categories/${id}`, {
  method: 'DELETE',
});

// Items
export const getItems = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.category_id) searchParams.set('category_id', params.category_id);
  if (params.search) searchParams.set('search', params.search);
  const query = searchParams.toString();
  return fetchAPI(`/items${query ? `?${query}` : ''}`);
};
export const getItemsByCategory = (categoryId) => fetchAPI(`/items/by-category/${categoryId}`);
export const createItem = (data) => fetchAPI('/items', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const deleteItem = (id) => fetchAPI(`/items/${id}`, {
  method: 'DELETE',
});

// Expenses
export const getExpenses = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.category_id) searchParams.set('category_id', params.category_id);
  if (params.month) searchParams.set('month', params.month);
  if (params.year) searchParams.set('year', params.year);
  const query = searchParams.toString();
  return fetchAPI(`/expenses${query ? `?${query}` : ''}`);
};
export const createExpense = (data) => fetchAPI('/expenses', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const updateExpense = (id, data) => fetchAPI(`/expenses/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const deleteExpense = (id) => fetchAPI(`/expenses/${id}`, {
  method: 'DELETE',
});

// Income
export const getIncomes = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.month) searchParams.set('month', params.month);
  if (params.year) searchParams.set('year', params.year);
  const query = searchParams.toString();
  return fetchAPI(`/incomes${query ? `?${query}` : ''}`);
};
export const createIncome = (data) => fetchAPI('/incomes', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const updateIncome = (id, data) => fetchAPI(`/incomes/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const deleteIncome = (id) => fetchAPI(`/incomes/${id}`, {
  method: 'DELETE',
});

// Stats
export const getMonthlyStats = (month, year) => {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  if (year) params.set('year', year);
  const query = params.toString();
  return fetchAPI(`/stats/monthly${query ? `?${query}` : ''}`);
};

export const getYearlyStats = (year) => {
  const params = new URLSearchParams();
  if (year) params.set('year', year);
  const query = params.toString();
  return fetchAPI(`/stats/yearly${query ? `?${query}` : ''}`);
};

// Transactions (combined view)
export const getTransactions = (month, year) => {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  if (year) params.set('year', year);
  const query = params.toString();
  return fetchAPI(`/transactions${query ? `?${query}` : ''}`);
};
