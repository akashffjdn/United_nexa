import { useEffect, useState } from "react";
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
  // CHANGED: Use fetchTripSheetById instead of getTripSheet
  const { fetchTripSheetById } = useData();
  
  const [sheets, setSheets] = useState<TripSheetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data Async
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const promises = mfNos.map((id) => fetchTripSheetById(id));
        const results = await Promise.all(promises);
        // Filter out nulls in case an ID wasn't found
        const validSheets = results.filter((s): s is TripSheetEntry => s !== null);
        setSheets(validSheets);
      } catch (error) {
        console.error("Failed to load trip sheets for printing", error);
      } finally {
        setLoading(false);
      }
    };

    if (mfNos.length > 0) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [mfNos, fetchTripSheetById]);

  // 2. Trigger Print Dialog once data is loaded
  useEffect(() => {
    if (loading || sheets.length === 0) return;

    const handleAfterPrint = () => {
      onClose();
      window.removeEventListener("afterprint", handleAfterPrint);
    };

    window.addEventListener("afterprint", handleAfterPrint);

    // Small delay ensures content renders into the portal before printing
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [loading, sheets, onClose]);

  // Don't render anything until loaded
  if (loading || sheets.length === 0) return null;

  const printContent = (
    <div className="ts-print-wrapper">
      <style>{`
        @media print {
          /* Hide main app UI */
          #root {
            display: none !important;
            visibility: hidden !important;
          }

          .ts-print-wrapper {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            top: 0;
            left: 0;
            width: 100%;
          }

          .print-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          @page {
            size: A4;
            margin: 0;
          }
        }

        @media screen {
          .ts-print-wrapper {
            display: none;
          }
        }
      `}</style>

      {sheets.map((sheet) => (
        <div className="print-page" key={sheet.mfNo}>
          <TripSheetPrintCopy sheet={sheet} />
        </div>
      ))}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};