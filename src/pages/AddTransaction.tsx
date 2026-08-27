import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';

export const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accounts, categories, people, createTransaction } = useData();

  const typeParam = searchParams.get('type');

  // Transaction type: EXPENSE, INCOME, TRANSFER
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [amount, setAmount] = useState('0');
  const [accountId, setAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [personId, setPersonId] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with URL params
  useEffect(() => {
    if (typeParam === 'INCOME') setType('INCOME');
    else if (typeParam === 'TRANSFER') setType('TRANSFER');
    else setType('EXPENSE');
  }, [typeParam]);

  // Set default account when accounts load
  useEffect(() => {
    if (accounts.length > 0) {
      setAccountId(accounts[0].id);
      // set default target account if transfer
      if (accounts.length > 1) {
        setTargetAccountId(accounts[1].id);
      }
    }
  }, [accounts]);

  // Auto-select first matching category
  useEffect(() => {
    const filteredCats = categories.filter(c => c.type === type || c.type === 'BOTH');
    if (filteredCats.length > 0) {
      setCategoryId(filteredCats[0].id);
    } else {
      setCategoryId('');
    }
  }, [type, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Le montant doit être supérieur à 0.');
      return;
    }

    if (type === 'TRANSFER' && accountId === targetAccountId) {
      setError('Les comptes source et destination doivent être différents.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('accountId', accountId);
      formData.append('type', type);
      formData.append('amount', amount);
      formData.append('date', date);
      formData.append('description', description);
      
      if (type === 'TRANSFER') {
        formData.append('targetAccountId', targetAccountId);
      } else {
        if (categoryId) formData.append('categoryId', categoryId);
        if (personId) formData.append('personId', personId);
      }

      if (file) {
        formData.append('attachment', file);
      }

      await createTransaction(formData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === type || c.type === 'BOTH');

  return (
    <div className="pt-8 pb-20 max-w-md mx-auto space-y-stack-lg">
      {/* Top Header */}
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors text-primary"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-base md:text-lg text-primary">Nouvelle Transaction</h1>
        </div>
        <button 
          type="button" 
          onClick={() => navigate('/dashboard')}
          className="text-secondary font-label-caps text-xs font-bold"
        >
          ANNULER
        </button>
      </div>

      {error && (
        <div className="p-3 bg-error-container text-on-error-container text-xs font-semibold rounded-xl border border-error/15">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-stack-md">
        {/* Segmented Control */}
        <div className="flex p-unit bg-surface-container-low rounded-xl">
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`flex-1 py-2 text-center rounded-lg font-body-sm text-xs font-semibold transition-all ${
              type === 'EXPENSE'
                ? 'bg-secondary-container shadow-[0px_4px_20px_rgba(254,208,27,0.15)] text-on-secondary-container'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Dépense
          </button>
          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`flex-1 py-2 text-center rounded-lg font-body-sm text-xs font-semibold transition-all ${
              type === 'INCOME'
                ? 'bg-secondary-container shadow-[0px_4px_20px_rgba(254,208,27,0.15)] text-on-secondary-container'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Revenu
          </button>
          <button
            type="button"
            onClick={() => setType('TRANSFER')}
            className={`flex-1 py-2 text-center rounded-lg font-body-sm text-xs font-semibold transition-all ${
              type === 'TRANSFER'
                ? 'bg-secondary-container shadow-[0px_4px_20px_rgba(254,208,27,0.15)] text-on-secondary-container'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Transfert
          </button>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col items-center justify-center py-6 bg-surface rounded-xl shadow-[0px_4px_20px_rgba(10,25,47,0.05)] border border-surface-container-high">
          <label className="font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase tracking-wider font-bold">MONTANT</label>
          <div className="flex items-baseline gap-1">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0"
              className="bg-transparent border-none text-center font-display-lg text-display-lg text-primary focus:ring-0 p-0 w-44 outline-none font-bold"
            />
            <span className="font-body-lg text-sm text-on-surface-variant font-bold">FCFA</span>
          </div>
        </div>

        {/* Details Form Card */}
        <div className="space-y-4 bg-surface rounded-xl p-5 shadow-[0px_4px_20px_rgba(10,25,47,0.05)] border border-surface-container-high">
          {/* Compte source / débité */}
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
              {type === 'TRANSFER' ? 'COMPTE SOURCE' : 'COMPTE'}
            </label>
            <div className="relative">
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString()} FCFA)</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
            </div>
          </div>

          {/* Compte cible (TRANSFER ONLY) */}
          {type === 'TRANSFER' && (
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                COMPTE DESTINATION
              </label>
              <div className="relative">
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString()} FCFA)</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">DATE</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
            />
          </div>

          {/* Personne concernée (NOT FOR TRANSFERS) */}
          {type !== 'TRANSFER' && (
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                PERSONNE CONCERNÉE (OPTIONNELLE)
              </label>
              <div className="relative">
                <select
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none outline-none"
                >
                  <option value="">Aucune personne</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName || ''}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">DESCRIPTION</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'TRANSFER' ? 'Virement entre comptes' : "Ex: Déjeuner d'affaires"}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
            />
          </div>
        </div>

        {/* Categories Grid (NOT FOR TRANSFERS) */}
        {type !== 'TRANSFER' && filteredCategories.length > 0 && (
          <div className="space-y-3 bg-surface rounded-xl p-5 shadow-[0px_4px_20px_rgba(10,25,47,0.05)] border border-surface-container-high">
            <label className="font-label-caps text-[10px] text-on-surface-variant block uppercase tracking-wider font-bold">CATÉGORIE</label>
            <div className="grid grid-cols-4 gap-3">
              {filteredCategories.map(cat => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors group cursor-pointer ${
                      isSelected ? 'bg-secondary-container/10 border border-secondary-container' : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                    </div>
                    <span className={`font-label-caps text-[10px] text-center truncate w-full ${
                      isSelected ? 'font-bold text-secondary' : 'text-on-surface-variant'
                    }`}>
                      {cat.name.slice(0, 8)}.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Justificatif / File Attachment */}
        <div className="space-y-3 bg-surface rounded-xl p-5 shadow-[0px_4px_20px_rgba(10,25,47,0.05)] border border-surface-container-high">
          <label className="font-label-caps text-[10px] text-on-surface-variant block uppercase tracking-wider font-bold">JUSTIFICATIF</label>
          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <label className="flex-1 py-4 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-outline-variant rounded-xl hover:border-secondary hover:bg-surface-container-low transition-all text-on-surface-variant hover:text-secondary cursor-pointer">
                <span className="material-symbols-outlined">image</span>
                <span className="font-label-caps text-[10px] font-bold">Sélectionner</span>
                <input
                  type="file"
                  onChange={(e) => setFile(e.file = e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />
              </label>
            </div>
            {file && (
              <div className="flex items-center justify-between p-2 bg-surface-container-low rounded-lg text-xs">
                <span className="truncate max-w-[200px] font-semibold text-primary">{file.name}</span>
                <button 
                  type="button" 
                  onClick={() => setFile(null)} 
                  className="text-error font-semibold"
                >
                  Retirer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 pb-6">
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[56px] rounded-[12px] bg-secondary-container text-on-secondary-container font-headline-md text-sm font-bold flex items-center justify-center shadow-[0px_8px_30px_rgba(254,208,27,0.12)] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer la transaction'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTransaction;
