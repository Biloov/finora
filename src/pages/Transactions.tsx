import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Transaction } from '../types';

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, accounts, categories, deleteTransaction } = useData();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL'); // ALL, INCOME, EXPENSE, TRANSFER
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL'); // Account ID
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL'); // Category ID
  
  const [activeTxForDelete, setActiveTxForDelete] = useState<Transaction | null>(null);

  // Filter logic
  const filteredTransactions = transactions.filter(t => {
    // Search
    const searchMatch = !search || 
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.category && t.category.name.toLowerCase().includes(search.toLowerCase())) ||
      (t.person && `${t.person.firstName} ${t.person.lastName || ''}`.toLowerCase().includes(search.toLowerCase()));

    // Type
    const typeMatch = selectedType === 'ALL' || t.type === selectedType;

    // Account
    const accountMatch = selectedAccount === 'ALL' || t.accountId === selectedAccount || t.targetAccountId === selectedAccount;

    // Category
    const categoryMatch = selectedCategory === 'ALL' || t.categoryId === selectedCategory;

    return searchMatch && typeMatch && accountMatch && categoryMatch;
  });

  // Grouping by Date
  const groupTransactions = (txs: Transaction[]) => {
    const groups: Record<string, Transaction[]> = {};
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    txs.forEach(t => {
      const tDate = new Date(t.date);
      const tDateStr = tDate.toDateString();
      let key = '';

      if (tDateStr === todayStr) {
        key = "Aujourd'hui";
      } else if (tDateStr === yesterdayStr) {
        key = "Hier";
      } else {
        key = tDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(t);
    });

    return groups;
  };

  const grouped = groupTransactions(filteredTransactions);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('fr-FR');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette transaction ? Le solde des comptes sera recalculé.')) {
      try {
        await deleteTransaction(id);
        setActiveTxForDelete(null);
      } catch (err: any) {
        alert(err.message || 'Erreur lors de la suppression.');
      }
    }
  };

  return (
    <div className="space-y-stack-lg pb-10">
      {/* Header & Search */}
      <section className="space-y-stack-md">
        <h2 className="font-headline-md text-headline-md text-on-background">Transactions</h2>
        
        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-surface-container rounded-xl border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all font-body-sm text-body-sm text-on-surface placeholder:text-outline"
            placeholder="Rechercher une transaction..."
          />
        </div>

        {/* Filter Chips Bar */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
          {/* Type Filter */}
          <div className="flex-shrink-0 relative">
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 pr-8 rounded-full border border-outline-variant text-on-surface-variant bg-surface hover:bg-surface-container-low font-label-caps text-[11px] appearance-none focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
            >
              <option value="ALL">Tous les types</option>
              <option value="INCOME">Revenus</option>
              <option value="EXPENSE">Dépenses</option>
              <option value="TRANSFER">Transferts</option>
            </select>
            <span className="material-symbols-outlined text-[16px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
          </div>

          {/* Account Filter */}
          <div className="flex-shrink-0 relative">
            <select 
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-4 py-2 pr-8 rounded-full border border-outline-variant text-on-surface-variant bg-surface hover:bg-surface-container-low font-label-caps text-[11px] appearance-none focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
            >
              <option value="ALL">Tous les comptes</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[16px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
          </div>

          {/* Category Filter */}
          <div className="flex-shrink-0 relative">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 pr-8 rounded-full border border-outline-variant text-on-surface-variant bg-surface hover:bg-surface-container-low font-label-caps text-[11px] appearance-none focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
            >
              <option value="ALL">Toutes catégories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[16px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
          </div>
        </div>
      </section>

      {/* Transactions List */}
      <section className="space-y-stack-lg">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date} className="space-y-stack-sm">
            <h3 className="font-label-caps text-[11px] text-outline uppercase tracking-wider pl-2">{date}</h3>
            
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_4px_20px_rgba(10,25,47,0.05)] border border-outline-variant/30 overflow-hidden">
              {txs.map(t => {
                const isNegative = t.type === 'EXPENSE';
                const isTransfer = t.type === 'TRANSFER';
                const isSelected = activeTxForDelete?.id === t.id;

                return (
                  <div key={t.id} className="border-b border-outline-variant/30 last:border-0">
                    <div 
                      onClick={() => setActiveTxForDelete(isSelected ? null : t)}
                      className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer group"
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
                          <p className="font-body-lg text-sm font-semibold text-on-surface truncate max-w-[150px] md:max-w-xs">
                            {t.description || (isTransfer ? 'Transfert' : t.category?.name || 'Sans description')}
                          </p>
                          <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                            {t.category?.name || (isTransfer ? 'Virement' : 'Général')} • {t.account.name}
                            {t.person && ` • ${t.person.firstName}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className={`font-numeric-data text-sm font-bold ${
                            isNegative 
                              ? 'text-danger-red' 
                              : isTransfer 
                                ? 'text-on-surface-variant' 
                                : 'text-success-green'
                          }`}>
                            {isNegative ? '-' : isTransfer ? '' : '+'}{formatCurrency(t.amount)} <span className="text-[10px]">FCFA</span>
                          </p>
                          {t.attachmentUrl && (
                            <span className="material-symbols-outlined text-[14px] text-outline mt-1" title="Justificatif joint">description</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable details and actions */}
                    {isSelected && (
                      <div className="px-4 pb-4 pt-1 bg-surface-container-low flex flex-col gap-2 text-xs border-t border-outline-variant/10">
                        {t.description && <p><span className="font-semibold text-on-surface-variant">Description :</span> {t.description}</p>}
                        {isTransfer && t.targetAccount && (
                          <p><span className="font-semibold text-on-surface-variant">Vers le compte :</span> {t.targetAccount.name}</p>
                        )}
                        {t.person && (
                          <p><span className="font-semibold text-on-surface-variant">Personne concernée :</span> {t.person.firstName} {t.person.lastName || ''}</p>
                        )}
                        {t.attachmentUrl && (
                          <p>
                            <span className="font-semibold text-on-surface-variant">Justificatif :</span>{' '}
                            <a 
                              href={t.attachmentUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-secondary hover:underline flex items-center gap-1 inline-flex"
                            >
                              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                              Voir le fichier
                            </a>
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button 
                            onClick={() => handleDelete(t.id)}
                            className="bg-error text-on-error px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold cursor-pointer active:scale-95 transition-all text-[11px]"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="py-12 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl text-center text-on-surface-variant text-xs">
            Aucune opération financière ne correspond à vos critères de recherche.
          </div>
        )}
      </section>
    </div>
  );
};

export default Transactions;
