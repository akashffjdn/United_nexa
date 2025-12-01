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
  const printRef = useRef<HTMLDivElement>(null); // Ref for the print wrapper

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
    const rootElement = document.getElementById("root");
    const printWrapper = printRef.current;

    if (!rootElement || !printWrapper) {
      console.error("Print elements (root or wrapper) not found.");
      return;
    }

   const isMobile = isMobileScreen();
    let printTimeout: number | undefined;

    // ---------------------------------------------------------
    // 📱 MOBILE LOGIC: Aggressive JS Force Fix
    // ---------------------------------------------------------
    if (isMobile) {
      // 1. Save original styles
      const originalRootDisplay = rootElement.style.display;
      const originalWrapperDisplay = printWrapper.style.display;

      // 2. Define Cleanup (Restore UI)
      const cleanupMobile = () => {
        // Use setTimeout to ensure cleanup runs *after* the print dialog closes
        setTimeout(() => {
            rootElement.style.display = originalRootDisplay;
            printWrapper.style.display = originalWrapperDisplay;
            window.removeEventListener("afterprint", cleanupMobile);
            onClose();
        }, 500); 
      };

      // 3. Listen for when print dialog closes
      window.addEventListener("afterprint", cleanupMobile);

      // 4. FORCE DOM MANIPULATION
      // We are being more aggressive here with !important to ensure the style applies
      rootElement.style.setProperty('display', 'none', 'important'); 
      printWrapper.style.setProperty('display', 'block', 'important');

      // 5. Trigger Print (increased delay for mobile rendering)
      printTimeout = setTimeout(() => {
        window.print();
      }, 750); // Increased delay for mobile responsiveness
    } 
    
    // ---------------------------------------------------------
    // 🖥️ DESKTOP LOGIC: CSS ONLY
    // ---------------------------------------------------------
    else {
      // 1. Simple Cleanup
      const cleanupDesktop = () => {
        window.removeEventListener("afterprint", cleanupDesktop);
        onClose();
      };

      window.addEventListener("afterprint", cleanupDesktop);

      // 2. Trigger Print 
      printTimeout = setTimeout(() => {
        window.print();
      }, 350);
    }

    // Cleanup on unmount (safety net)
    return () => {
        window.removeEventListener("afterprint", printWrapper.style.display === 'none' ? cleanupMobile : cleanupDesktop);
        if (printTimeout) clearTimeout(printTimeout);
        
        // If the component unmounts while in mobile mode, ensure styles are reverted.
        if (isMobile && rootElement.style.getPropertyValue('display') === 'none') {
            rootElement.style.removeProperty('display');
            printWrapper.style.removeProperty('display');
        }
    };

  }, [onClose]);

  const printContent = (
    // Set display to none initially, let JS control its visibility
    <div className="ts-print-wrapper" ref={printRef} style={{ display: 'none' }}>
      <style>
        {`
          /* ------------------------------------------------ */
          /* UNIVERSAL PRINT RESET AND CONTAINER HIDING LOGIC */
          /* ------------------------------------------------ */
          /* CSS is now mainly a fallback, but still necessary for non-JS print */
          @media print {
            
            /* HIDE EVERYTHING EXCEPT THE PRINT WRAPPER */
            #root, 
            body > *:not(.ts-print-wrapper) {
              display: none !important;
              visibility: hidden !important;
              /* Aggressive resets */
              width: 0 !important;
              height: 0 !important;
              position: fixed !important; 
              top: -9999px !important;
            }

            /* ENSURE THE PRINT WRAPPER IS VISIBLE AND DOMINANT */
            .ts-print-wrapper {
              display: block !important;
              visibility: visible !important;
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* MOBILE SPECIFIC BODY RESET (Fallback) */
            body {
              display: block !important;
              visibility: visible !important;
              overflow: visible !important;
            }
          }
        `}
      </style>
      
      {printPages}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};

function cleanupMobile(this: Window, _ev: Event) {
  throw new Error("Function not implemented.");
}

function cleanupDesktop(this: Window, _ev: Event) {
  throw new Error("Function not implemented.");
}
