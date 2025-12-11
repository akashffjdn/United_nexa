import { Circle, CheckCircle2 } from 'lucide-react';

interface RadioGroupProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const RadioGroup = ({ label, options, value, onChange, required }: RadioGroupProps) => {
  return (
    <div className="w-full">
      {/* Label */}
      <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-2.5">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>

      {/* Radio Options Container */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {options.map(option => {
          const isSelected = value === option.value;
          
          return (
            <label
              key={option.value}
              className={`
                relative flex items-center gap-2 sm:gap-2.5 
                px-3 sm:px-4 py-2 sm:py-2.5 
                rounded-lg sm:rounded-xl 
                border-2 cursor-pointer 
                transition-all duration-200 
                select-none
                ${isSelected 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
                }
              `}
            >
              {/* Hidden native radio input */}
              <input
                id={option.value}
                name={label}
                type="radio"
                value={option.value}
                checked={isSelected}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
                required={required}
              />

              {/* Custom radio indicator */}
              <div className={`
                flex items-center justify-center shrink-0
                w-4 h-4 sm:w-5 sm:h-5 
                rounded-full 
                transition-all duration-200
                ${isSelected 
                  ? 'text-primary' 
                  : 'text-muted-foreground/40'
                }
              `}>
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Circle className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>

              {/* Option label */}
              <span className={`
                text-xs sm:text-sm font-medium 
                transition-colors duration-200
                ${isSelected ? 'text-foreground' : 'text-muted-foreground'}
              `}>
                {option.label}
              </span>

              {/* Selection indicator dot */}
              {isSelected && (
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-in fade-in zoom-in duration-200" />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
};