import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from './Button';

// Simple Popover implementation
const Popover = ({ open, onOpenChange, trigger, children }: { open: boolean, onOpenChange: (open: boolean) => void, trigger: React.ReactNode, children: React.ReactNode }) => {
  return (
    <div className="relative w-full">
      <div onClick={() => onOpenChange(!open)}>{trigger}</div>
      {open && (
        <div 
          className="absolute z-10 top-full mt-1 w-full bg-background border border-muted-foreground/30 rounded-md shadow-lg"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          {children}
        </div>
      )}
    </div>
  );
};

// Simple Command-like list implementation
const CommandList = ({ children }: { children: React.ReactNode }) => (
  <div className="max-h-60 overflow-y-auto">{children}</div>
);
const CommandItem = ({ onSelect, children, isSelected }: { onSelect: () => void, children: React.ReactNode, isSelected: boolean }) => (
  <div
    onClick={onSelect}
    className={`flex items-center justify-between p-2 text-sm cursor-pointer hover:bg-muted ${isSelected ? 'font-medium' : ''}`}
  >
    <div className="flex items-center">
      <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50'}`}>
        {isSelected && <Check size={12} />}
      </div>
      {children}
    </div>
  </div>
);
const CommandEmpty = ({ children }: { children: React.ReactNode }) => (
  <div className="p-2 text-sm text-center text-muted-foreground">{children}</div>
);
const CommandInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => (
    <div className="p-2 border-b border-muted">
      <input
        {...props}
        ref={ref}
        className="w-full px-3 py-2 text-sm border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
      />
    </div>
  )
);

// --- Main MultiSelect Component ---
interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyPlaceholder: string;
}

export const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyPlaceholder,
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // --- THIS IS THE FIX ---
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Auto-focus the search input when the popover opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // Small delay to ensure it's rendered
    } else {
      setSearch(''); // Clear search on close
    }
  }, [open]);
  // --- END FIX ---

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );
  
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };
  
  const selectedLabels = options
    .filter(option => selected.includes(option.value))
    .map(option => option.label);

  return (
    <Popover 
      open={open} 
      onOpenChange={setOpen}
      trigger={
        <Button
          type="button"
          variant="secondary"
          className="w-full h-auto min-h-[42px] justify-between font-normal bg-background border border-muted-foreground/30 text-muted-foreground hover:bg-muted"
        >
          <div className="flex flex-wrap gap-1 flex-1 items-center">
            {selectedLabels.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedLabels.map(label => (
                <span key={label} className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md text-xs font-medium text-foreground">
                  {label}
                  <X 
                    size={12} 
                    className="cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent opening/closing popover
                      const valueToUnselect = options.find(o => o.label === label)?.value;
                      if (valueToUnselect) handleToggle(valueToUnselect);
                    }} 
                  />
                </span>
              ))
            )}
          </div>
          <ChevronsUpDown size={16} className="ml-2 opacity-50 flex-shrink-0" />
        </Button>
      }
    >
      {/* Popover Content (as children) */}
      <CommandInput
        ref={inputRef} // <-- Assign the ref
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <CommandList>
        {filteredOptions.length === 0 ? (
          <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
        ) : (
          filteredOptions.map(option => (
            <CommandItem
              key={option.value}
              onSelect={() => {
                handleToggle(option.value);
                // We can keep the popover open for multi-selection
                // setOpen(false); 
              }}
              isSelected={selected.includes(option.value)}
            >
              {option.label}
            </CommandItem>
          ))
        )}
      </CommandList>
    </Popover>
  );
};