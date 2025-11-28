import { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

// Utility function to check if the screen is likely mobile size
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
    const isMobile = isMobileScreen();

    if (!rootElement || !printWrapper) {
      console.error("Print elements (root or wrapper) not found.");
      return;
    }

    // --- SETUP: Store original styles ---
    const originalRootDisplay = rootElement.style.display;
    const originalWrapperDisplay = printWrapper.style.display;

    // 1. Define the universal cleanup function
    const cleanupStyles = () => {
      rootElement.style.display = originalRootDisplay;
      printWrapper.style.display = originalWrapperDisplay;
      onClose();
      window.removeEventListener("afterprint", afterPrint);
    };
    
    // 2. Define afterprint listener (for mobile reliance)
    const afterPrint = () => {
      setTimeout(cleanupStyles, 500); 
    };

    // --- 🛑 MOBILE PRINT SEQUENCE (Reliability First) ---
    const printForMobile = () => {
        // Force hide main UI and show print wrapper
        rootElement.style.display = "none";
        printWrapper.style.display = "block";

        // Rely on afterprint for cleanup
        window.addEventListener("afterprint", afterPrint);

        // Trigger print
        setTimeout(() => {
            window.print();
        }, 350);
    };

    // --- ✅ DESKTOP PRINT SEQUENCE (Aesthetics First) ---
    const printForDesktop = () => {
        // 1. Force hide main UI (momentarily) and show print wrapper
        rootElement.style.display = "none";
        printWrapper.style.display = "block";

        // 2. Trigger print
        const printTimeout = setTimeout(() => {
            window.print();

            // 3. 🔥 INSTANT RESTORE: Restore main UI immediately to show background
            rootElement.style.display = originalRootDisplay;
            
            // Note: Cleanup (onClose) relies on the component unmount or the return function.
        }, 350);
        return printTimeout;
    };
    
    let printTimeout: number | undefined;

    // --- EXECUTE BASED ON DEVICE ---
    if (isMobile) {
        printForMobile();
    } else {
        printTimeout = printForDesktop();
    }

    // --- CLEANUP ---
    return () => {
      window.removeEventListener("afterprint", afterPrint);
      if (printTimeout) {
        clearTimeout(printTimeout);
      }
      // Ensure styles are reverted if component unmounts
      cleanupStyles(); 
    };
  }, [onClose]);

  const printContent = (
    // Set display to none initially, let JS control its visibility
    <div className="ts-print-wrapper" ref={printRef} style={{ display: 'none' }}>
      <style>
        {`
            /* ------------------------------------------------ */
            /* Universal Print Styles (Black Text & White BG) */
            /* ------------------------------------------------ */
            @page {
                size: A4;
                margin: 0;
            }
            
            html, body {
                background-color: #fff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

          /* ------------------------------------------------ */
          /* CONTAINER HIDING LOGIC (Media Print) */
          /* ------------------------------------------------ */
          @media print {
                /* FORCE BLACK TEXT AND WHITE BACKGROUND FOR PRINT CONTENT */
                .ts-print-wrapper, .ts-print-wrapper * {
                    color: black !important;
                    background-color: white !important;
                }
            
            /* HIDE EVERYTHING EXCEPT THE PRINT WRAPPER */
            #root, 
            body > *:not(.ts-print-wrapper) {
              display: none !important;
              visibility: hidden !important;
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
