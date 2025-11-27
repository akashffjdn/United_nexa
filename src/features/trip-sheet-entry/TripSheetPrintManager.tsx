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
          /* Force mobile browsers to render the print media query */
          @media print {
            
            /* 🛑 CRITICAL MOBILE FIX: Explicitly hide the HTML and BODY children */
            html > body {
                display: block !important;
                visibility: visible !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            /* 🛑 AGGRESSIVE MOBILE FIX: Hides the main app container */
            #root, 
            html > body > #root, 
            html, 
            body {
              display: none !important;
              visibility: hidden !important;
              width: 0 !important;
              height: 0 !important;
            }
            
            /* Target all top-level children of the body, except our print wrapper */
            body > *:not(.ts-print-wrapper) {
              display: none !important;
              visibility: hidden !important;
            }

            /* Ensure the print wrapper itself is visible and takes up space */
            .ts-print-wrapper {
              display: block !important;
              visibility: visible !important;
              position: absolute !important; 
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              min-height: 100% !important;
              z-index: 9999 !important;
              padding: 0;
              margin: 0;
            }
          }
        `}
      </style>

      {printPages}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
