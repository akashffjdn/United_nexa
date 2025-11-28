import { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

// Helper to detect mobile devices (screens smaller than 768px) - Retained for the print delay adjustment
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

  // -------------------------------------------------------------------
  // 💡 NEW LOGIC: Rely ONLY on CSS Overlay, use JS only for timing/cleanup
  // -------------------------------------------------------------------
  useEffect(() => {
    if (mfNos.length === 0) return;

    const printWrapper = printRef.current;
    if (!printWrapper) {
      console.error("Print wrapper not found");
      return;
    }

    const isMobile = isMobileScreen();
    let printTimeout: number | undefined;

    // Define a single cleanup function
    const cleanupHandler = () => {
        // Use a slight delay to ensure cleanup runs *after* the print dialog closes
        setTimeout(() => {
            window.removeEventListener("afterprint", cleanupHandler);
            // OnClose is the only cleanup needed here, as the CSS handles hiding/showing.
            onClose();
        }, 500);
    };

    // 1. Listen for the end of the print job/dialog closure
    window.addEventListener("afterprint", cleanupHandler);

    // 2. Trigger Print. Use a longer delay for mobile for maximum DOM readiness.
    const delay = isMobile ? 750 : 350;

    printTimeout = setTimeout(() => {
        // Force the print dialog
        window.print();
    }, delay); 

    // 3. Cleanup on unmount
    return () => {
        window.removeEventListener("afterprint", cleanupHandler);
        if (printTimeout) clearTimeout(printTimeout);
    };

  }, [onClose, mfNos.length]);

  const printContent = (
    // We are deliberately NOT using an inline style here.
    // CSS @media screen will keep it hidden.
    <div className="ts-print-wrapper" ref={printRef}> 
      <style>{`
        @media print {
          /* --------------------------------------------------- */
          /* CRITICAL FIX: AGGRESSIVE HIDE & OVERLAY             */
          /* --------------------------------------------------- */

          /* HIDE EVERYTHING (including #root) via CSS */
          #root, 
          body > *:not(.ts-print-wrapper) {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            position: fixed !important; 
            top: -9999px !important;
          }

          /* FORCE SHOW & OVERLAY our wrapper using fixed position */
          .ts-print-wrapper {
            display: block !important;
            visibility: visible !important;
            
            /* Use fixed positioning to force it over any default rendering */
            position: fixed !important; 
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            
            width: auto !important; /* Let content dictate width within margins */
            height: auto !important; /* Let content dictate height */
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            z-index: 999999 !important;
            
            /* Ensure text is black for PDF generation */
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* The print pages themselves need to revert to static/flow inside the fixed wrapper */
          .print-page {
            position: static !important; 
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          /* --------------------------------------------------- */
          /* PAGE & BACKGROUND STYLES                           */
          /* --------------------------------------------------- */

          @page {
            size: A4;
            margin: 12mm; /* Match your desired print margin */
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
