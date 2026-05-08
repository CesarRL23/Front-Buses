import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FormInput } from '../components/FormInput';
import { Mail, Lock, Bus } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, startOAuth, loginWithGoogle, loginWithMicrosoft, loginWithGithub } = useAuth();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors({ ...errors, [e.target.name]: '' });
    setApiError('');
  };

  const onCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    setApiError('');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (!captchaToken) {
      setApiError('Por favor verifica que no eres un robot');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');

    try {
      await login({ ...formData, captchaToken: captchaToken || '' });
      if (localStorage.getItem('pending_2fa_email')) {
        navigate('/two-factor');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setApiError(
        error.response?.data?.message || error.message || 'Error al iniciar sesión'
      );
      // Reset captcha on error
      setCaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === 'google') {
      setIsLoading(true);
      setApiError('');
      try {
        await loginWithGoogle();
        navigate('/dashboard');
      } catch (error) {
        setApiError(
          error instanceof Error ? error.message : 'Error al iniciar sesión con Google'
        );
      } finally {
        setIsLoading(false);
      }
    } else if (provider === 'microsoft') {
      setIsLoading(true);
      setApiError('');
      try {
        await loginWithMicrosoft();
        navigate('/dashboard');
      } catch (error) {
        setApiError(
          error instanceof Error ? error.message : 'Error al iniciar sesión con Microsoft'
        );
      } finally {
        setIsLoading(false);
      }
    } else if (provider === 'github') {
      setIsLoading(true);
      setApiError('');
      try {
        await loginWithGithub();
        navigate('/dashboard');
      } catch (error) {
        setApiError(
          error instanceof Error ? error.message : 'Error al iniciar sesión con GitHub'
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      startOAuth(provider);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="surface-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-600 text-white shadow-lg shadow-sky-600/20">
              <Bus className="h-10 w-10 text-white" />
            </div>
          </div>
          <p className="soft-label">Acceso a la red</p>
          <h2 className="mt-2 font-['Space_Grotesk'] text-3xl font-bold text-slate-900">Iniciar sesión</h2>
          <p className="mt-2 text-slate-600">Accede a tu cuenta de Buses Inteligentes</p>
        </div>

        {apiError && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormInput
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            icon={<Mail className="h-5 w-5 text-gray-400" />}
            error={errors.email}
          />

          <FormInput
            label="Contraseña"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            icon={<Lock className="h-5 w-5 text-gray-400" />}
            error={errors.password}
          />

          <div className="flex justify-center my-4">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LeO8rosAAAAANdEwKEoMaSlgQ3tExMhl0r4VUUu"
              onChange={onCaptchaChange}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="ml-2 text-slate-600">Recordarme</span>
            </label>
            <Link
              to="/forgot-password"
              className="font-medium text-sky-700 hover:text-sky-800"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-slate-500">O continuar con</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 transition hover:bg-slate-50"
            >
              {/* Google icon */}
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('microsoft')}
              className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 transition hover:bg-slate-50"
            >
              {/* Microsoft icon */}
              <svg className="h-5 w-5" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 transition hover:bg-slate-50"
            >
              {/* GitHub icon */}
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          ¿No tienes una cuenta?{' '}
          <Link
            to="/register"
            className="font-medium text-sky-700 hover:text-sky-800"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
};
