import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Person } from '../types';

export const People: React.FC = () => {
  const { people, createPerson, deletePerson } = useData();

  const [isAdding, setIsAdding] = useState(false);
  const [activePerson, setActivePerson] = useState<Person | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim()) return;

    setSubmitting(true);
    try {
      await createPerson({ firstName, lastName, phone, email, notes });
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setIsAdding(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce contact ? Cela n\'est possible que s\'il n\'a pas de dettes ou créances en cours.')) {
      try {
        await deletePerson(id);
        setActivePerson(null);
      } catch (err: any) {
        alert(err.message || 'Erreur de suppression.');
      }
    }
  };

  return (
    <div className="space-y-stack-lg pb-10">
      <div className="flex justify-between items-center">
        <h2 className="font-headline-md text-headline-md text-primary">Carnet financier</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg font-label-caps text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Nouveau contact
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-error-container text-on-error-container text-xs font-semibold rounded-xl">
          {error}
        </div>
      )}

      {/* Add Contact Card */}
      {isAdding && (
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container-high shadow-md space-y-4">
          <h3 className="font-headline-md text-base text-primary">Créer un nouveau contact</h3>
          <form onSubmit={handleAddSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: Abdou"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ex: Diallo"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Téléphone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +228 90..."
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Adresse Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@gmail.com"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ami, Client, Fournisseur..."
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-secondary-container text-on-secondary-container rounded-lg font-headline-md text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? 'Création...' : 'Créer'}
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

      {/* People Directory */}
      <div className="space-y-4">
        {people.map(p => {
          const isExpanded = activePerson?.id === p.id;
          return (
            <div
              key={p.id}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-[0px_4px_20px_rgba(10,25,47,0.05)] transition-all"
            >
              {/* Summary Card (Header) */}
              <div
                onClick={() => {
                  if (isExpanded) {
                    setActivePerson(null);
                  } else {
                    // Fetch full history details by updating active state
                    // The standard listing already calculated balances!
                    setActivePerson(p);
                  }
                }}
                className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant/35 bg-surface-container-low">
                    <img
                      src={p.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.firstName}`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-sm text-primary">
                      {p.firstName} {p.lastName || ''}
                    </h3>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 leading-none">
                      {p.notes || 'Aucune note'}
                    </p>
                  </div>
                </div>

                {/* Balances summary */}
                <div className="text-right">
                  <p className={`font-numeric-data text-xs font-bold ${
                    p.netBalance > 0 
                      ? 'text-success-green' 
                      : p.netBalance < 0 
                        ? 'text-danger-red' 
                        : 'text-on-surface-variant'
                  }`}>
                    {p.netBalance > 0 ? '+' : ''}{p.netBalance.toLocaleString()} FCFA
                  </p>
                  <p className="text-[10px] text-on-surface-variant leading-none mt-1">Solde Net</p>
                </div>
              </div>

              {/* Expanded details and history */}
              {isExpanded && (
                <div className="px-4 pb-5 pt-2 bg-surface-container-low border-t border-outline-variant/10 space-y-4">
                  {/* Ledger Metrics */}
                  <div className="grid grid-cols-2 gap-4 py-2 border-b border-outline-variant/10">
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Elle me doit</p>
                      <p className="font-numeric-data text-sm font-bold text-success-green">
                        {p.sheOwesMe.toLocaleString()} <span className="text-[10px]">FCFA</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Je lui dois</p>
                      <p className="font-numeric-data text-sm font-bold text-danger-red">
                        {p.iOweHer.toLocaleString()} <span className="text-[10px]">FCFA</span>
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="text-xs space-y-1 text-on-surface-variant">
                    {p.phone && <p><span className="font-semibold text-primary">Téléphone :</span> {p.phone}</p>}
                    {p.email && <p><span className="font-semibold text-primary">Email :</span> {p.email}</p>}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="bg-error/10 hover:bg-error/25 text-error px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold text-[11px] active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                      Supprimer le contact
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {people.length === 0 && (
          <div className="py-12 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl text-center text-on-surface-variant text-xs">
            Aucun contact dans votre carnet financier.
          </div>
        )}
      </div>
    </div>
  );
};

export default People;
