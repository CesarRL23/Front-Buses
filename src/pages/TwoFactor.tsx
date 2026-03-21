import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Bus } from 'lucide-react';

export const TwoFactor: React.FC = () => {
  const navigate = useNavigate();
  const { verifyTwoFactor, isAuthenticated } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const pendingEmail = localStorage.getItem('pending_2fa_email');
    if (!pendingEmail && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, navigate]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      setError('Por favor ingresa los 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await verifyTwoFactor(fullCode);
      navigate('/dashboard');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Código de verificación inválido'
      );
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    setTimeLeft(60);
    // TODO: Integrar con endpoint de backend para reenviar 2FA
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-full">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Verificación en Dos Pasos</h2>
          <p className="text-gray-600 mt-2">
            Ingresa el código de 6 dígitos generado por tu aplicación de autenticación.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center space-x-3" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:outline-none transition"
              />
            ))}
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
              <Bus className="h-5 w-5" />
              <span className="text-sm">
                Tiempo restante: <span className="font-semibold text-indigo-600">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
              </span>
            </div>
            {timeLeft === 0 ? (
              <button
                type="button"
                onClick={handleResendCode}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                Reenviar código
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                ¿No recibiste el código? <button type="button" disabled className="text-gray-400 cursor-not-allowed">Espera {timeLeft}s</button>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || code.join('').length !== 6}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verificando...' : 'Verificar Código'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-gray-700 text-sm"
          >
            Cancelar y volver
          </button>
        </div>
      </div>
    </div>
  );
};
