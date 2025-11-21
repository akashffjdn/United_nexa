import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from './Input';
import { X } from 'lucide-react';

interface AutocompleteInputProps {
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  value: string; // This is the selected ID (e.g., consignorId) or Value
  onSelect: (value: string) => void; // Callback with the selected ID/Value
  required?: boolean;
  readOnly?: boolean; // Added
  disabled?: boolean; // Added
}

export const AutocompleteInput = ({
  label,
  placeholder,
  options,
  value,
  onSelect,
  required,
  readOnly,
  disabled,
}: AutocompleteInputProps) => {
  // Find the label matching the current value, or start with empty or the value itself if not found (for free text)
  const initialLabel = options.find(opt => opt.value === value)?.label || value || '';
  const [inputValue, setInputValue] = useState(initialLabel);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on what the user is typing
  const filteredOptions = useMemo(() => {
    if (!inputValue) {
      return options; // Show all options if input is empty
    }
    return options.filter(opt =>
      opt.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue, options]);

  // Handle clicking outside to close the suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        
        // Logic change: If readOnly, we usually don't want user typing anyway. 
        // If user types something that matches an option, sync it. 
        // If perfectly matched, keep it.
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);
  
  // When the 'value' prop changes (e.g., in edit mode), update the input text
  useEffect(() => {
    const match = options.find(opt => opt.value === value);
    setInputValue(match ? match.label : value);
  }, [value, options]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || disabled) return;
    setInputValue(e.target.value);
    // If allowing free text or searching, you might want to call onSelect(e.target.value) here too 
    // or wait for selection. For now, we update local state to filter suggestions.
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (option: { value: string; label: string }) => {
    setInputValue(option.label); // Set display text
    onSelect(option.value);     // Send the ID back
    setShowSuggestions(false);
  };
  
  const handleClear = () => {
    if (readOnly || disabled) return;
    setInputValue('');
    onSelect('');
    setShowSuggestions(true);
  };

  const canInteract = !readOnly && !disabled;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Input
        label={label}
        id={label}
        name={label}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => canInteract && setShowSuggestions(true)}
        required={required && !value}
        autoComplete="off"
        readOnly={readOnly}
        disabled={disabled}
      />
      {inputValue && canInteract && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-[2.1rem] text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
      )}

      {showSuggestions && canInteract && (
        <div className="absolute z-20 w-full mt-1 bg-background border border-muted-foreground/30 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div
                key={option.value}
                onClick={() => handleSuggestionClick(option)}
                className="p-3 text-sm cursor-pointer hover:bg-muted"
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-center text-muted-foreground">
              No results found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};