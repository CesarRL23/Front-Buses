import React from 'react';
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
    if (score === 0) return 'bg-red-500';
    if (score <= 40) return 'bg-orange-500';
    if (score <= 60) return 'bg-yellow-500';
    if (score <= 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Fortaleza de contraseña:</span>
        <span className="text-sm font-medium text-gray-700">
          {getStrengthLabel(strength)}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(
            strength
          )}`}
          style={{ width: `${strength}%` }}
        ></div>
      </div>

      {errors.length > 0 && (
        <ul className="text-xs text-red-600 space-y-1 mt-2">
          {errors.map((error, index) => (
            <li key={index}>• {error}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
