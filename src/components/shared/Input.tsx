import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    /** Flag to hide the visual required indicator (e.g., red asterisk). */
    hideRequiredIndicator?: boolean; 
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    id, 
    type = 'text', 
    required, 
    hideRequiredIndicator, 
    className,
    ...props 
  }, ref) => {
    
    const showAsterisk = required && !hideRequiredIndicator;

    return (
      <div className="w-full">
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          {label}
          {showAsterisk && <span className="text-destructive ml-1">*</span>}
        </label>
        <input
          id={id}
          type={type}
          ref={ref}
          required={required} 
          {...props}
          className={`
            w-full h-11 px-4 
            bg-background text-foreground 
            border border-border rounded-xl
            text-sm font-medium
            placeholder:text-muted-foreground/60
            transition-all duration-200
            hover:border-primary/50
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/50
            ${className || ''}
          `}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';