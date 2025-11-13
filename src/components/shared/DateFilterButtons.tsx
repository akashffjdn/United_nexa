import React from 'react';
import { Input } from './Input';
import { getTodayDate, getYesterdayDate, isDateInLast7Days } from '../../utils/dateHelpers';

interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

const FilterButton: React.FC<FilterButtonProps> = ({ active, children, ...props }) => {
  const baseStyle = "px-3 py-1.5 text-sm font-medium rounded-md";
  const activeStyle = "bg-primary text-primary-foreground";
  const inactiveStyle = "bg-muted text-muted-foreground hover:bg-muted-foreground/20";
  
  return (
    <button
      className={`${baseStyle} ${active ? activeStyle : inactiveStyle}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface DateFilterButtonsProps {
  filterType: string;
  setFilterType: (type: string) => void;
  customStart: string;
  setCustomStart: (date: string) => void;
  customEnd: string;
  setCustomEnd: (date: string) => void;
}

export const DateFilterButtons = ({
  filterType,
  setFilterType,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd
}: DateFilterButtonsProps) => {

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterButton active={filterType === 'all'} onClick={() => setFilterType('all')}>All</FilterButton>
        <FilterButton active={filterType === 'today'} onClick={() => setFilterType('today')}>Today</FilterButton>
        <FilterButton active={filterType === 'yesterday'} onClick={() => setFilterType('yesterday')}>Yesterday</FilterButton>
        <FilterButton active={filterType === 'week'} onClick={() => setFilterType('week')}>Last 7 Days</FilterButton>
        <FilterButton active={filterType === 'custom'} onClick={() => setFilterType('custom')}>Custom Range</FilterButton>
      </div>
      
      {filterType === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-dashed border-muted-foreground/30 rounded-md">
          <Input 
            label="Start Date" 
            id="customStart" 
            name="customStart" 
            type="date" 
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
          />
          <Input 
            label="End Date" 
            id="customEnd" 
            name="customEnd" 
            type="date" 
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

// Re-exporting date helpers for any components that still import from here
export { getTodayDate, getYesterdayDate, isDateInLast7Days };