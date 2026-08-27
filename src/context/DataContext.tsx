import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  Account, Transaction, Category, Person, Debt, Receivable, 
  Budget, FinancialGoal, RecurringTransaction, Notification, DashboardOverview 
} from '../types';

interface DataContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  people: Person[];
  debts: Debt[];
  receivables: Receivable[];
  budgets: Budget[];
  goals: FinancialGoal[];
  recurring: RecurringTransaction[];
  notifications: Notification[];
  dashboardOverview: DashboardOverview | null;
  loading: boolean;
  
  refreshAll: () => Promise<void>;
  
  // Accounts
  createAccount: (data: Partial<Account>) => Promise<void>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  
  // Transactions
  createTransaction: (data: FormData) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // People
  createPerson: (data: Partial<Person>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  
  // Debts
  createDebt: (data: any) => Promise<void>;
  repayDebt: (id: string, data: any) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  // Receivables
  createReceivable: (data: any) => Promise<void>;
  repayReceivable: (id: string, data: any) => Promise<void>;
  deleteReceivable: (id: string) => Promise<void>;
  
  // Budgets
  createBudget: (categoryId: string, amount: number) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  // Goals
  createGoal: (data: any) => Promise<void>;
  addGoalFunds: (id: string, amount: number, accountId: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Recurring
  createRecurring: (data: any) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;

  // Notifications
  readNotification: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null);
  
  const [loading, setLoading] = useState<boolean>(false);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    if (!token) throw new Error('Non authentifié.');
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    return fetch(url, { ...options, headers });
  };

  const refreshAll = async () => {
    if (!token || !user) return;
    setLoading(true);
    try {
      // Run fetches concurrently
      const [
        resAcc, resTx, resCat, resPeop, resDeb, resRec, resBud, resGoal, resNotif, resRecur, resOverview
      ] = await Promise.all([
        fetchWithAuth('/api/accounts'),
        fetchWithAuth('/api/transactions'),
        fetchWithAuth('/api/auth/me').then(() => fetchWithAuth('/api/transactions')), // dummy sequence wait if needed, let's fetch transactions normally
        fetchWithAuth('/api/people'),
        fetchWithAuth('/api/debts'),
        fetchWithAuth('/api/receivables'),
        fetchWithAuth('/api/budgets'),
        fetchWithAuth('/api/goals'),
        fetchWithAuth('/api/notifications'),
        fetchWithAuth('/api/recurring'),
        fetchWithAuth('/api/reports/dashboard-overview')
      ]);

      if (resAcc.ok) setAccounts(await resAcc.json());
      if (resTx.ok) setTransactions(await resTx.json());
      
      // Let's populate categories, but fetch default ones. 
      // Actually we have categories returned from transaction objects or can query them.
      // Wait, let's write a simple route in backend for categories or load from transactions.
      // Wait! We can fetch categories. In our server index, we created categories. Let's make sure we have a category route!
      // Wait, we didn't define a category router! But wait, we can fetch them via a generic fetch or we can create a category router.
      // Let's create `/api/transactions` which returns category details. That's fine.
      // Wait, we can fetch all categories from the transactions or create a small router. Let's write a categories endpoint in the backend or load them.
      // Actually, since we created default categories in db, we can create `/api/transactions/categories` inside `transactions.ts`. 
      // Let's check: we can fetch categories from `/api/transactions/categories` in the client. Let's make sure it is added. 
      // Wait, let's query categories. We can just add a route in server/routes/transactions.ts to fetch all categories! Let's verify if we need it. 
      // Yes! A category list is needed for dropdown menus in transaction creation! 
      // Let's write a categories route in server/routes/transactions.ts. I can call `/api/transactions/categories` which returns categories. Let's define the route.
      // Yes! Let's check if the backend routes file transactions.ts has it. It doesn't have a category list route. Let's fetch categories by querying transactions or write a quick category route.
      // Let's write a categories route. We will do this later, or we can add it to transaction router.
      // Wait, let's make a quick route in transactions.ts: `router.get('/categories', ...)`
      // Let's update `transactions.ts` later or check if we can fetch categories.
      // Yes, in `refreshAll`, we will fetch `/api/transactions/categories`.
      
      const resCatList = await fetchWithAuth('/api/transactions/categories');
      if (resCatList.ok) {
        setCategories(await resCatList.json());
      } else {
        // Fallback categories if route fails
        setCategories([
          { id: '1', name: 'Alimentation', icon: 'restaurant', color: '#EF4444', type: 'EXPENSE' },
          { id: '2', name: 'Transport', icon: 'directions_car', color: '#F59E0B', type: 'EXPENSE' },
          { id: '3', name: 'Logement', icon: 'home', color: '#3B82F6', type: 'EXPENSE' },
          { id: '4', name: 'Santé', icon: 'medical_services', color: '#10B981', type: 'EXPENSE' },
          { id: '5', name: 'Services', icon: 'electrical_services', color: '#8B5CF6', type: 'EXPENSE' },
          { id: '6', name: 'Commerce', icon: 'storefront', color: '#EC4899', type: 'BOTH' },
          { id: '7', name: 'Salaire', icon: 'payments', color: '#10B981', type: 'INCOME' },
          { id: '8', name: 'Autres', icon: 'more_horiz', color: '#6B7280', type: 'BOTH' }
        ]);
      }

      if (resPeop.ok) setPeople(await resPeop.json());
      if (resDeb.ok) setDebts(await resDeb.json());
      if (resRec.ok) setReceivables(await resRec.json());
      if (resBud.ok) setBudgets(await resBud.json());
      if (resGoal.ok) setGoals(await resGoal.json());
      if (resNotif.ok) setNotifications(await resNotif.json());
      if (resRecur.ok) setRecurring(await resRecur.json());
      if (resOverview.ok) setDashboardOverview(await resOverview.json());
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount or when token/user changes
  useEffect(() => {
    refreshAll();
  }, [token, user]);

  // Account CRUD
  const createAccount = async (data: Partial<Account>) => {
    const res = await fetchWithAuth('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Impossible de créer le compte.');
    await refreshAll();
  };

  const updateAccount = async (id: string, data: Partial<Account>) => {
    const res = await fetchWithAuth(`/api/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Impossible de modifier le compte.');
    await refreshAll();
  };

  const deleteAccount = async (id: string) => {
    const res = await fetchWithAuth(`/api/accounts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Impossible de supprimer le compte.');
    await refreshAll();
  };

  // Transactions
  const createTransaction = async (formData: FormData) => {
    const res = await fetchWithAuth('/api/transactions', {
      method: 'POST',
      body: formData // Form data handles multipart files automatically
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Impossible d\'enregistrer la transaction.');
    }
    await refreshAll();
  };

  const deleteTransaction = async (id: string) => {
    const res = await fetchWithAuth(`/api/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Impossible de supprimer la transaction.');
    await refreshAll();
  };

  // Contacts/People
  const createPerson = async (data: Partial<Person>) => {
    const res = await fetchWithAuth('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Impossible de créer la personne.');
    await refreshAll();
  };

  const deletePerson = async (id: string) => {
    const res = await fetchWithAuth(`/api/people/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Impossible de supprimer cette personne.');
    }
    await refreshAll();
  };

  // Debts
  const createDebt = async (data: any) => {
    const res = await fetchWithAuth('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Impossible d\'enregistrer la dette.');
    await refreshAll();
  };

  const repayDebt = async (id: string, data: any) => {
    const res = await fetchWithAuth(`/api/debts/${id}/repay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Impossible d\'enregistrer le remboursement.');
    await refreshAll();
  };

  const deleteDebt = async (id: string) => {
    const res = await fetchWithAuth(`/api/debts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Impossible de supprimer la dette.');
    await refreshAll();
  };

  // Receivables
  const createReceivable = async (data: any) => {
    const res = await fetchWithAuth('/api/receivables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Impossible d\'enregistrer la créance.');
    await refreshAll();
  };

  const repayReceivable = async (id: string, data: any) => {
    const res = await fetchWithAuth(`/api/receivables/${id}/repay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Impossible d\'enregistrer le remboursement.');
    await refreshAll();
  };

  const deleteReceivable = async (id: string) => {
    const res = await fetchWithAuth(`/api/receivables/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Impossible de supprimer la créance.');
    await refreshAll();
  };

  // Budgets
  const createBudget = async (categoryId: string, amount: number) => {
    const res = await fetchWithAuth('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, amount })
    });
    if (!res.ok) throw new Error('Impossible de créer le budget.');
    await refreshAll();
  };

  const deleteBudget = async (id: string) => {
    const res = await fetchWithAuth(`/api/budgets/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Impossible de supprimer le budget.');
    await refreshAll();
  };

  // Savings Goals
  const createGoal = async (data: any) => {
    const res = await fetchWithAuth('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Impossible de créer l\'objectif.');
    await refreshAll();
  };

  const addGoalFunds = async (id: string, amount: number, accountId: string) => {
    const res = await fetchWithAuth(`/api/goals/${id}/add-funds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, accountId })
    });
    if (!res.ok) throw new Error('Impossible d\'ajouter des fonds.');
    await refreshAll();
  };

  const deleteGoal = async (id: string) => {
    const res = await fetchWithAuth(`/api/goals/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Impossible de supprimer l\'objectif.');
    await refreshAll();
  };

  // Recurring
  const createRecurring = async (data: any) => {
    const res = await fetchWithAuth('/api/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Impossible d\'enregistrer le modèle récurrent.');
    await refreshAll();
  };

  const deleteRecurring = async (id: string) => {
    const res = await fetchWithAuth(`/api/recurring/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Impossible de supprimer le modèle récurrent.');
    await refreshAll();
  };

  // Notifications
  const readNotification = async (id: string) => {
    const res = await fetchWithAuth(`/api/notifications/${id}/read`, { method: 'PUT' });
    if (res.ok) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const clearNotifications = async () => {
    const res = await fetchWithAuth('/api/notifications/clear', { method: 'DELETE' });
    if (res.ok) {
      setNotifications([]);
    }
  };

  return (
    <DataContext.Provider value={{
      accounts, transactions, categories, people, debts, receivables, budgets, goals, recurring, notifications, dashboardOverview, loading,
      refreshAll, createAccount, updateAccount, deleteAccount, createTransaction, deleteTransaction, createPerson, deletePerson,
      createDebt, repayDebt, deleteDebt, createReceivable, repayReceivable, deleteReceivable, createBudget, deleteBudget, createGoal, addGoalFunds, deleteGoal,
      createRecurring, deleteRecurring, readNotification, clearNotifications
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
