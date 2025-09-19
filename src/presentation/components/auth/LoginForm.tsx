'use client';

import { useState } from 'react';
import { useAuth } from '@/src/presentation/hooks/useAuth';
import Button from '@/src/presentation/components/ui/Button';
import Input from '@/src/presentation/components/ui/Input';
import Card from '@/src/presentation/components/ui/Card';

interface LoginFormProps {
  onToggleMode: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (error: unknown) {
      setError('Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto" padding="lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Connexion</h1>
        <p className="text-gray-600 dark:text-gray-400">Accédez à votre espace Finabitt</p>
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
          autoComplete="current-password"
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
          Se connecter
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Pas encore de compte ?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary hover:text-primary-dark font-medium"
          >
            Créer un compte
          </button>
        </p>
      </div>
    </Card>
  );
};

export default LoginForm;