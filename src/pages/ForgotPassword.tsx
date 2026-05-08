import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FormInput } from '../components/FormInput';
import { Mail, ArrowLeft, CheckCircle, Bus, Lock, KeyRound } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('El email no es válido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await forgotPassword(email);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar email de recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length < 6) {
      setError('El código no es válido');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (resetPassword) {
        await resetPassword(email, code, newPassword);
      }
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="surface-card w-full max-w-md p-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              ¡Contraseña Restablecida!
            </h2>
            <p className="mb-8 text-slate-600">
              Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 font-medium text-sky-700 hover:text-sky-800"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Ir al inicio de sesión</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-600 text-white shadow-lg shadow-sky-600/20">
              <Bus className="h-10 w-10 text-white" />
            </div>
          </div>
          <p className="soft-label">Recuperación de acceso</p>
          <h2 className="mt-2 font-['Space_Grotesk'] text-3xl font-bold text-slate-900">
            {step === 1 ? 'Recuperar Contraseña' : 'Nueva Contraseña'}
          </h2>
          <p className="mt-2 text-slate-600">
            {step === 1
              ? 'Ingresa tu email y te enviaremos un código'
              : 'Ingresa el código que recibiste y tu nueva contraseña'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-6">
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
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Enviando...' : 'Enviar Código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <FormInput
              label="Código de Recuperación"
              type="text"
              name="code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="Ejemplo: 123456"
              icon={<KeyRound className="h-5 w-5 text-gray-400" />}
            />

            <FormInput
              label="Nueva Contraseña"
              type="password"
              name="newPassword"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError('');
              }}
              placeholder="Mínimo 6 caracteres"
              icon={<Lock className="h-5 w-5 text-gray-400" />}
            />

            <FormInput
              label="Confirmar Contraseña"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              placeholder="Confirma tu nueva contraseña"
              icon={<Lock className="h-5 w-5 text-gray-400" />}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Cargando...' : 'Restablecer Contraseña'}
            </button>
          </form>
        )}

        <div className="mt-6">
          <Link
            to="/login"
            className="flex items-center justify-center space-x-2 text-slate-600 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al inicio de sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

