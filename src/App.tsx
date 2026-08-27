import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';

// Pages
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import Accounts from './pages/Accounts';
import People from './pages/People';
import DebtsAndReceivables from './pages/DebtsAndReceivables';
import BudgetsAndGoals from './pages/BudgetsAndGoals';
import Projections from './pages/Projections';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Plus from './pages/Plus';

// Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-on-surface-variant text-xs">
        Initialisation de FINORA...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Onboarding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
              <Route path="/add-transaction" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
              <Route path="/people" element={<ProtectedRoute><People /></ProtectedRoute>} />
              <Route path="/debts" element={<ProtectedRoute><DebtsAndReceivables /></ProtectedRoute>} />
              <Route path="/budgets" element={<ProtectedRoute><BudgetsAndGoals /></ProtectedRoute>} />
              <Route path="/projections" element={<ProtectedRoute><Projections /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/plus" element={<ProtectedRoute><Plus /></ProtectedRoute>} />

              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
