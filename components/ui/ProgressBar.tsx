'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  step: number;
  total: number;
  className?: string;
}

export function ProgressBar({ step, total, className }: ProgressBarProps) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className={cn('space-y-2', className)} aria-label={`Step ${step} of ${total}`}>
      <div className="h-1 w-full overflow-hidden rounded-full bg-space-border">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
