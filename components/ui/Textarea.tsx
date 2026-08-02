import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label ? (
          <label htmlFor={inputId} className="block text-sm text-star-dim">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full resize-none rounded-xl border border-space-border bg-space-deep px-4 py-3 text-star',
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

Textarea.displayName = 'Textarea';
