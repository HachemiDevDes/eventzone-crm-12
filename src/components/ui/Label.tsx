import React from 'react';
import { cn } from '../../lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
  children?: React.ReactNode;
  htmlFor?: string;
}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn("block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2", className)}
      {...props}
    />
  );
}
