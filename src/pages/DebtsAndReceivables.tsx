import React, { useState } from 'react';
import { useData } from '../context/DataContext';

export const DebtsAndReceivables: React.FC = () => {
  const { 
    debts, receivables, people, accounts,
    createDebt, repayDebt, deleteDebt,
    createReceivable, repayReceivable, deleteReceivable 
  } = useData();

  const [activeTab, setActiveTab] = useState<'DEBTS' | 'RECEIVABLES'>('RECEIVABLES');
  const [isAdding, setIsAdding] = useState(false);
  const [repayItem, setRepayItem] = useState<any | null>(null);

  // Form Fields for Add
  const [personId, setPersonId] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  // Form Fields for Repay
  const [repayAmount, setRepayAmount] = useState('');
  const [repayAccountId, setRepayAccountId] = useState('');
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repayDescription, setRepayDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default account
  React.useEffect(() => {
    if (accounts.length > 0) {
      setAccountId(accounts[0].id);
      setRepayAccountId(accounts[0].id);
    }
  }, [accounts]);

  // Set default contact
  React.useEffect(() => {
    if (people.length > 0) {
      setPersonId(people[0].id);
    }
  }, [people]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!personId || isNaN(parsedAmount) || parsedAmount <= 0 || !accountId) {
      setError('Tous les champs requis doivent être saisis.');
      return;
    }

    setSubmitting(true);
    try {
      if (activeTab === 'DEBTS') {
        await createDebt({ personId, amount: parsedAmount, accountId, date, dueDate, description });
      } else {
        await createReceivable({ personId, amount: parsedAmount, accountId, date, dueDate, description });
      }
      setIsAdding(false);
      setAmount('');
      setDueDate('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Erreur d\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedRepay = parseFloat(repayAmount);
    if (isNaN(parsedRepay) || parsedRepay <= 0 || !repayAccountId) {
      setError('Champs requis manquants.');
      return;
    }

    if (parsedRepay > repayItem.remainingAmount) {
      setError(`Le remboursement ne peut pas dépasser le montant restant (${repayItem.remainingAmount} FCFA).`);
      return;
    }

    setSubmitting(true);
    try {
      if (activeTab === 'DEBTS') {
        await repayDebt(repayItem.id, { amount: parsedRepay, accountId: repayAccountId, date: repayDate, description: repayDescription });
      } else {
        await repayReceivable(repayItem.id, { amount: parsedRepay, accountId: repayAccountId, date: repayDate, description: repayDescription });
      }
      setRepayItem(null);
      setRepayAmount('');
      setRepayDescription('');
    } catch (err: any) {
      setError(err.message || 'Erreur d\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet enregistrement ? Toutes les transactions de remboursement associées seront supprimées.')) {
      try {
        if (activeTab === 'DEBTS') {
          await deleteDebt(id);
        } else {
          await deleteReceivable(id);
        }
      } catch (err: any) {
        alert(err.message || 'Erreur de suppression.');
      }
    }
  };

  const itemsList = activeTab === 'DEBTS' ? debts : receivables;

  return (
    <div className="space-y-stack-lg pb-10">
      {/* Switch Tab / Title */}
      <div className="flex justify-between items-center border-b border-surface-container-high pb-2">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setActiveTab('RECEIVABLES');
              setIsAdding(false);
              setRepayItem(null);
            }}
            className={`font-headline-md text-base md:text-lg pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'RECEIVABLES' ? 'border-secondary text-primary font-bold' : 'border-transparent text-outline'
            }`}
          >
            Créances ("On me doit")
          </button>
          <button
            onClick={() => {
              setActiveTab('DEBTS');
              setIsAdding(false);
              setRepayItem(null);
            }}
            className={`font-headline-md text-base md:text-lg pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'DEBTS' ? 'border-secondary text-primary font-bold' : 'border-transparent text-outline'
            }`}
          >
            Dettes ("Je dois")
          </button>
        </div>

        {!isAdding && !repayItem && (
          <button
            onClick={() => {
              setIsAdding(true);
              setRepayItem(null);
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

      {/* Add Debt/Receivable Form */}
      {isAdding && (
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container-high shadow-md space-y-4">
          <h3 className="font-headline-md text-base text-primary">
            {activeTab === 'DEBTS' ? 'Enregistrer un emprunt (Dette)' : 'Enregistrer un prêt (Créance)'}
          </h3>
          <form onSubmit={handleAddSubmit} className="space-y-3">
            {/* Personne */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Personne concernée</label>
              <div className="relative">
                <select
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none outline-none"
                >
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName || ''}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Montant */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Montant initial</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              />
            </div>

            {/* Compte financier (automatiquement crédité ou débité) */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                {activeTab === 'DEBTS' ? 'Compte à encaisser' : 'Compte à débiter'}
              </label>
              <div className="relative">
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Date de début</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Échéance</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Prêt ordinateur, avance..."
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-secondary-container text-on-secondary-container rounded-lg font-headline-md text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
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

      {/* Repay Dialog Form */}
      {repayItem && (
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container-high shadow-md space-y-4 animate-slide-up">
          <h3 className="font-headline-md text-base text-primary">
            {activeTab === 'DEBTS' ? 'Rembourser la dette' : 'Enregistrer un remboursement reçu'}
          </h3>
          <p className="text-xs text-on-surface-variant">
            Montant restant : <span className="font-bold text-primary">{repayItem.remainingAmount.toLocaleString()} FCFA</span>
          </p>
          <form onSubmit={handleRepaySubmit} className="space-y-3">
            {/* Montant remboursement */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Montant remboursé</label>
              <input
                type="number"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder={repayItem.remainingAmount.toString()}
                required
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              />
            </div>

            {/* Compte financier (débité pour dette, crédité pour créance) */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                {activeTab === 'DEBTS' ? 'Compte de paiement' : 'Compte de dépôt'}
              </label>
              <div className="relative">
                <select
                  value={repayAccountId}
                  onChange={(e) => setRepayAccountId(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Date remboursement */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Date de l'opération</label>
              <input
                type="date"
                value={repayDate}
                onChange={(e) => setRepayDate(e.target.value)}
                required
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              />
            </div>

            {/* Description remboursement */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Description</label>
              <input
                type="text"
                value={repayDescription}
                onChange={(e) => setRepayDescription(e.target.value)}
                placeholder="Remboursement partiel ou total"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-secondary-container text-on-secondary-container rounded-lg font-headline-md text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? 'Remboursement...' : 'Valider'}
              </button>
              <button
                type="button"
                onClick={() => setRepayItem(null)}
                className="flex-1 py-2.5 bg-surface-container-high text-on-surface-variant rounded-lg font-headline-md text-xs font-bold active:scale-95 transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main List */}
      <div className="space-y-4">
        {itemsList.map(item => {
          const progress = Math.min(100, Math.round((item.paidAmount / item.amount) * 100));
          return (
            <div
              key={item.id}
              className="bg-surface p-5 rounded-2xl border border-outline-variant/30 shadow-[0px_4px_20px_rgba(10,25,47,0.05)] flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-headline-md text-base text-primary">
                    {item.person.firstName} {item.person.lastName || ''}
                  </h4>
                  <p className="font-body-sm text-[11px] text-on-surface-variant leading-none mt-0.5">
                    {item.description || 'Prêt / Emprunt'}
                  </p>
                </div>
                
                <span className={`px-2 py-1 rounded-full font-label-caps text-[9px] font-bold ${
                  item.status === 'PAID' 
                    ? 'bg-success-green/20 text-success-green' 
                    : item.status === 'PARTIALLY_PAID' 
                      ? 'bg-secondary-container/20 text-secondary' 
                      : 'bg-surface-variant text-on-surface-variant'
                }`}>
                  {item.status === 'PAID' ? 'PAYÉ' : item.status === 'PARTIALLY_PAID' ? 'PARTIEL' : 'EN COURS'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">Remboursé : {item.paidAmount.toLocaleString()} FCFA</span>
                  <span className="font-bold text-primary">Restant : {item.remainingAmount.toLocaleString()} FCFA</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      activeTab === 'DEBTS' ? 'bg-danger-red' : 'bg-success-green'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-3 border-t border-outline-variant/10">
                <span className="text-on-surface-variant">
                  Échéance : {item.dueDate ? new Date(item.dueDate).toLocaleDateString('fr-FR') : 'Non définie'}
                </span>

                <div className="flex gap-2">
                  {item.status !== 'PAID' && (
                    <button
                      onClick={() => {
                        setRepayItem(item);
                        setRepayAmount(item.remainingAmount.toString());
                        setError(null);
                        setIsAdding(false);
                      }}
                      className="px-3 py-1 bg-secondary-container text-on-secondary-container font-semibold rounded-lg text-[11px] active:scale-95 transition-all cursor-pointer"
                    >
                      Rembourser
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-outline hover:text-error transition-colors cursor-pointer"
                    title="Supprimer cet historique"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {itemsList.length === 0 && (
          <div className="py-12 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl text-center text-on-surface-variant text-xs">
            Aucun dossier de {activeTab === 'DEBTS' ? 'dettes' : 'créances'} enregistré.
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtsAndReceivables;
