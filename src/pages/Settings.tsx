import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const Settings: React.FC = () => {
  const { user, logout, setPin, token } = useAuth();
  const { notifications, readNotification, clearNotifications, refreshAll } = useData();

  // PIN field
  const [pinCode, setPinCode] = useState(user?.pinCode || '');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);
    if (pinCode.length !== 4) {
      setPinMessage('Le code PIN doit comporter 4 chiffres.');
      return;
    }

    try {
      await setPin(pinCode);
      setPinMessage('Code PIN mis à jour avec succès.');
    } catch (err: any) {
      setPinMessage(err.message || 'Erreur lors de la configuration.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);
    setPwdError(null);

    if (!oldPassword || !newPassword) return;

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPwdMessage('Mot de passe changé avec succès.');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwdError(err.message || 'Erreur lors de la modification.');
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm('Voulez-vous vraiment écraser toutes vos données actuelles et recharger les données de démonstration de la maquette ?')) {
      setSubmitting(true);
      setDemoMessage(null);
      try {
        const res = await fetch('/api/auth/reset-demo', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setDemoMessage('Données de démonstration chargées. Redirection...');
          await refreshAll();
        } else {
          const d = await res.json();
          throw new Error(d.error);
        }
      } catch (err: any) {
        alert(err.message || 'Erreur lors du rechargement.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Attention ! Voulez-vous vraiment supprimer toutes vos données financières ? Cette action est irréversible.')) {
      setSubmitting(true);
      setDemoMessage(null);
      try {
        const res = await fetch('/api/auth/clear-data', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setDemoMessage('Toutes les données ont été effacées.');
          await refreshAll();
        } else {
          const d = await res.json();
          throw new Error(d.error);
        }
      } catch (err: any) {
        alert(err.message || 'Erreur de suppression.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-stack-lg pb-10">
      <section className="space-y-1">
        <h2 className="font-headline-md text-headline-md text-primary">Mon Profil & Paramètres</h2>
        <p className="text-xs text-on-surface-variant">Gérez vos identifiants, votre code PIN de sécurité et vos données financières.</p>
      </section>

      {/* User info card */}
      <section className="bg-surface p-5 rounded-2xl border border-outline-variant/30 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden border border-outline-variant/35 bg-surface-container-low">
          <img src={user?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div>
          <h3 className="font-headline-md text-base text-primary">{user?.name}</h3>
          <p className="text-xs text-on-surface-variant">{user?.email}</p>
        </div>
      </section>

      {/* Notifications Management */}
      <section className="bg-surface p-5 rounded-2xl border border-outline-variant/30 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-headline-md text-base text-primary">Notifications</h3>
          {notifications.length > 0 && (
            <button 
              onClick={clearNotifications}
              className="text-[10px] text-error font-bold uppercase hover:underline"
            >
              Effacer tout
            </button>
          )}
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
          {notifications.map(notif => (
            <div 
              key={notif.id}
              onClick={() => !notif.isRead && readNotification(notif.id)}
              className={`p-3 rounded-lg border text-xs flex justify-between items-center transition-colors ${
                notif.isRead 
                  ? 'bg-surface-container-low/40 border-outline-variant/10 text-on-surface-variant' 
                  : 'bg-secondary-container/5 border-secondary-container/20 text-primary font-semibold cursor-pointer hover:bg-secondary-container/10'
              }`}
            >
              <p className="pr-4">{notif.message}</p>
              {!notif.isRead && <span className="w-1.5 h-1.5 bg-error rounded-full flex-shrink-0"></span>}
            </div>
          ))}

          {notifications.length === 0 && (
            <p className="text-xs text-on-surface-variant text-center py-4">Aucune notification.</p>
          )}
        </div>
      </section>

      {/* PIN configuration */}
      <section className="bg-surface p-5 rounded-2xl border border-outline-variant/30 space-y-4">
        <h3 className="font-headline-md text-base text-primary">Sécurité (Code PIN)</h3>
        {pinMessage && <p className="text-xs font-semibold text-secondary">{pinMessage}</p>}
        
        <form onSubmit={handleSetPin} className="flex gap-4 items-end">
          <div className="flex-1 flex flex-col gap-1">
            <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Code PIN (4 chiffres)</label>
            <input
              type="password"
              maxLength={4}
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 1234"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary text-center tracking-widest outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg font-bold text-xs active:scale-95 transition-all"
          >
            Enregistrer
          </button>
        </form>
      </section>

      {/* Change password */}
      <section className="bg-surface p-5 rounded-2xl border border-outline-variant/30 space-y-4">
        <h3 className="font-headline-md text-base text-primary">Modifier le mot de passe</h3>
        {pwdMessage && <p className="text-xs font-semibold text-success-green">{pwdMessage}</p>}
        {pwdError && <p className="text-xs font-semibold text-danger-red">{pwdError}</p>}
        
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Ancien mot de passe</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-[10px] text-on-surface-variant font-bold">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 font-body-sm text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-secondary-container text-on-secondary-container rounded-lg font-bold text-xs active:scale-95 transition-all"
          >
            Mettre à jour le mot de passe
          </button>
        </form>
      </section>

      {/* Demo Controls panel */}
      <section className="bg-surface p-5 rounded-2xl border border-outline-variant/30 space-y-4">
        <h3 className="font-headline-md text-base text-primary">Gestion des données & Démonstration</h3>
        {demoMessage && <p className="text-xs font-semibold text-secondary">{demoMessage}</p>}
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleResetDemo}
            disabled={submitting}
            className="py-3 bg-secondary-container/10 border border-secondary text-secondary rounded-xl font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Recharger Démo
          </button>

          <button
            onClick={handleClearData}
            disabled={submitting}
            className="py-3 bg-danger-red/10 border border-danger-red text-danger-red rounded-xl font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            Tout Effacer
          </button>
        </div>
      </section>

      {/* Logout button */}
      <button
        onClick={logout}
        className="w-full py-4 bg-primary text-white rounded-xl font-headline-md text-sm font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
        Se déconnecter
      </button>
    </div>
  );
};

export default Settings;
