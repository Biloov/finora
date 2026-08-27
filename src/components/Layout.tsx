import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import QuickAddModal from './QuickAddModal';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { notifications } = useData();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const currentPath = location.pathname;

  const isTabActive = (paths: string[]) => {
    return paths.includes(currentPath);
  };

  const formattedDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Pages where we suppress the main app bars (like onboarding, login, register)
  const isAuthOrOnboarding = ['/', '/login', '/register'].includes(currentPath);

  if (isAuthOrOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen pb-32 bg-background text-on-background">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-40 flex justify-between items-center px-container-padding h-16 bg-surface/80 dark:bg-surface-container/80 backdrop-blur-xl border-b border-surface-container-high">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border-2 border-surface-container cursor-pointer" onClick={() => navigate('/settings')}>
            <img 
              className="w-full h-full object-cover" 
              src={user?.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=Marc"} 
              alt="Profil" 
            />
          </div>
          <div>
            <p className="font-body-sm text-[12px] text-on-surface-variant leading-none mb-1">{formattedDate}</p>
            <h1 className="font-headline-md text-sm md:text-base text-primary dark:text-primary-fixed leading-none">
              Bonjour, {user?.name || 'Utilisateur'}
            </h1>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/settings?tab=notifications')}
          className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-[24px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full animate-pulse"></span>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="pt-24 px-container-padding max-w-3xl mx-auto space-y-stack-lg">
        {children}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 w-full z-45 flex justify-around items-center px-container-padding pb-4 h-20 bg-surface/85 dark:bg-surface-container/85 backdrop-blur-xl rounded-t-xl shadow-[0px_-4px_20px_rgba(10,25,47,0.05)] border-t border-surface-container-high">
        {/* Accueil */}
        <button 
          onClick={() => navigate('/dashboard')}
          className={`flex flex-col items-center justify-center font-label-caps text-[10px] p-2 rounded-lg transition-colors active:scale-95 duration-150 ${
            isTabActive(['/dashboard']) 
              ? 'text-secondary-container font-bold' 
              : 'text-on-surface-variant dark:text-outline'
          }`}
        >
          <span className={`material-symbols-outlined mb-1 ${isTabActive(['/dashboard']) ? 'filled' : ''}`}>home</span>
          <span>Accueil</span>
        </button>

        {/* Transactions */}
        <button 
          onClick={() => navigate('/transactions')}
          className={`flex flex-col items-center justify-center font-label-caps text-[10px] p-2 rounded-lg transition-colors active:scale-95 duration-150 ${
            isTabActive(['/transactions']) 
              ? 'text-secondary-container font-bold' 
              : 'text-on-surface-variant dark:text-outline'
          }`}
        >
          <span className={`material-symbols-outlined mb-1 ${isTabActive(['/transactions']) ? 'filled' : ''}`}>account_balance_wallet</span>
          <span>Transactions</span>
        </button>

        {/* Center FAB Button */}
        <div className="relative -top-6">
          <button 
            onClick={() => setIsQuickAddOpen(true)}
            className="w-14 h-14 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container shadow-lg active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-[28px]">add</span>
          </button>
        </div>

        {/* Personnes */}
        <button 
          onClick={() => navigate('/people')}
          className={`flex flex-col items-center justify-center font-label-caps text-[10px] p-2 rounded-lg transition-colors active:scale-95 duration-150 ${
            isTabActive(['/people']) 
              ? 'text-secondary-container font-bold' 
              : 'text-on-surface-variant dark:text-outline'
          }`}
        >
          <span className={`material-symbols-outlined mb-1 ${isTabActive(['/people']) ? 'filled' : ''}`}>group</span>
          <span>Personnes</span>
        </button>

        {/* Plus */}
        <button 
          onClick={() => navigate('/plus')}
          className={`flex flex-col items-center justify-center font-label-caps text-[10px] p-2 rounded-lg transition-colors active:scale-95 duration-150 ${
            isTabActive(['/plus', '/accounts', '/budgets', '/goals', '/projections', '/reports', '/settings']) 
              ? 'text-secondary-container font-bold' 
              : 'text-on-surface-variant dark:text-outline'
          }`}
        >
          <span className="material-symbols-outlined mb-1">more_horiz</span>
          <span>Plus</span>
        </button>
      </nav>

      {/* Quick Add Modal Overlay */}
      {isQuickAddOpen && (
        <QuickAddModal onClose={() => setIsQuickAddOpen(false)} />
      )}
    </div>
  );
};

export default Layout;
