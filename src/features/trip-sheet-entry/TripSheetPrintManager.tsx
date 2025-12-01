import { useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";
import { X, Printer } from 'lucide-react';

interface TripSheetPrintManagerProps {
  sheets: TripSheetEntry[];
  onClose: () => void;
}

export const TripSheetPrintManager = ({ sheets, onClose }: TripSheetPrintManagerProps) => {
  const printTriggered = useRef(false);

  // Memoize the rendered pages
  const printPages = useMemo(() => {
    return sheets.map((sheet) => (
      <div className="print-page" key={sheet.mfNo}>
        <TripSheetPrintCopy sheet={sheet} />
      </div>
    ));
  }, [sheets]);

  // --- PRINT LOGIC ---
  useEffect(() => {
    if (sheets.length === 0) return;
    if (printTriggered.current) return;
    
    const handleAfterPrint = () => {
      onClose();
      // Only remove listener after successful print to prevent memory leaks
      window.removeEventListener("afterprint", handleAfterPrint);
    };

    window.addEventListener("afterprint", handleAfterPrint);

    // Auto-trigger print after 1s delay
    const timer = setTimeout(() => {
      printTriggered.current = true;
      window.print();
    }, 1000); 

    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [sheets.length, onClose]);

  const handleManualPrint = () => {
    // Manually trigger print if needed
    window.print();
  };

  if (sheets.length === 0) return null;

  const printContent = (
    <div className="ts-print-wrapper">
      <style>{`
        
        /* =========================================
           1. PRINT STYLES (The Output Paper)
           ========================================= */
        @media print {
          /* Page setup */
          @page {
            size: A4;
            margin: 0; 
          }

          /* Hide everything outside the wrapper */
          body > *:not(.ts-print-wrapper) {
            display: none !important;
            visibility: hidden !important;
          }
          #root { display: none !important; }

          /* Wrapper takes over the whole document */
          .ts-print-wrapper {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            top: 0; left: 0; width: 100%;
            margin: 0; padding: 0;
            background: white;
            z-index: 9999;
          }

          /* Page breaking and sizing */
          .print-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            width: 210mm;
            /* Use exact A4 height for page control */
            min-height: 297mm; 
          }

          /* Hide Toolbar in Print */
          .print-actions { display: none !important; }
        }

        /* =========================================
           2. SCREEN STYLES (The Preview Overlay)
           ========================================= */
        @media screen {
          .ts-print-wrapper {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100vw;
            height: 100dvh; 
            
            /* Theme-aware background color (using placeholders for common theme variables) */
            background-color: hsl(var(--muted, 210 40% 96.1%)); 
            z-index: 2147483647; 
            overflow-y: auto;
            overflow-x: hidden;
            
            /* Layout for centering pages */
            padding-top: 80px; /* Space for fixed header */
            padding-bottom: 40px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          /* Desktop Page Preview Style */
          .print-page {
            background: white;
            color: black; 
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            margin-bottom: 24px;
            transform-origin: top center;
            width: 210mm; /* Fixed A4 width */
            min-height: 297mm;
          }
        }

        /* =========================================
           3. MOBILE RESPONSIVENESS (Scaling)
           ========================================= */
        @media screen and (max-width: 800px) {
          .ts-print-wrapper {
            padding-top: 70px;
            padding-left: 0;
            padding-right: 0;
            /* Darker background on mobile for contrast */
            background-color: #1f2937; 
          }

          .print-page {
            /* Scale A4 down for mobile screens (e.g., 46% for a small phone) */
            transform: scale(0.46); 
            /* Pull up the whitespace created by scaling */
            margin-bottom: -135mm; 
            margin-top: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          }
        }

        @media screen and (min-width: 450px) and (max-width: 800px) {
           /* Tablets/Larger phones */
           .print-page {
             transform: scale(0.65);
             margin-bottom: -90mm;
           }
        }

        /* =========================================
           4. TOOLBAR STYLES (Themed)
           ========================================= */
        .print-actions {
          position: fixed;
          top: 0; left: 0;
          width: 100%;
          height: 64px;
          
          /* Theme variables for colors */
          background-color: hsl(var(--card, 0 0% 100%));
          color: hsl(var(--foreground, 222.2 47.4% 11.2%));
          border-bottom: 1px solid hsl(var(--border, 214.3 31.8% 91.4%));
          
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          z-index: 2147483648;
        }

        .preview-title {
          font-weight: 700;
          font-size: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .action-group {
          display: flex;
          gap: 10px;
        }

        .btn-base {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        /* Themed Primary Button */
        .print-btn {
          background-color: hsl(var(--primary, 221.2 83.2% 53.3%));
          color: hsl(var(--primary-foreground, 210 20% 98%));
        }
        .print-btn:active { transform: scale(0.96); }
        .print-btn:hover { opacity: 0.9; }

        /* Themed Destructive Button */
        .close-btn {
          background-color: hsl(var(--destructive, 0 84.2% 60.2%));
          color: hsl(var(--destructive-foreground, 210 20% 98%));
        }
        .close-btn:active { transform: scale(0.96); }
        .close-btn:hover { opacity: 0.9; }

        /* Small screen adjustments for toolbar */
        @media screen and (max-width: 480px) {
          .preview-title { font-size: 14px; max-width: 120px; }
          .btn-base { padding: 6px 12px; font-size: 13px; }
          .action-group { gap: 8px; }
        }
      `}</style>

      {/* HEADER TOOLBAR (Visible only on screen) */}
      <div className="print-actions">
        <span className="preview-title">
          Print Preview ({sheets.length} Sheets)
        </span>
        <div className="action-group">
          <button onClick={handleManualPrint} className="btn-base print-btn">
            <Printer size={18} />
            <span>Print</span>
          </button>
          <button onClick={onClose} className="btn-base close-btn">
            <X size={18} />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT PAGES (Scrollable on screen, page-breakable on print) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {printPages}
      </div>
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
