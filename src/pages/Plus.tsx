import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Plus: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Comptes financiers',
      desc: 'Caisse, banque, Mobile Money et soldes',
      icon: 'account_balance',
      path: '/accounts',
      color: 'bg-primary-container text-on-primary-container'
    },
    {
      title: 'Budgets & Épargne',
      desc: 'Limites de dépenses et objectifs',
      icon: 'savings',
      path: '/budgets',
      color: 'bg-secondary-container/15 text-secondary'
    },
    {
      title: 'Dettes & Créances',
      desc: 'Suivi des prêts (on me doit) et emprunts (je dois)',
      icon: 'handshake',
      path: '/debts',
      color: 'bg-secondary-container text-on-secondary-container'
    },
    {
      title: 'Prévisions & Projections',
      desc: 'Simulation du patrimoine à 7/30/90 jours',
      icon: 'query_stats',
      path: '/projections',
      color: 'bg-surface-variant text-on-surface-variant'
    },
    {
      title: 'Rapports & Statistiques',
      desc: 'Analyses de revenus et dépenses',
      icon: 'bar_chart',
      path: '/reports',
      color: 'bg-success-green/10 text-success-green'
    },
    {
      title: 'Paramètres & Sécurité',
      desc: 'Code PIN, notifications, données démo',
      icon: 'settings',
      path: '/settings',
      color: 'bg-outline-variant/20 text-on-surface'
    }
  ];

  return (
    <div className="space-y-stack-lg pb-10">
      <section className="space-y-1">
        <h2 className="font-headline-md text-headline-md text-primary">Plus d'outils</h2>
        <p className="text-xs text-on-surface-variant">Accédez à l'ensemble des modules avancés de FINORA.</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map(item => (
          <div
            key={item.title}
            onClick={() => navigate(item.path)}
            className="p-5 bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/30 rounded-2xl flex items-start gap-4 cursor-pointer hover:border-secondary transition-all shadow-[0px_4px_20px_rgba(10,25,47,0.05)] active:scale-[0.98]"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
              <span className="material-symbols-outlined text-[26px]">{item.icon}</span>
            </div>
            <div>
              <h3 className="font-headline-md text-sm text-primary mb-1">{item.title}</h3>
              <p className="text-xs text-on-surface-variant">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Plus;
