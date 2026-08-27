import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatisticsReport } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Reports: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<StatisticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/statistics?period=${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, period]);

  if (loading || !data) {
    return <div className="p-8 text-center text-xs animate-pulse">Chargement du rapport analytique...</div>;
  }

  const formatCurrency = (val: number) => {
    return val.toLocaleString('fr-FR') + ' FCFA';
  };

  return (
    <div className="space-y-stack-lg pb-10">
      <section className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary">Rapports financiers</h2>
          <p className="text-xs text-on-surface-variant">Analysez vos flux de revenus, vos postes de dépenses et votre taux d'épargne.</p>
        </div>
        
        {/* Time filters */}
        <div className="flex bg-surface-container rounded-xl p-unit self-start sm:self-auto">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              period === 'week' ? 'bg-secondary-container text-on-secondary-container shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              period === 'month' ? 'bg-secondary-container text-on-secondary-container shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              period === 'year' ? 'bg-secondary-container text-on-secondary-container shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            Année
          </button>
        </div>
      </section>

      {/* Aggregate Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-numeric-data">
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 text-center shadow-sm">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Revenus</p>
          <p className="text-base font-bold text-success-green">{formatCurrency(data.totalIncome)}</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 text-center shadow-sm">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Dépenses</p>
          <p className="text-base font-bold text-danger-red">{formatCurrency(data.totalExpense)}</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 text-center shadow-sm">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Taux d'Épargne</p>
          <p className="text-base font-bold text-secondary">{data.savingsRate}%</p>
        </div>
      </section>

      {/* Revenues vs Expenses Chart */}
      <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-[0px_4px_20px_rgba(10,25,47,0.05)] space-y-4">
        <h3 className="font-headline-md text-base text-primary">Revenus vs Dépenses</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#efedef" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#75777e' }} stroke="#c5c6cd" />
              <YAxis tick={{ fontSize: 9, fill: '#75777e' }} stroke="#c5c6cd" tickFormatter={(v) => (v / 1000) + 'k'} />
              <Tooltip formatter={(value) => [value.toLocaleString() + ' FCFA']} labelStyle={{ fontSize: 10, fontWeight: 'bold' }} contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="income" name="Revenus" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Expenses Breakdown Category horizontal list */}
      <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-[0px_4px_20px_rgba(10,25,47,0.05)] space-y-4">
        <h3 className="font-headline-md text-base text-primary">Dépenses par catégorie</h3>
        
        <div className="space-y-4">
          {data.categoriesBreakdown.map(cat => (
            <div key={cat.name} className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                  </div>
                  <span className="font-semibold text-primary">{cat.name}</span>
                </div>
                
                <div className="text-right font-numeric-data">
                  <span className="font-bold text-primary">{cat.amount.toLocaleString()} FCFA</span>
                  <span className="text-[10px] text-on-surface-variant ml-2">({cat.percentage}%)</span>
                </div>
              </div>
              
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                ></div>
              </div>
            </div>
          ))}

          {data.categoriesBreakdown.length === 0 && (
            <div className="text-center text-xs text-on-surface-variant py-8">
              Aucune dépense enregistrée sur cette période.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Reports;
