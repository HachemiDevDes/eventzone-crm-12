import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, icon, ...props }, ref) => {
    return (
      <div className="relative w-full group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 group-focus-within:text-primary transition-colors">
            {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
          </div>
        )}
        <select
          className={cn(
            "w-full bg-white border border-neutral-200 rounded-xl py-2.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-neutral-900 font-medium text-sm appearance-none cursor-pointer pr-10 shadow-sm hover:border-neutral-300",
            icon ? "pl-10" : "px-4",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 group-focus-within:text-primary transition-colors">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";
