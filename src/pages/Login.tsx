import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginPin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [isPinMode, setIsPinMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isPinMode) {
        // Fallback email for PIN login convenience in local environment
        const pinEmail = email || 'marc@finora.com'; 
        await loginPin(pinEmail, pin);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-container-padding bg-background text-on-background max-w-sm mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-display-lg text-display-lg text-primary tracking-tight mb-2">FINORA</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Connectez-vous pour gérer vos finances
        </p>
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container-high shadow-md">
        {error && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container text-xs rounded-lg border border-error/20 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isPinMode ? (
            <>
              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Adresse Email
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@finora.com"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-body-sm text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Mot de passe
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-body-sm text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
                />
              </div>
            </>
          ) : (
            <>
              {/* Quick Login - Email Pre-fill / Select */}
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Adresse Email
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: marc@finora.com"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-body-sm text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
                />
              </div>

              {/* PIN Code */}
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Code PIN à 4 chiffres
                </label>
                <input 
                  type="password" 
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-body-sm text-primary focus:border-secondary focus:ring-1 focus:ring-secondary text-center text-xl tracking-widest outline-none transition-all"
                />
              </div>
            </>
          )}

          {/* Action Button */}
          <button 
            type="submit"
            disabled={submitting}
            className="w-full h-[56px] rounded-[12px] bg-secondary-container text-on-secondary-container font-headline-md text-sm font-bold flex items-center justify-center shadow-[0px_8px_30px_rgba(254,208,27,0.12)] active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
          >
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 flex justify-between items-center text-xs">
          {/* Switch Mode */}
          <button 
            type="button"
            onClick={() => setIsPinMode(!isPinMode)}
            className="text-secondary hover:underline font-semibold"
          >
            {isPinMode ? 'Utiliser mot de passe' : 'Utiliser code PIN'}
          </button>

          <Link to="/register" className="text-on-surface-variant hover:underline font-medium">
            Créer un compte
          </Link>
        </div>
      </div>

      <div className="mt-8 text-center text-[11px] text-on-surface-variant">
        <p className="font-semibold text-primary">Identifiants de démonstration :</p>
        <p>Email: <span className="font-mono">marc@finora.com</span> • Mot de passe: <span className="font-mono">password</span></p>
        <p>PIN: <span className="font-mono">1234</span></p>
      </div>
    </div>
  );
};

export default Login;
