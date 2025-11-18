// src/features/trip-sheet-entry/TripSheetPrintManager.tsx
import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

interface TripSheetPrintManagerProps {
  mfNos: string[];  // list of TS numbers to print
  onClose: () => void;
}

export const TripSheetPrintManager: React.FC<TripSheetPrintManagerProps> = ({
  mfNos,
  onClose,
}) => {
  const { getTripSheet } = useData();

  const sheets: TripSheetEntry[] = mfNos
    .map((id) => getTripSheet(id))
    .filter(Boolean) as TripSheetEntry[];

  // Auto-print 450ms after popup opens
  useEffect(() => {
    if (sheets.length > 0) {
      setTimeout(() => window.print(), 450);
    }
  }, [sheets.length]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white max-w-5xl w-full rounded-lg shadow-xl relative p-4 print:p-0">

        {/* Close Button (hidden in print) */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-600 hover:text-black print:hidden"
        >
          <X size={24} />
        </button>

        {/* PRINT STYLES */}
        <style>{`
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .ts-print-page {
              page-break-after: always;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <div className="space-y-6">
          {sheets.length === 0 && (
            <div className="text-red-600 text-lg font-bold p-4">
              ❌ No TripSheet data found.
            </div>
          )}

          {sheets.map((sheet) => (
            <div key={sheet.mfNo} className="ts-print-page bg-white p-6 shadow rounded">
              <TripSheetPrintCopy sheet={sheet} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
