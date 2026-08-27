import React, { useState } from 'react';
import { useData } from '../context/DataContext';

export const BudgetsAndGoals: React.FC = () => {
  const { 
    budgets, goals, categories, accounts,
    createBudget, deleteBudget,
    createGoal, addGoalFunds, deleteGoal 
  } = useData();

  const [activeTab, setActiveTab] = useState<'BUDGETS' | 'GOALS'>('BUDGETS');
  const [isAdding, setIsAdding] = useState(false);
  const [fundingGoal, setFundingGoal] = useState<any | null>(null);

  // Budget Form Fields
  const [categoryId, setCategoryId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  // Goal Form Fields
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalIcon, setGoalIcon] = useState('savings');

  // Fund Goal Fields
  const [fundAmount, setFundAmount] = useState('');
  const [fundAccountId, setFundAccountId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default category and accounts
  React.useEffect(() => {
    const expenseCats = categories.filter(c => c.type === 'EXPENSE' || c.type === 'BOTH');
    if (expenseCats.length > 0) {
      setCategoryId(expenseCats[0].id);
    }
  }, [categories]);

  React.useEffect(() => {
    if (accounts.length > 0) {
      setFundAccountId(accounts[0].id);
    }
  }, [accounts]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (activeTab === 'BUDGETS') {
        const amt = parseFloat(budgetAmount);
        if (!categoryId || isNaN(amt) || amt <= 0) {
          throw new Error('Champs requis invalides.');
        }
        await createBudget(categoryId, amt);
        setBudgetAmount('');
      } else {
        const amt = parseFloat(goalTargetAmount);
        if (!goalName || isNaN(amt) || amt <= 0) {
          throw new Error('Champs requis invalides.');
        }
        await createGoal({
          name: goalName,
          targetAmount: amt,
          targetDate: goalTargetDate || null,
          icon: goalIcon
        });
        setGoalName('');
        setGoalTargetAmount('');
        setGoalTargetDate('');
        setGoalIcon('savings');
      }
      setIsAdding(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFundingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(fundAmount);
    
    if (isNaN(amt) || amt <= 0 || !fundAccountId) {
      setError('Champs requis invalides.');
      return;
    }

    setSubmitting(true);
    try {
      await addGoalFunds(fundingGoal.id, amt, fundAccountId);
      setFundingGoal(null);
      setFundAmount('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du versement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce budget ?')) {
      try {
        await deleteBudget(id);
      } catch (err: any) {
        alert(err.message || 'Erreur de suppression.');
      }
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet objectif d\'épargne ?')) {
      try {
        await deleteGoal(id);
      } catch (err: any) {
        alert(err.message || 'Erreur de suppression.');
      }
    }
  };

  const goalIconsList = [
    { value: 'savings', label: 'Tirelire' },
    { value: 'directions_car', label: 'Voiture' },
    { value: 'home', label: 'Maison' },
    { value: 'flight', label: 'Voyage' },
    { value: 'school', label: 'Éducation' },
    { value: 'computer', label: 'Technologie' }
  ];

  return (
    <div className="space-y-stack-lg pb-10">
      {/* Title Tabs */}
      <div className="flex justify-between items-center border-b border-surface-container-high pb-2">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setActiveTab('BUDGETS');
              setIsAdding(false);
              setFundingGoal(null);
            }}
            className={`font-headline-md text-base md:text-lg pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'BUDGETS' ? 'border-secondary text-primary font-bold' : 'border-transparent text-outline'
            }`}
          >
            Budgets de dépenses
          </button>
          <button
            onClick={() => {
              setActiveTab('GOALS');
              setIsAdding(false);
              setFundingGoal(null);
            }}
            className={`font-headline-md text-base md:text-lg pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'GOALS' ? 'border-secondary text-primary font-bold' : 'border-transparent text-outline'
            }`}
          >
            Objectifs d'épargne
          </button>
        </div>

        {!isAdding && !fundingGoal && (
          <button
            onClick={() => {
              setIsAdding(true);
              setFundingGoal(null);
              setError(null);
            }}
            className="px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg font-label-caps text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Ajouter
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-error-container text-on-error-container text-xs font-semibold rounded-xl">
          {error}
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container-high shadow-md space-y-4">
          <h3 className="font-headline-md text-base text-primary">
            {activeTab === 'BUDGETS' ? 'Définir un budget de dépenses' : 'Créer un nouvel objectif d\'épargne'}
          </h3>
          <form onSubmit={handleAddSubmit} className="space-y-3">
            {activeTab === 'BUDGETS' ? (
              <>
                {/* Catégorie */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Catégorie de dépense</label>
                  <div className="relative">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none outline-none"
                    >
                      {categories.filter(c => c.type === 'EXPENSE' || c.type === 'BOTH').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                  </div>
                </div>

                {/* Montant Budget */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Limite mensuelle (FCFA)</label>
                  <input
                    type="number"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="Ex: 100000"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Nom Objectif */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Nom du rêve / projet</label>
                  <input
                    type="text"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder="Ex: Achat voiture, Logement..."
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Somme cible */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Somme cible (FCFA)</label>
                    <input
                      type="number"
                      value={goalTargetAmount}
                      onChange={(e) => setGoalTargetAmount(e.target.value)}
                      placeholder="Ex: 8000000"
                      required
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                    />
                  </div>
                  {/* Date Cible */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Date cible</label>
                    <input
                      type="date"
                      value={goalTargetDate}
                      onChange={(e) => setGoalTargetDate(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                    />
                  </div>
                </div>

                {/* Choix Icône */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Icône visuelle</label>
                  <div className="grid grid-cols-6 gap-2">
                    {goalIconsList.map(item => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setGoalIcon(item.value)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                          goalIcon === item.value 
                            ? 'bg-secondary-container text-on-secondary-container border-secondary' 
                            : 'bg-surface-container-high border-transparent text-on-surface-variant'
                        }`}
                        title={item.label}
                      >
                        <span className="material-symbols-outlined text-[18px]">{item.value}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-secondary-container text-on-secondary-container rounded-lg font-headline-md text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? 'Enregistrement...' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2.5 bg-surface-container-high text-on-surface-variant rounded-lg font-headline-md text-xs font-bold active:scale-95 transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Funding Dialog Form (épargner pour objectif) */}
      {fundingGoal && (
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container-high shadow-md space-y-4 animate-slide-up">
          <h3 className="font-headline-md text-base text-primary">
            Épargner pour : {fundingGoal.name}
          </h3>
          <form onSubmit={handleFundingSubmit} className="space-y-3">
            {/* Montant versement */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Montant à ajouter (FCFA)</label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Ex: 50000"
                required
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              />
            </div>

            {/* Compte source */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Débiter le compte</label>
              <div className="relative">
                <select
                  value={fundAccountId}
                  onChange={(e) => setFundAccountId(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString()} FCFA)</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-secondary-container text-on-secondary-container rounded-lg font-headline-md text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? 'Versement...' : 'Valider le versement'}
              </button>
              <button
                type="button"
                onClick={() => setFundingGoal(null)}
                className="flex-1 py-2.5 bg-surface-container-high text-on-surface-variant rounded-lg font-headline-md text-xs font-bold active:scale-95 transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Display List */}
      <div className="space-y-4">
        {activeTab === 'BUDGETS' ? (
          // Budgets View
          budgets.map(b => {
            const progress = Math.min(100, Math.round((b.spentAmount / b.amount) * 100));
            const remaining = Math.max(0, b.amount - b.spentAmount);

            // Alert color threshold
            let barColor = 'bg-success-green';
            if (progress >= 100) {
              barColor = 'bg-danger-red';
            } else if (progress >= 80) {
              barColor = 'bg-secondary-container'; // Orange/yellow accent
            }

            return (
              <div
                key={b.id}
                className="bg-surface p-5 rounded-2xl border border-outline-variant/30 shadow-[0px_4px_20px_rgba(10,25,47,0.05)]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">{b.category.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-headline-md text-sm text-primary">{b.category.name}</h4>
                      <p className="font-body-sm text-[11px] text-on-surface-variant leading-none mt-0.5">Budget Mensuel</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteBudget(b.id)}
                    className="text-outline hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-numeric-data">
                    <span className="text-on-surface-variant">Dépensé : {b.spentAmount.toLocaleString()} FCFA</span>
                    <span className="font-bold text-primary">Restant : {remaining.toLocaleString()} FCFA</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-on-surface-variant pt-1 leading-none font-bold">
                    <span>Limite : {b.amount.toLocaleString()} FCFA</span>
                    <span className={progress >= 90 ? 'text-danger-red' : ''}>{progress}% utilisé</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          // Goals View
          goals.map(g => {
            const progress = Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100));
            return (
              <div
                key={g.id}
                className="bg-surface p-5 rounded-2xl border border-outline-variant/30 shadow-[0px_4px_20px_rgba(10,25,47,0.05)]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container/10 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">{g.icon || 'savings'}</span>
                    </div>
                    <div>
                      <h4 className="font-headline-md text-sm text-primary">{g.name}</h4>
                      {g.targetDate && (
                        <p className="font-body-sm text-[11px] text-on-surface-variant leading-none mt-0.5">
                          Cible : {new Date(g.targetDate).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteGoal(g.id)}
                    className="text-outline hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-numeric-data">
                    <span className="text-on-surface-variant">Épargné : {g.savedAmount.toLocaleString()} FCFA</span>
                    <span className="font-bold text-primary">Cible : {g.targetAmount.toLocaleString()} FCFA</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-secondary-container rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-on-surface-variant leading-none">
                    <span>Progression : {progress}%</span>
                    <button
                      onClick={() => {
                        setFundingGoal(g);
                        setError(null);
                        setIsAdding(false);
                      }}
                      className="px-2.5 py-1 bg-secondary-container text-on-secondary-container rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                    >
                      Verser des fonds
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {activeTab === 'BUDGETS' && budgets.length === 0 && (
          <div className="py-12 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl text-center text-on-surface-variant text-xs">
            Aucun budget défini. Définissez une limite de dépenses pour vos catégories.
          </div>
        )}

        {activeTab === 'GOALS' && goals.length === 0 && (
          <div className="py-12 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl text-center text-on-surface-variant text-xs">
            Aucun objectif d'épargne en cours. Créez-en un pour commencer à économiser !
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetsAndGoals;
