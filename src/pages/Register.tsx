import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-container-padding bg-background text-on-background max-w-sm mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-display-lg text-display-lg text-primary tracking-tight mb-2">FINORA</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Inscrivez-vous pour commencer
        </p>
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container-high shadow-md">
        {error && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container text-xs rounded-lg border border-error/20 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
              Nom complet
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Marc Koffi"
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-body-sm text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
            />
          </div>

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

          {/* Mot de passe */}
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
              Mot de passe
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 caractères"
              required
              minLength={6}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-sm text-body-sm text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
            />
          </div>

          {/* Action Button */}
          <button 
            type="submit"
            disabled={submitting}
            className="w-full h-[56px] rounded-[12px] bg-secondary-container text-on-secondary-container font-headline-md text-sm font-bold flex items-center justify-center shadow-[0px_8px_30px_rgba(254,208,27,0.12)] active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
          >
            {submitting ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-on-surface-variant">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-secondary font-semibold hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
