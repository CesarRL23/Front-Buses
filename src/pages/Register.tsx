import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FormInput } from '../components/FormInput';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { Mail, Lock, User as UserIcon, Bus } from 'lucide-react';
import { validatePassword } from '../utils/fakeJwt';
import ReCAPTCHA from 'react-google-recaptcha';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!acceptTerms) {
      newErrors.terms = 'Debes aceptar los términos y condiciones';
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
      await register({ ...formData, captchaToken: captchaToken || '' });
      navigate('/dashboard');
    } catch (error: any) {
      setApiError(
        error.response?.data?.message || error.message || 'Error al registrar usuario'
      );
      setCaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="surface-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/20">
              <Bus className="h-10 w-10 text-white" />
            </div>
          </div>
          <p className="soft-label">Nueva cuenta</p>
          <h2 className="mt-2 font-['Space_Grotesk'] text-3xl font-bold text-slate-900">Crear cuenta</h2>
          <p className="mt-2 text-slate-600">
            Únete a la red de Buses Inteligentes
          </p>
        </div>

        {apiError && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Nombre"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Juan"
              icon={<UserIcon className="h-5 w-5 text-gray-400" />}
              error={errors.firstName}
            />

            <FormInput
              label="Apellido"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Pérez"
              icon={<UserIcon className="h-5 w-5 text-gray-400" />}
              error={errors.lastName}
            />
          </div>

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

          <div>
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
            <div className="mt-3">
              <PasswordStrengthIndicator password={formData.password} />
            </div>
          </div>

          <FormInput
            label="Confirmar Contraseña"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            icon={<Lock className="h-5 w-5 text-gray-400" />}
            error={errors.confirmPassword}
          />

          <div className="flex justify-center my-4">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LeO8rosAAAAANdEwKEoMaSlgQ3tExMhl0r4VUUu"
              onChange={onCaptchaChange}
            />
          </div>

          <div>
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                Acepto los{' '}
                <a href="#" className="text-green-600 hover:text-green-700">
                  términos y condiciones
                </a>{' '}
                y la{' '}
                <a href="#" className="text-green-600 hover:text-green-700">
                  política de privacidad
                </a>
              </span>
            </label>
            {errors.terms && (
              <p className="mt-1 text-sm text-red-600">{errors.terms}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          ¿Ya tienes una cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
};
