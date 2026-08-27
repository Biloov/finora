import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardOverview, loading } = useData();

  if (loading || !dashboardOverview) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Balance Card Skeleton */}
        <div className="bg-primary-container rounded-[24px] h-48 w-full"></div>
        {/* Accounts Title Skeleton */}
        <div className="flex justify-between items-center h-6 w-full">
          <div className="bg-surface-variant h-4 w-1/3 rounded"></div>
          <div className="bg-surface-variant h-4 w-12 rounded"></div>
        </div>
        {/* Accounts Scroll Skeleton */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface-variant h-28 w-36 rounded-xl flex-shrink-0"></div>
          ))}
        </div>
        {/* Goals Title Skeleton */}
        <div className="bg-surface-variant h-6 w-1/2 rounded"></div>
        <div className="bg-surface-variant h-20 w-full rounded-xl"></div>
      </div>
    );
  }

  const {
    netWorth,
    trendPercentage,
    availableCash,
    totalReceivables,
    totalDebts,
    accounts,
    recentTransactions,
    upcoming,
    goals
  } = dashboardOverview;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('fr-FR');
  };

  // Helper for account icon mapping
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Caisse': return 'payments';
      case 'Banque': return 'account_balance';
      case 'Mobile Money': return 'phone_iphone';
      case 'Portefeuille': return 'wallet';
      case 'Épargne': return 'savings';
      default: return 'credit_card';
    }
  };

  // Helper to format large numbers to k or M
  const formatK = (val: number) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    if (val >= 1000) {
      return Math.round(val / 1000) + 'k';
    }
    return val.toString();
  };

  return (
    <div className="space-y-stack-lg pb-10">
      {/* Main Balance Card */}
      <section>
        <div className="bg-primary-container rounded-[24px] p-6 text-on-primary-container relative overflow-hidden shadow-[0px_16px_40px_rgba(13,28,50,0.15)]">
          {/* Decorative blurred shapes */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-tertiary-container/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-1">
              <h2 className="font-label-caps text-label-caps text-on-primary-container/80 uppercase tracking-wider">Patrimoine Net</h2>
              <div className={`px-2 py-1 rounded-full flex items-center gap-1 font-label-caps text-[10px] ${
                trendPercentage >= 0 
                  ? 'bg-success-green/20 text-success-green' 
                  : 'bg-danger-red/20 text-danger-red'
              }`}>
                <span className="material-symbols-outlined text-[12px]">
                  {trendPercentage >= 0 ? 'trending_up' : 'trending_down'}
                </span>
                {trendPercentage >= 0 ? '+' : ''}{trendPercentage}%
              </div>
            </div>
            
            <div className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-primary mb-8">
              {formatCurrency(netWorth)} <span className="text-xl font-normal opacity-70">FCFA</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-on-primary-container/20">
              <div>
                <p className="text-[11px] text-on-primary-container/70 mb-1">Disponible</p>
                <p className="font-numeric-data text-sm text-on-primary font-bold">{formatK(availableCash)}</p>
              </div>
              <div>
                <p className="text-[11px] text-on-primary-container/70 mb-1">Créances</p>
                <p className="font-numeric-data text-sm text-success-green font-bold">+{formatK(totalReceivables)}</p>
              </div>
              <div>
                <p className="text-[11px] text-on-primary-container/70 mb-1">Dettes</p>
                <p className="font-numeric-data text-sm text-danger-red font-bold">-{formatK(totalDebts)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mes comptes */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline-md text-lg font-semibold text-primary">Mes comptes</h3>
          <button 
            onClick={() => navigate('/accounts')}
            className="font-label-caps text-label-caps text-secondary-container hover:opacity-80"
          >
            VOIR TOUT
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-container-padding px-container-padding">
          {accounts.map(acc => (
            <div 
              key={acc.id}
              onClick={() => navigate(`/accounts?id=${acc.id}`)}
              className="glass-card min-w-[140px] p-4 rounded-xl flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 rounded-full bg-secondary-container/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-secondary-container">
                  {getAccountIcon(acc.type)}
                </span>
              </div>
              <p className="font-label-caps text-[11px] text-on-surface-variant mb-1 truncate max-w-[110px]">
                {acc.name}
              </p>
              <p className="font-numeric-data text-base text-primary font-bold">
                {formatK(acc.balance)} <span className="text-[10px] opacity-60">FCFA</span>
              </p>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="text-center w-full py-4 text-xs text-on-surface-variant">
              Aucun compte financier actif.
            </div>
          )}
        </div>
      </section>

      {/* Objectifs financiers */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline-md text-lg font-semibold text-primary">Objectifs financiers</h3>
          <button 
            onClick={() => navigate('/goals')}
            className="font-label-caps text-label-caps text-secondary-container hover:opacity-80"
          >
            VOIR TOUT
          </button>
        </div>

        {goals.map(goal => {
          const progress = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
          return (
            <div 
              key={goal.id}
              onClick={() => navigate('/goals')}
              className="bg-surface-container-lowest p-5 rounded-xl border border-surface-variant/40 shadow-[0px_4px_20px_rgba(10,25,47,0.05)] cursor-pointer hover:bg-surface-container-low transition-colors mb-3"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary-container/10 flex items-center justify-center text-secondary-container">
                  <span className="material-symbols-outlined">{goal.icon || 'savings'}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-headline-md text-base text-primary">{goal.name}</h4>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">
                    {formatK(goal.savedAmount)} / {formatK(goal.targetAmount)} FCFA
                  </p>
                </div>
                <span className="font-numeric-data text-secondary-container font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary-container rounded-full transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-variant/40 text-center text-xs text-on-surface-variant py-6">
            Aucun objectif d'épargne en cours.
          </div>
        )}
      </section>

      {/* Transactions récentes */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline-md text-lg font-semibold text-primary">Opérations récentes</h3>
          <button 
            onClick={() => navigate('/transactions')}
            className="font-label-caps text-label-caps text-secondary-container hover:opacity-80"
          >
            VOIR TOUT
          </button>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_4px_20px_rgba(10,25,47,0.05)] border border-outline-variant/30 overflow-hidden">
          {recentTransactions.map(t => {
            const isNegative = t.type === 'EXPENSE';
            const isTransfer = t.type === 'TRANSFER';
            return (
              <div 
                key={t.id}
                onClick={() => navigate('/transactions')}
                className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer group border-b border-outline-variant/30 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                    isNegative 
                      ? 'bg-primary-container text-on-primary-container' 
                      : isTransfer 
                        ? 'bg-surface-variant text-on-surface-variant' 
                        : 'bg-secondary-container text-primary-container'
                  }`}>
                    <span className="material-symbols-outlined fill">
                      {isTransfer ? 'sync_alt' : t.category?.icon || 'payments'}
                    </span>
                  </div>
                  <div>
                    <p className="font-body-lg text-sm font-semibold text-on-surface truncate max-w-[160px] md:max-w-xs">
                      {t.description || (isTransfer ? 'Transfert' : t.category?.name || 'Opération')}
                    </p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                      {t.category?.name || (isTransfer ? 'Virement' : 'Général')} • {t.account.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-numeric-data text-sm font-bold ${
                    isNegative 
                      ? 'text-danger-red' 
                      : isTransfer 
                        ? 'text-on-surface-variant' 
                        : 'text-success-green'
                  }`}>
                    {isNegative ? '-' : isTransfer ? '' : '+'}{formatCurrency(t.amount)} <span className="text-[10px]">FCFA</span>
                  </p>
                </div>
              </div>
            );
          })}

          {recentTransactions.length === 0 && (
            <div className="p-8 text-center text-xs text-on-surface-variant">
              Aucune transaction récente.
            </div>
          )}
        </div>
      </section>

      {/* Prochaines échéances (À venir) */}
      <section>
        <h3 className="font-headline-md text-lg font-semibold text-primary mb-4">À venir</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcoming.map(item => (
            <div 
              key={item.id}
              className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-primary truncate max-w-[150px]">{item.title}</h4>
                  <p className="text-[11px] text-on-surface-variant">
                    Échéance : {new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
              <p className={`font-numeric-data text-xs font-bold ${
                item.type === 'RECEIVABLE' ? 'text-success-green' : 'text-danger-red'
              }`}>
                {item.type === 'RECEIVABLE' ? '+' : '-'}{formatK(item.amount)} FCFA
              </p>
            </div>
          ))}

          {upcoming.length === 0 && (
            <div className="col-span-full bg-surface-container-lowest p-5 rounded-xl border border-surface-variant/40 text-center text-xs text-on-surface-variant">
              Aucune échéance prévue dans les 15 prochains jours.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
