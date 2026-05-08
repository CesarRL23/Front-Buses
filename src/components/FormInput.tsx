import React, { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      <label className="soft-label mb-2 block">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full rounded-2xl border bg-slate-50/90 px-4 py-3.5 text-sm text-slate-900 outline-none transition
            placeholder:text-slate-400 focus:bg-white focus:ring-4
            ${icon ? 'pl-11' : ''}
            ${
              error
                ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
    </div>
  );
};
