import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20",
      secondary: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
      danger: "bg-danger text-white hover:bg-danger/90 shadow-lg shadow-danger/20",
      ghost: "bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700",
      outline: "bg-transparent border-2 border-neutral-200 text-neutral-700 hover:border-primary/50 hover:text-primary"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs rounded-full",
      md: "px-4 py-2 text-sm rounded-full",
      lg: "px-6 py-3 text-base rounded-full",
      icon: "p-2 rounded-full"
    };

    return (
      <button
        ref={ref}
        className={cn(
          "font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-95",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
