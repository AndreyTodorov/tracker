import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-200 mb-1.5">
            {label}
          </label>
        )}
        <input
          className={cn(
            'flex h-10 w-full rounded-lg glass bg-white/5 px-4 py-2 text-white placeholder:text-gray-400',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'ring-2 ring-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
