import { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

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
    const afterPrint = () => {
      onClose();
      window.removeEventListener("afterprint", afterPrint);
    };

    window.addEventListener("afterprint", afterPrint);

    // delay ensures print DOM is mounted before window.print() is called
    setTimeout(() => {
      window.print();
    }, 350);

    return () => window.removeEventListener("afterprint", afterPrint);
  }, [onClose]);

  const printContent = (
    <div className="ts-print-wrapper" ref={printRef}>
      <style>
  {`
    /* ------------------------------------------------ */
    /* UNIVERSAL PRINT RESET AND CONTAINER HIDING LOGIC */
    /* ------------------------------------------------ */
    @media print {
      
      /* 🛑 FIX 1: HIDE EVERYTHING EXCEPT THE PRINT WRAPPER */
      /* This targets the main app container (#root) and all its siblings.
         This is generally the cleanest way to hide the entire app view. */
      #root, 
      body > *:not(.ts-print-wrapper) {
         display: none !important;
         visibility: hidden !important;
         opacity: 0 !important;
         /* Optional aggressive size reset for mobile */
         width: 0 !important;
         height: 0 !important;
         position: fixed !important; 
         top: -9999px !important;
      }

      /* 🛑 FIX 2: ENSURE THE PRINT WRAPPER IS VISIBLE AND DOMINANT */
      /* We explicitly make the wrapper visible and ensure it takes up the print area. */
      .ts-print-wrapper {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        
        /* Reset positioning for print context */
        position: static !important;
        top: auto !important;
        left: auto !important;

        /* Maximize print area usage */
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      /* 🛑 FIX 3: MOBILE SPECIFIC HIDING (Just in case the other rules fail) */
      /* Hiding the top-level <body> element when it's not the print wrapper */
      /* This is a common workaround for mobile print engines ignoring the #root hide */
      body {
        display: block !important; /* Must be block so children can be flexed/positioned */
        visibility: visible !important;
        overflow: visible !important;
        
        /* Hide all BODY's direct children first */
        & > * {
          display: none !important;
        }
        
        /* Then explicitly show the print wrapper if it is a direct body child */
        & > .ts-print-wrapper {
          display: block !important;
        }
      }
    }
  `}
</style>

      {printPages}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
