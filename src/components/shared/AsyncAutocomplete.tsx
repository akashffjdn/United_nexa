/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncPaginate } from 'react-select-async-paginate';
import { components, type DropdownIndicatorProps, type StylesConfig, type MultiValue, type SingleValue, type GroupBase } from 'react-select';
import { ChevronDown, X } from 'lucide-react';

// Define the shape of an Option
export interface OptionType {
  value: string;
  label: string;
  [key: string]: any; // Allows carrying extra data like 'gst', 'address', etc.
}

interface AsyncAutocompleteProps {
  label?: string;
  placeholder?: string;
  
  // 🟢 FIX: Allow value to be a single object OR an array (for isMulti)
  value: OptionType | null | MultiValue<OptionType>; 
  
  // 🟢 FIX: Update onChange to accept Single or Multi value types
  onChange: (value: SingleValue<OptionType> | MultiValue<OptionType>) => void;
  
  // The async function to fetch data. 
  loadOptions: (search: string, loadedOptions: any, { page }: any) => Promise<any>;
  
  isDisabled?: boolean;
  required?: boolean;
  isMulti?: boolean;
  
  // If true, loads the first page of options immediately on mount
  defaultOptions?: boolean; 
  
  // Prop to hide the visual red asterisk if the field is valid
  hideRequiredIndicator?: boolean;
  className?: string;
}

// Custom Dropdown Arrow using Lucide Icon
// 🟢 FIX: Updated generic to 'boolean' to match the component's flexible state
const DropdownIndicator = (props: DropdownIndicatorProps<OptionType, boolean>) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDown size={16} className="text-muted-foreground opacity-50" />
    </components.DropdownIndicator>
  );
};

// Custom Clear Button using Lucide Icon
const ClearIndicator = (props: any) => {
  return (
    <components.ClearIndicator {...props}>
      <X size={16} className="text-muted-foreground hover:text-foreground cursor-pointer" />
    </components.ClearIndicator>
  );
};

export const AsyncAutocomplete = ({
  label,
  placeholder = "Select...",
  value,
  onChange,
  loadOptions,
  isDisabled,
  required,
  defaultOptions = true,
  hideRequiredIndicator,
  className,
  isMulti = false, // Default to false
}: AsyncAutocompleteProps) => {

  const showAsterisk = required && !hideRequiredIndicator;

  // --- Custom Styles to Match Your Tailwind Theme ---
  // 🟢 FIX: Changed second generic from 'false' to 'boolean' to allow isMulti
  const customStyles: StylesConfig<OptionType, boolean, GroupBase<OptionType>> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'hsl(var(--background))',
      // Matches your Input component border style
      borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border) / 0.3)', 
      color: 'hsl(var(--foreground))',
      borderRadius: 'calc(var(--radius) - 2px)', 
      padding: '1px', 
      boxShadow: state.isFocused ? '0 0 0 2px hsl(var(--primary) / 0.2)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border) / 0.5)',
      },
      minHeight: '38px', 
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border) / 0.3)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      zIndex: 9999, // Ensure it floats above other UI elements
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused 
        ? 'hsl(var(--muted))' 
        : state.isSelected 
          ? 'hsl(var(--primary) / 0.1)' 
          : 'transparent',
      color: state.isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
      cursor: 'pointer',
      fontSize: '0.875rem', // text-sm
      '&:active': {
        backgroundColor: 'hsl(var(--primary) / 0.2)',
      }
    }),
    input: (provided) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
      fontSize: '0.875rem',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
      fontSize: '0.875rem',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'hsl(var(--muted))',
      borderRadius: '4px',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
      ':hover': {
        backgroundColor: 'hsl(var(--destructive) / 0.1)',
        color: 'hsl(var(--destructive))',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
      fontSize: '0.875rem',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          {label} {showAsterisk && <span className="text-destructive">*</span>}
        </label>
      )}
      <AsyncPaginate
        value={value}
        loadOptions={loadOptions}
        onChange={onChange}
        isDisabled={isDisabled}
        isClearable={!isDisabled} // Allow clearing the value
        isMulti={isMulti} // 🟢 Pass isMulti prop
        placeholder={placeholder}
        defaultOptions={defaultOptions}
        additional={{ page: 1 }} // Start pagination at page 1
        styles={customStyles}
        components={{ DropdownIndicator, ClearIndicator }}
        debounceTimeout={400} // Wait 400ms after typing before searching (Performance)
        classNamePrefix="react-select"
      />
    </div>
  );
};