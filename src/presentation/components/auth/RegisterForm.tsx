'use client';

import { useState } from 'react';
import { useAuth } from '@/src/presentation/hooks/useAuth';
import Button from '@/src/presentation/components/ui/Button';
import Input from '@/src/presentation/components/ui/Input';
import Card from '@/src/presentation/components/ui/Card';

interface RegisterFormProps {
  onToggleMode: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          setError('Cette adresse email est déjà utilisée.');
          break;
        case 'auth/invalid-email':
          setError('Adresse email invalide.');
          break;
        case 'auth/weak-password':
          setError('Le mot de passe est trop faible.');
          break;
        default:
          setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto" padding="lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Créer un compte</h1>
        <p className="text-gray-600 dark:text-gray-400">Rejoignez Finabitt et prenez le contrôle</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(value) => setEmail(value)}
          required
          autoComplete="email"
        />

        <Input
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(value) => setPassword(value)}
          required
          autoComplete="new-password"
          helperText="Au moins 6 caractères"
        />

        <Input
          label="Confirmer le mot de passe"
          type="password"
          value={confirmPassword}
          onChange={(value) => setConfirmPassword(value)}
          required
          autoComplete="new-password"
        />

        {error && (
          <div className="p-3 text-sm text-error bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          isLoading={loading}
          className="mt-6"
        >
          Créer mon compte
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Déjà un compte ?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary hover:text-primary-dark font-medium"
          >
            Se connecter
          </button>
        </p>
      </div>
    </Card>
  );
};

export default RegisterForm;