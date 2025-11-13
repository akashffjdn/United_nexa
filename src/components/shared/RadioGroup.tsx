
interface RadioGroupProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const RadioGroup = ({ label, options, value, onChange, required }: RadioGroupProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="mt-2 flex items-center space-x-6">
        {options.map(option => (
          <div key={option.value} className="flex items-center">
            <input
              id={option.value}
              name={label}
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="h-4 w-4 text-primary border-muted-foreground/30 focus:ring-primary"
              required={required}
            />
            <label htmlFor={option.value} className="ml-2 block text-sm font-medium text-foreground">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};