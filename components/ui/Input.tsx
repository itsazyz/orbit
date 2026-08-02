import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label ? (
          <label htmlFor={inputId} className="block text-sm text-star-dim">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border border-space-border bg-space-deep px-4 py-3 text-star',
            'placeholder:text-star-dim/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
