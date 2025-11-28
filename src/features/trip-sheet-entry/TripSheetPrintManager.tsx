import { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

// Helper to detect mobile devices (screens smaller than 768px)
const isMobileScreen = () => window.innerWidth < 768;


export const TripSheetPrintManager = ({
  mfNos,
  onClose,
}: TripSheetPrintManagerProps) => {
  const { getTripSheet } = useData();
  const printRef = useRef<HTMLDivElement>(null);

  const printPages = useMemo(() => {
    const sheets: TripSheetEntry[] = mfNos
      .map((id) => getTripSheet(id))
      .filter(Boolean) as TripSheetEntry[];

    return sheets.map((sheet) => (
      <div className="print-page" key={sheet.mfNo}>
        <TripSheetPrintCopy sheet={sheet} />
      </div>
    ));
  }, [mfNos, getTripSheet]);

  useEffect(() => {
    // Exit if no jobs or elements are missing
    if (mfNos.length === 0) return;

    const rootElement = document.getElementById("root");
    const printWrapper = printRef.current;

    if (!rootElement || !printWrapper) {
      console.error("Print elements not found");
      return;
    }

    const isMobile = isMobileScreen();
    let printTimeout: number | undefined;

    // Store original styles outside the branches
    const originalRootDisplay = rootElement.style.display;
    const originalWrapperDisplay = printWrapper.style.display;
    
    // Define a single universal cleanup function that restores styles
    const cleanupHandler = () => {
        // Use a timeout to ensure cleanup runs *after* the print dialog closes
        setTimeout(() => {
            // Restore original styles (using the captured original values)
            rootElement.style.display = originalRootDisplay;
            printWrapper.style.display = originalWrapperDisplay;
            // Clean up the event listener
            window.removeEventListener("afterprint", cleanupHandler);
            onClose();
        }, 500);
    };

    // ---------------------------------------------------------
    // 📱 MOBILE LOGIC: Aggressive JS Force Fix
    // ---------------------------------------------------------
    if (isMobile) {
      // 1. Listen for when print dialog closes (the single universal handler)
      window.addEventListener("afterprint", cleanupHandler);

      // 2. FORCE DOM MANIPULATION (CRITICAL MOBILE FIX)
      // Hide the main UI and show the print wrapper
      rootElement.style.setProperty('display', 'none', 'important'); 
      printWrapper.style.setProperty('display', 'block', 'important');

      // 3. Trigger Print (increased delay for mobile rendering)
      printTimeout = setTimeout(() => {
        window.print();
      }, 750); 
    } 
    
    // ---------------------------------------------------------
    // 🖥️ DESKTOP LOGIC: CSS ONLY
    // ---------------------------------------------------------
    else {
      // 1. Listen for cleanup (the single universal handler)
      window.addEventListener("afterprint", cleanupHandler);

      // 2. Trigger Print 
      printTimeout = setTimeout(() => {
        window.print();
      }, 350);
    }

    // Cleanup on unmount (safety net)
    return () => {
        // Remove the listener
        window.removeEventListener("afterprint", cleanupHandler);
        // Clear the print trigger timeout
        if (printTimeout) clearTimeout(printTimeout);
        
        // If the component unmounts while the mobile fix is active, revert styles immediately.
        if (isMobile && rootElement.style.getPropertyValue('display') === 'none') {
            rootElement.style.removeProperty('display');
            printWrapper.style.removeProperty('display');
        }
    };

  }, [onClose, mfNos.length]);

  const printContent = (
    // The print wrapper does not need an inline style, as it's hidden by CSS @media screen
    <div className="ts-print-wrapper" ref={printRef}> 
      <style>{`
        @media print {
          /* --------------------------------------------------- */
          /* AGGRESSIVE HIDING: Ensures the print wrapper is the only thing visible */
          /* This covers both desktop (via CSS) and acts as a safety net for mobile (already hidden by JS) */
          /* --------------------------------------------------- */

          #root, 
          body > *:not(.ts-print-wrapper) {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            position: fixed !important; 
            top: -9999px !important;
            background-color: white !important;
          }

          /* Force show our wrapper (the print content) */
          .ts-print-wrapper {
            display: block !important;
            visibility: visible !important;
            position: absolute !important; 
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            z-index: 999999 !important;
            
            /* Ensure text is black for PDF generation */
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* --------------------------------------------------- */
          /* SHARED STYLES                                       */
          /* --------------------------------------------------- */
          .print-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
          
          html, body {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        
        /* --------------------------------------------------- */
        /* SCREEN STYLES (Hides the print content when not printing) */
        /* --------------------------------------------------- */
        @media screen {
            .ts-print-wrapper {
                display: none;
            }
        }
      `}</style>

      {printPages}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
// Removed the placeholder global functions to fix the runtime error.
// The cleanup logic is now correctly defined within the useEffect.
