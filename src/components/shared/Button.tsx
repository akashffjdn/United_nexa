import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'destructive';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    
    // Define base styles
    const baseStyle = "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    // Define variant styles
    const styles = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary disabled:bg-muted disabled:text-muted-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary disabled:bg-muted disabled:text-muted-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive',
    };

    return (
      <button
        type="button"
        ref={ref}
        className={`${baseStyle} ${styles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);