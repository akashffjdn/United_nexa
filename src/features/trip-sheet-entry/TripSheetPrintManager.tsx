// src/features/trip-sheet-entry/TripSheetPrintManager.tsx

import { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

export const TripSheetPrintManager = ({ mfNos, onClose }: TripSheetPrintManagerProps) => {
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

    setTimeout(() => {
      window.print(); // SAME PRINT BEHAVIOR FOR MOBILE & DESKTOP
    }, 300);

    return () => window.removeEventListener("afterprint", afterPrint);
  }, [onClose]);

  const printContent = (
    <div className="ts-print-wrapper" ref={printRef}>
      <style>{`
        
        @media print {

          body * {
            visibility: hidden !important;
          }

          .ts-print-wrapper, .ts-print-wrapper * {
            visibility: visible !important;
          }

          .ts-print-wrapper {
            display: block !important;
            position: fixed;
            inset: 0;
            margin: 0;
            padding: 0;
            background: white;
            z-index: 9999;
          }

          .print-page {
            page-break-after: always;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>

      {printPages}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
