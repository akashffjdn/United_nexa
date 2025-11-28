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
    const rootElement = document.getElementById("root");
    const printWrapper = printRef.current;

    // Safety check
    if (!rootElement || !printWrapper) {
      console.error("Print elements not found");
      return;
    }

    const isMobile = isMobileScreen();

    // =========================================================
    // 📱 MOBILE LOGIC: JS FORCE FIX
    // =========================================================
    // Problem: Mobile browsers ignore CSS hiding, printing the background app.
    // Solution: Manually set display:none on the app container before printing.
    if (isMobile) {
      // 1. Save original styles
      const originalRootDisplay = rootElement.style.display;
      const originalWrapperDisplay = printWrapper.style.display;

      // 2. Define Cleanup (Restore UI)
      const cleanupMobile = () => {
        rootElement.style.display = originalRootDisplay;
        printWrapper.style.display = originalWrapperDisplay;
        window.removeEventListener("afterprint", cleanupMobile);
        onClose();
      };

      // 3. Listen for when print dialog closes
      window.addEventListener("afterprint", cleanupMobile);

      // 4. FORCE DOM MANIPULATION
      // Hide the main app
      rootElement.style.display = "none";
      // Show the print wrapper
      printWrapper.style.display = "block";

      // 5. Trigger Print (with delay to ensure DOM updates)
      setTimeout(() => {
        window.print();
        // Fallback cleanup in case afterprint misses on specific mobile browsers
        // setTimeout(cleanupMobile, 2000); 
      }, 500);
    } 
    
    // =========================================================
    // 🖥️ DESKTOP LOGIC: CSS ONLY
    // =========================================================
    // Problem: JS Fix makes the background go white, which looks bad on Desktop.
    // Solution: Don't touch DOM. Let CSS @media print hide the background.
    else {
      // 1. Simple Cleanup
      const cleanupDesktop = () => {
        window.removeEventListener("afterprint", cleanupDesktop);
        onClose();
      };

      window.addEventListener("afterprint", cleanupDesktop);

      // 2. Trigger Print directly
      // The CSS in <style> tag will handle showing/hiding content
      setTimeout(() => {
        window.print();
      }, 350);
    }

    // Unmount cleanup
    return () => {
        // We can't strictly reference the specific function here easily due to scope,
        // but since onClose unmounts this component, the logic generally holds safe.
    };

  }, [onClose]);

  const printContent = (
    // Note: display: none is the default state.
    // Mobile JS changes this to 'block'.
    // Desktop CSS overrides this with 'display: block !important'
    <div className="ts-print-wrapper" ref={printRef} style={{ display: 'none' }}>
      <style>{`
        
        @media print {
          /* --------------------------------------------------- */
          /* DESKTOP CSS LOGIC (Standard CSS Hiding)             */
          /* This runs when we DON'T hide #root via JS           */
          /* --------------------------------------------------- */

          /* Hide everything in body that isn't our wrapper */
          body > *:not(.ts-print-wrapper) {
            display: none !important;
            visibility: hidden !important;
          }

          /* Force show our wrapper */
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
          }

          /* --------------------------------------------------- */
          /* SHARED STYLES                                       */
          /* --------------------------------------------------- */
          .print-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
          
          /* Ensure white background */
          html, body {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {printPages}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
