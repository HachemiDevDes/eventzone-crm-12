import React from 'react';
import { cn } from '../../lib/utils';
import { Calendar } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-neutral-900 font-medium text-sm placeholder:text-neutral-500 shadow-sm hover:border-neutral-300",
          type === 'date' && "cursor-pointer",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
