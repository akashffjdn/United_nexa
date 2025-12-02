
import React from 'react';

// 1. UPDATE INTERFACE to include the new prop
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    /** Flag to hide the visual required indicator (e.g., red asterisk). */
    hideRequiredIndicator?: boolean; 
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  // 2. DESTRUCTURE the new prop in the component function signature
  ({ 
    label, 
    id, 
    type = 'text', 
    required, 
    hideRequiredIndicator, 
    ...props 
  }, ref) => {
    
    // 3. DEFINE THE CONDITION for showing the asterisk
    const showAsterisk = required && !hideRequiredIndicator;

    return (
      <div>
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-muted-foreground"
        >
          {label} 
          {/* 4. APPLY THE NEW CONDITION to the asterisk rendering */}
          {showAsterisk && <span className="text-destructive ml-1">*</span>}
        </label>
        <div className="mt-1">
          <input
            id={id}
            type={type}
            ref={ref}
            // Keep the required attribute for HTML/Browser validation, 
            // the parent component already controls this based on the value.
            required={required} 
            {...props}
            className="w-full px-3 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
    );
  }
);
