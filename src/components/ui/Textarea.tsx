import React from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-neutral-900 font-medium text-sm resize-none placeholder:text-neutral-500 shadow-sm hover:border-neutral-300",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
