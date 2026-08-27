import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProjectionData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const Projections: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<ProjectionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjections = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/reports/projections', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Error fetching projections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjections();
  }, [token]);

  if (loading || !data) {
    return <div className="p-8 text-center text-xs animate-pulse">Calcul de la projection financière en cours...</div>;
  }

  const formatCurrency = (val: number) => {
    return val.toLocaleString('fr-FR') + ' FCFA';
  };

  const chartData = data.timeline.filter((_, idx) => idx % 3 === 0); // Downsample for cleaner chart (every 3 days)

  return (
    <div className="space-y-stack-lg pb-10">
      <section className="space-y-2">
        <h2 className="font-headline-md text-headline-md text-primary">Ma situation & Prévisions</h2>
        <p className="text-xs text-on-surface-variant">
          Visualisez l'évolution future de votre patrimoine net et disponible en fonction des charges récurrentes et des échéances prévues.
        </p>
      </section>

      {/* Projections timeline summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 text-center">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Aujourd'hui</p>
          <p className="font-numeric-data text-sm font-bold text-primary">{formatCurrency(data.today.netWorth)}</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 text-center">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Sous 7 jours</p>
          <p className="font-numeric-data text-sm font-bold text-secondary">{formatCurrency(data.in7Days.netWorth)}</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 text-center">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Sous 30 jours</p>
          <p className={`font-numeric-data text-sm font-bold ${
            data.in30Days.netWorth >= data.today.netWorth ? 'text-success-green' : 'text-danger-red'
          }`}>{formatCurrency(data.in30Days.netWorth)}</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 text-center">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Sous 3 mois</p>
          <p className={`font-numeric-data text-sm font-bold ${
            data.in90Days.netWorth >= data.today.netWorth ? 'text-success-green' : 'text-danger-red'
          }`}>{formatCurrency(data.in90Days.netWorth)}</p>
        </div>
      </section>

      {/* Area Chart matching Mockup style (Vibrant yellow line with soft navy gradient fill) */}
      <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-[0px_4px_20px_rgba(10,25,47,0.05)] space-y-4">
        <h3 className="font-headline-md text-base text-primary">Projection du patrimoine (90 jours)</h3>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d1c32" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0d1c32" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#efedef" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 9, fill: '#75777e' }}
                stroke="#c5c6cd"
              />
              <YAxis 
                tick={{ fontSize: 9, fill: '#75777e' }}
                stroke="#c5c6cd"
                tickFormatter={(tick) => (tick / 1000) + 'k'}
              />
              <Tooltip 
                formatter={(value: any) => [value.toLocaleString() + ' FCFA', 'Patrimoine Net']}
                labelStyle={{ fontSize: 10, fontWeight: 'bold' }}
                contentStyle={{ fontSize: 11 }}
              />
              <Area 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#fed01b" // Vibrant yellow path
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorNetWorth)" // Soft navy gradient fill
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Forecast logic breakdown */}
      <section className="bg-surface-container-low p-5 rounded-xl border border-surface-container-high space-y-3">
        <h4 className="font-headline-md text-sm text-primary">Comment ces prévisions sont-elles calculées ?</h4>
        <ul className="text-xs text-on-surface-variant space-y-2 list-disc pl-4">
          <li><strong>Disponibilités :</strong> Solde des comptes financiers.</li>
          <li><strong>Créances et dettes :</strong> Récupération des échéances planifiées à leur date limite respective.</li>
          <li><strong>Flux récurrents :</strong> Loyer, abonnements Internet, salaires et charges mensuelles programmées intégrés à leur date d'échéance récurrente.</li>
        </ul>
      </section>
    </div>
  );
};

export default Projections;
