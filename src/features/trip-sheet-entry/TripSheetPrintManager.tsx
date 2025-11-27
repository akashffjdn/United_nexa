import { useEffect, useMemo } from "react";
import ReactDOMServer from "react-dom/server";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

export const TripSheetPrintManager = ({ mfNos, onClose }: TripSheetPrintManagerProps) => {
  const { getTripSheet } = useData();

  const pages = useMemo(() => {
    const sheets: TripSheetEntry[] = mfNos
      .map((id) => getTripSheet(id))
      .filter(Boolean) as TripSheetEntry[];

    return sheets.map(
      (sheet) =>
        `<div class="print-page">
          ${ReactDOMServer.renderToString(<TripSheetPrintCopy sheet={sheet} />)}
        </div>`
    );
  }, [mfNos, getTripSheet]);

  useEffect(() => {
    if (!pages.length) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Popup blocked — please allow popups to print.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
        <html>
          <head>
            <title>Trip Sheet</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

            <style>
              @page {
                size: A4;
                margin: 12mm;
              }

              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .print-page {
                page-break-after: always;
                padding: 10px;
              }
            </style>
          </head>

          <body>${pages.join("")}</body>
        </html>
      `);

    printWindow.document.close();

    // Wait for full load
    printWindow.onload = () => {
      printWindow.focus();

      // Safari/iOS needs delay
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        onClose();
      }, 300);
    };
  }, [pages, onClose]);

  return null; // No portal needed anymore
};
