import React from 'react';

// This allows the component to accept all standard input props
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, type = 'text', required, ...props }, ref) => {
    return (
      <div>
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-muted-foreground"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        <div className="mt-1">
          <input
            id={id}
            type={type}
            ref={ref}
            required={required}
            {...props}
            className="w-full px-3 py-2 border border-muted-foreground/30 rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
    );
  }
);