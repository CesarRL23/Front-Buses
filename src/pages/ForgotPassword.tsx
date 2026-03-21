import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FormInput } from '../components/FormInput';
import { Mail, ArrowLeft, CheckCircle, Bus } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (): boolean => {
    if (!email) {
      setError('El email es requerido');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('El email no es válido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) return;

    setIsLoading(true);
    setError('');

    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Error al enviar email de recuperación'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Email Enviado
            </h2>
            <p className="text-gray-600 mb-6">
              Se ha enviado un email a <strong>{email}</strong> con las
              instrucciones para recuperar tu contraseña.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Si no recibes el email en los próximos minutos, revisa tu carpeta
              de spam.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Volver al inicio de sesión</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-600 p-3 rounded-full">
              <Bus className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Recuperar Contraseña
          </h2>
          <p className="text-gray-600 mt-2">
            Ingresa tu email y te enviaremos instrucciones
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="tu@email.com"
            icon={<Mail className="h-5 w-5 text-gray-400" />}
            error={error}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
          </button>
        </form>

        <div className="mt-6">
          <Link
            to="/login"
            className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al inicio de sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
