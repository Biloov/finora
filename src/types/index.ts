export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  pinCode?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'Caisse' | 'Banque' | 'Mobile Money' | 'Portefeuille' | 'Épargne' | 'Compte professionnel' | 'Autre';
  initialBalance: number;
  currency: string;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  balance: number; // calculated field
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE' | 'BOTH';
}

export interface Person {
  id: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  notes?: string;
  sheOwesMe: number; // calculated field
  iOweHer: number; // calculated field
  netBalance: number; // calculated field
  createdAt: string;
}

export interface Debt {
  id: string;
  personId: string;
  person: Person;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  date: string;
  dueDate?: string;
  description?: string;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  createdAt: string;
  payments?: Transaction[];
}

export interface Receivable {
  id: string;
  personId: string;
  person: Person;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  date: string;
  dueDate?: string;
  description?: string;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  createdAt: string;
  payments?: Transaction[];
}

export interface Transaction {
  id: string;
  accountId: string;
  account: Account;
  targetAccountId?: string;
  targetAccount?: Account;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId?: string;
  category?: Category;
  personId?: string;
  person?: Person;
  debtId?: string;
  debt?: Debt;
  receivableId?: string;
  receivable?: Receivable;
  amount: number;
  date: string;
  description?: string;
  attachmentUrl?: string;
  isRecurring: boolean;
  recurringId?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  category: Category;
  amount: number;
  spentAmount: number;
  period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  createdAt: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string;
  icon: string;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  accountId: string;
  account: Account;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  categoryId?: string;
  category?: Category;
  description?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER';
  isRead: boolean;
  createdAt: string;
}

export interface DashboardOverview {
  netWorth: number;
  trendPercentage: number;
  availableCash: number;
  totalReceivables: number;
  totalDebts: number;
  accounts: Account[];
  recentTransactions: Transaction[];
  upcoming: any[];
  goals: FinancialGoal[];
}

export interface StatisticsReport {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
  categoriesBreakdown: Array<{
    name: string;
    amount: number;
    color: string;
    icon: string;
    percentage: number;
  }>;
  chartData: Array<{
    date: string;
    income: number;
    expense: number;
  }>;
}

export interface ProjectionData {
  today: { date: string; availableCash: number; netWorth: number };
  in7Days: { date: string; availableCash: number; netWorth: number };
  in30Days: { date: string; availableCash: number; netWorth: number };
  in90Days: { date: string; availableCash: number; netWorth: number };
  timeline: Array<{ day: number; date: string; availableCash: number; netWorth: number }>;
}
