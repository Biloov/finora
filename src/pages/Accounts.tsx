import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Account } from '../types';

export const Accounts: React.FC = () => {
  const { accounts, createAccount, updateAccount, deleteAccount } = useData();

  const [isAdding, setIsAdding] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState<'Caisse' | 'Banque' | 'Mobile Money' | 'Portefeuille' | 'Épargne' | 'Compte professionnel' | 'Autre'>('Caisse');
  const [initialBalance, setInitialBalance] = useState('0');
  const [description, setDescription] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const accountTypes = [
    'Caisse', 'Banque', 'Mobile Money', 'Portefeuille', 'Épargne', 'Compte professionnel', 'Autre'
  ];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await createAccount({
        name,
        type,
        initialBalance: parseFloat(initialBalance) || 0,
        description
      });
      setName('');
      setInitialBalance('0');
      setDescription('');
      setIsAdding(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAcc || !name.trim()) return;

    setSubmitting(true);
    try {
      await updateAccount(editingAcc.id, {
        name,
        type,
        initialBalance: parseFloat(initialBalance) || 0,
        description
      });
      setEditingAcc(null);
      setName('');
      setInitialBalance('0');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (acc: Account) => {
    setEditingAcc(acc);
    setName(acc.name);
    setType(acc.type);
    setInitialBalance(acc.initialBalance.toString());
    setDescription(acc.description || '');
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment archiver ce compte ? Il n\'apparaîtra plus dans les sélections mais son historique de transactions sera préservé.')) {
      try {
        await deleteAccount(id);
        setEditingAcc(null);
      } catch (err: any) {
        alert(err.message || 'Erreur de suppression.');
      }
    }
  };

  return (
    <div className="space-y-stack-lg pb-10">
      <div className="flex justify-between items-center">
        <h2 className="font-headline-md text-headline-md text-primary">Mes comptes financiers</h2>
        {!isAdding && !editingAcc && (
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingAcc(null);
              setName('');
              setInitialBalance('0');
              setDescription('');
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

      {/* Add / Edit Form Drawer */}
      {(isAdding || editingAcc) && (
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container-high shadow-md space-y-4">
          <h3 className="font-headline-md text-base text-primary">
            {isAdding ? 'Créer un nouveau compte' : 'Modifier le compte'}
          </h3>
          <form onSubmit={isAdding ? handleAddSubmit : handleEditSubmit} className="space-y-3">
            {/* Nom */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Nom du compte</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carte Visa, Espèces"
                required
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              />
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Type de compte</label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none outline-none"
                >
                  {accountTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Solde Initial */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Solde initial</label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                required
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Description (Optionnelle)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Compte pro, etc."
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
                onClick={() => {
                  setIsAdding(false);
                  setEditingAcc(null);
                }}
                className="flex-1 py-2.5 bg-surface-container-high text-on-surface-variant rounded-lg font-headline-md text-xs font-bold active:scale-95 transition-all"
              >
                Annuler
              </button>

              {editingAcc && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingAcc.id)}
                  className="px-4 bg-error text-on-error rounded-lg flex items-center justify-center active:scale-95 transition-all"
                  title="Archiver ce compte"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Accounts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(acc => (
          <div
            key={acc.id}
            onClick={() => startEdit(acc)}
            className="p-5 bg-surface rounded-2xl border border-outline-variant/30 hover:border-secondary-container transition-all shadow-[0px_4px_20px_rgba(10,25,47,0.05)] cursor-pointer flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-container/10 flex items-center justify-center text-secondary-container">
                  <span className="material-symbols-outlined">
                    {acc.type === 'Caisse' ? 'payments' : acc.type === 'Banque' ? 'account_balance' : 'wallet'}
                  </span>
                </div>
                <div>
                  <h4 className="font-headline-md text-sm text-primary">{acc.name}</h4>
                  <p className="font-body-sm text-[11px] text-on-surface-variant leading-none mt-0.5">{acc.type}</p>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Solde actuel</p>
              <p className="font-numeric-data text-lg font-bold text-primary">
                {acc.balance.toLocaleString('fr-FR')} <span className="text-xs font-normal opacity-60">FCFA</span>
              </p>
              {acc.description && (
                <p className="text-[11px] text-on-surface-variant mt-2 border-t border-outline-variant/10 pt-2 italic">
                  {acc.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Accounts;
