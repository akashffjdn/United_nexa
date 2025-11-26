// src/features/trip-sheet-entry/TripSheetPrintManager.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

// Detect mobile browser
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export const TripSheetPrintManager = ({
  mfNos,
  onClose,
}: TripSheetPrintManagerProps) => {
  const { getTripSheet } = useData();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // REQUIRED FOR MOBILE PRINTING (cannot use portal)
  const [renderInline, setRenderInline] = useState(isMobile());

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
      setRenderInline(false); // remove inline content after printing
    };

    window.addEventListener("afterprint", afterPrint);

    // small delay so the DOM mounts before printing
    setTimeout(() => window.print(), 300);

    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  // This is the actual print DOM
  const printContent = (
    <div className="ts-print-wrapper" ref={wrapperRef}>
      <style>{`
        @media print {

          /* Hide everything except print wrapper */
          body > *:not(.ts-print-wrapper) {
            display: none !important;
            visibility: hidden !important;
          }

          .ts-print-wrapper {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            z-index: 999999 !important;
          }

          .print-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          @page {
            size: A4;
            margin: 12mm !important;
          }
        }
      `}</style>

      {printPages}
    </div>
  );

  // ---------------------------------------------
  // IMPORTANT:
  // Mobile cannot print portal content.
  // So we mount inline for mobile, portal for desktop.
  // ---------------------------------------------

  if (isMobile()) {
    // INLINE RENDERING FOR MOBILE (REQUIRED)
    return renderInline ? printContent : null;
  }

  // DESKTOP → USE PORTAL
  return ReactDOM.createPortal(printContent, document.body);
};
