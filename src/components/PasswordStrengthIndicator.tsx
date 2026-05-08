import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { validatePassword } from '../utils/fakeJwt';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<
  PasswordStrengthIndicatorProps
> = ({ password }) => {
  if (!password) return null;

  const { strength, errors } = validatePassword(password);

  const getStrengthLabel = (score: number): string => {
    if (score === 0) return 'Muy débil';
    if (score <= 40) return 'Débil';
    if (score <= 60) return 'Media';
    if (score <= 80) return 'Fuerte';
    return 'Muy fuerte';
  };

  const getStrengthColor = (score: number): string => {
    if (score === 0) return 'from-rose-500 to-orange-500';
    if (score <= 40) return 'from-orange-500 to-amber-500';
    if (score <= 60) return 'from-amber-500 to-yellow-500';
    if (score <= 80) return 'from-sky-500 to-cyan-500';
    return 'from-emerald-500 to-teal-500';
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-600">Fortaleza de contraseña</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          {getStrengthLabel(strength)}
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-200">
        <div
          className={`h-2 rounded-full bg-gradient-to-r transition-all duration-300 ${getStrengthColor(
            strength
          )}`}
          style={{ width: `${strength}%` }}
        />
      </div>

      {errors.length > 0 && (
        <ul className="space-y-2 text-xs text-slate-600">
          {errors.map((error, index) => (
            <li key={index} className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
