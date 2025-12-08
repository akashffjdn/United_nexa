import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useDataContext } from "../../contexts/DataContext";
import { GcPrintTemplate } from "./GcPrintTemplate";
import { ClipboardList, FileText, Archive, Truck, Check, RotateCcw, X, ChevronDown } from "lucide-react";
import { LoadingSheetTemplate } from "./LoadingSheetTemplate";
import { StockReportTemplate } from "./StockReportTemplate";
import { TripSheetReportTemplate } from "./TripSheetReportTemplate";
import TripSheetPrintTemplate from "./TripSheetPrintTemplate";
import { ConfirmationDialog } from "../../components/shared/ConfirmationDialog";

// --- Button Component ---
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
    const baseStyle = "flex justify-center items-center rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors duration-200";
    
    const variantStyles = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-400 text-gray-800 hover:bg-gray-500 focus:ring-gray-400 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:ring-gray-500',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      outline: 'border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:focus:ring-blue-400',
      ghost: 'hover:bg-gray-200 text-gray-700 focus:ring-blue-500 dark:hover:bg-gray-700 dark:text-gray-300 dark:focus:ring-blue-400',
    };

    const sizeStyles = {
      default: "h-10 py-2 px-4",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
    };

    return (
      <button
        type="button"
        ref={ref}
        className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
// ------------------------------------

type View = 'GC_ENTRY' | 'LOADING_SHEET' | 'PENDING_STOCK' | 'TRIPSHEET_REPORT' | 'TRIPSHEET_PRINT';

const MainScreen: React.FC = () => {
  const { printSettings, updatePrintSettings } = useDataContext(); 
  const [activeView, setActiveView] = useState<View>('GC_ENTRY');
  const [hasChanges, setHasChanges] = useState(false);

  const saveHandlerRef = useRef<(() => void) | null>(null);
  const resetHandlerRef = useRef<(() => void) | null>(null);
  const undoHandlerRef = useRef<(() => void) | null>(null);

  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

  // Define View Options for Dropdown (Mobile)
  const VIEW_OPTIONS: { value: View; label: string }[] = [
    { value: 'GC_ENTRY', label: 'GC Entry' },
    { value: 'LOADING_SHEET', label: 'Loading Sheet' },
    { value: 'TRIPSHEET_PRINT', label: 'Tripsheet Print' },
    { value: 'TRIPSHEET_REPORT', label: 'Tripsheet Report' },
    { value: 'PENDING_STOCK', label: 'Pending Stock Report' },
  ];

  useEffect(() => {
    setHasChanges(false);
    saveHandlerRef.current = null;
    resetHandlerRef.current = null;
    undoHandlerRef.current = null;
  }, [activeView]);

  const handleTemplateEdit = useCallback((
      changes: boolean,
      save: () => void,
      reset: () => void,
      undo: () => void
  ) => {
      saveHandlerRef.current = save;
      resetHandlerRef.current = reset;
      undoHandlerRef.current = undo;

      setHasChanges((prev) => {
          if (prev !== changes) return changes;
          return prev;
      });
  }, []);

  const handleSaveConfirm = useCallback(() => {
      if (saveHandlerRef.current) {
          saveHandlerRef.current();
      }
      setIsSaveConfirmOpen(false);
  }, []);

  const handleSave = useCallback(() => {
      setIsSaveConfirmOpen(true);
  }, []);

  const handleDiscardConfirm = useCallback(() => {
      if (resetHandlerRef.current) {
          resetHandlerRef.current();
      }
      setIsDiscardConfirmOpen(false);
  }, []);

  const handleReset = useCallback(() => {
      setIsDiscardConfirmOpen(true);
  }, []);

  const handleUndo = useCallback(() => {
      if (undoHandlerRef.current) {
          undoHandlerRef.current();
      }
  }, []);

  const isEditableView = useMemo(() => {
      return activeView === 'LOADING_SHEET' || activeView === 'TRIPSHEET_REPORT' ||  activeView === 'PENDING_STOCK' ||  activeView === 'TRIPSHEET_PRINT' ||  activeView === 'GC_ENTRY';
  }, [activeView]);

  const renderContent = () => {
    switch (activeView) {
      case 'GC_ENTRY':
        return (
            <GcPrintTemplate 
                initialData={printSettings.gc} 
                onSave={(data) => updatePrintSettings({ ...printSettings, gc: data })} 
                onEdit={handleTemplateEdit}
            />
        );
      case 'LOADING_SHEET':
        return (
            <LoadingSheetTemplate 
                initialData={printSettings.loadingSheet}
                onSave={(data) => updatePrintSettings({ ...printSettings, loadingSheet: data })}
                onEdit={handleTemplateEdit} 
            />
        );
      case 'PENDING_STOCK':
        return (
            <StockReportTemplate 
                initialData={printSettings.stockReport}
                onSave={(data) => updatePrintSettings({ ...printSettings, stockReport: data })}
                onEdit={handleTemplateEdit}
            />
        );
      case 'TRIPSHEET_REPORT':
        return (
            <TripSheetReportTemplate 
                initialData={printSettings.tripReport}
                onSave={(data) => updatePrintSettings({ ...printSettings, tripReport: data })}
                onEdit={handleTemplateEdit}
            />
        );
      case 'TRIPSHEET_PRINT':
        return (
            <TripSheetPrintTemplate 
                initialData={printSettings.tripSheet}
                onSave={(data) => updatePrintSettings({ ...printSettings, tripSheet: data })}
                onEdit={handleTemplateEdit}
            />
        );
      default:
        return <div className="dark:text-gray-300">Select a module.</div>;
    }
  };

  const TabButton: React.FC<{ view: View, label: string }> = ({ view, label }) => {
    const buttonVariant = activeView === view ? 'primary' : 'outline';
    const Icon = view === 'GC_ENTRY' ? FileText : (
        view === 'LOADING_SHEET' ? ClipboardList : (
            view === 'PENDING_STOCK' ? Archive : (
                view === 'TRIPSHEET_REPORT' ? FileText : Truck
            )
        )
    );

    return (
      <Button
        variant={buttonVariant}
        onClick={() => setActiveView(view)}
        className="shadow-sm flex gap-1"
      >
        <Icon className="w-4 h-4" />
        {label}
      </Button>
    );
  };

  return (
    <div className="p-2 md:p-4 bg-gray-100 min-h-screen dark:bg-black dark:text-white">
      <header className="mb-4 rounded-lg p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-3">
        
        {/* === MOBILE VIEW: SELECT DROPDOWN === */}
        <div className="w-full md:hidden">
          <div className="relative">
            <select
              value={activeView}
              onChange={(e) => setActiveView(e.target.value as View)}
              className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-foreground py-2.5 px-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
            >
              {VIEW_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* === DESKTOP VIEW: TAB BUTTONS === */}
        <div className="hidden md:flex space-x-2 overflow-x-auto w-auto pb-0 no-scrollbar">
          <TabButton view="GC_ENTRY" label="GC Entry" />
          <TabButton view="LOADING_SHEET" label="Loading Sheet" />
          <TabButton view="TRIPSHEET_PRINT" label="Tripsheet Print" />
          <TabButton view="TRIPSHEET_REPORT" label="Tripsheet Report" />
          <TabButton view="PENDING_STOCK" label="Pending Stock Report" />
        </div>

        {/* === ACTION BUTTONS (Visible on both, stacked on mobile) === */}
        <div className="flex space-x-2 shrink-0 w-full md:w-auto justify-end">
            {isEditableView && (
                <>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSave} 
                        disabled={!hasChanges} 
                        className="flex-1 md:flex-none transition-opacity"
                    >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUndo} 
                        disabled={!hasChanges} 
                        className="flex-1 md:flex-none text-red-600 hover:bg-red-50 transition-opacity dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:border-red-400"
                    >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Undo
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset} 
                        disabled={!hasChanges} 
                        className="flex-1 md:flex-none text-red-600 hover:bg-red-50 transition-opacity dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:border-red-400"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Discard
                    </Button>
                </>
            )}
        </div>

      </header>
      
      <main className="mt-2 md:mt-6 overflow-x-auto">
        <div className="min-w-fit">
            {renderContent()}
        </div>
      </main>

      <ConfirmationDialog
        open={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        onConfirm={handleDiscardConfirm}
        title="Discard All Changes?"
        description="Are you sure you want to discard all your unsaved edits? This action cannot be undone."
        confirmText="Discard Changes"
        ConfirmIcon={X}
      />

      <ConfirmationDialog
        open={isSaveConfirmOpen}
        onClose={() => setIsSaveConfirmOpen(false)}
        onConfirm={handleSaveConfirm}
        title="Save Changes?"
        description="Are you sure you want to save all your changes?"
        confirmText="Save Changes"
        ConfirmIcon={Check}
        theme="primary"
      />

    </div>
  );
};

export default MainScreen;