import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
    
    const baseStyle = `
      inline-flex justify-center items-center gap-2
      rounded-xl text-sm font-semibold
      whitespace-nowrap
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      active:scale-[0.98]
    `;
    
    const variantStyles = {
      primary: `
        bg-primary text-primary-foreground 
        hover:bg-primary/90 
        focus:ring-primary
        shadow-sm hover:shadow-md
      `,
      secondary: `
        bg-secondary text-secondary-foreground 
        hover:bg-secondary/80 
        focus:ring-secondary
        border border-border
      `,
      destructive: `
        bg-destructive text-destructive-foreground 
        hover:bg-destructive/90 
        focus:ring-destructive
        shadow-sm hover:shadow-md
      `,
      outline: `
        border border-border bg-background text-foreground
        hover:bg-muted hover:border-primary/50
        focus:ring-primary
      `,
      ghost: `
        text-muted-foreground
        hover:bg-muted hover:text-foreground
        focus:ring-primary
      `,
    };

    const sizeStyles = {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3 text-xs",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        type="button"
        ref={ref}
        className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className || ''}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';