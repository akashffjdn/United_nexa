// src/features/trip-sheet-entry/TripSheetReportPrint.tsx
import { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import type { TripSheetEntry } from "../../types";

// --------------------------------------------------
// REPORT HEADER (Same Style as Stock Report)
// --------------------------------------------------
const ReportHeader = () => (
  <div
    className="w-full font-serif mb-0 text-black"
    style={{ fontFamily: '"Times New Roman", Times, serif' }}
  >
    <div className="text-center font-bold text-lg mb-1 uppercase">
      TRIP SHEET REPORT
    </div>

    <div className="border border-black flex">
      <div className="w-[70%] border-r border-black p-2">
        <div className="flex justify-between items-baseline text-xs font-bold mb-1 leading-none">
          <span>GSTIN:33ABLPV5082H3Z8</span>
          <span>Mobile : 9787718433</span>
        </div>

        <h1 className="text-2xl font-bold uppercase text-left tracking-tight mt-1">
          UNITED TRANSPORT COMPANY
        </h1>

        <p className="text-xs font-bold mt-1 text-left">
          164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123
        </p>
      </div>

      <div className="w-[30%]"></div>
    </div>

    <div className="border-x border-b border-black p-1 pl-2 text-sm font-normal">
      Overall TripSheet Report
    </div>
  </div>
);

// --------------------------------------------------
// SINGLE PAGE COMPONENT
// --------------------------------------------------
interface PageProps {
  entries: TripSheetEntry[];
  pageNumber: number;
  totalPages: number;
  isLastPage: boolean;
  grandTotal: number;
}

const ReportPage = ({
  entries,
  pageNumber,
  totalPages,
  isLastPage,
  grandTotal,
}: PageProps) => (
  <div
    className="report-page bg-white text-black"
    style={{
      width: "210mm",
      minHeight: "297mm",
      padding: "10mm",
      boxSizing: "border-box",
      fontFamily: '"Times New Roman", Times, serif',
    }}
  >
    <ReportHeader />

    {/* TABLE */}
    <table className="w-full table-fixed border-collapse border-x border-b border-black text-[11px] leading-tight mt-0">
      <thead>
        <tr className="h-8">
          <th className="border border-black w-[12%] p-1 text-left font-bold text-xs">TS No</th>
          <th className="border border-black w-[12%] p-1 text-left font-bold text-xs">Date</th>
          <th className="border border-black w-[20%] p-1 text-left font-bold text-xs">From</th>
          <th className="border border-black w-[20%] p-1 text-left font-bold text-xs">To</th>
          <th className="border border-black w-[15%] p-1 text-right font-bold text-xs">Amount</th>
        </tr>
      </thead>

      <tbody>
        {entries.map((ts) => (
          <tr key={ts.mfNo} className="h-6">
            <td className="border border-black p-1 px-2">{ts.mfNo}</td>
            <td className="border border-black p-1 px-2">{ts.tsDate}</td>
            <td className="border border-black p-1 px-2">{ts.fromPlace}</td>
            <td className="border border-black p-1 px-2">{ts.toPlace}</td>
            <td className="border border-black p-1 px-2 text-right">
              ₹{(ts.totalAmount ?? 0).toLocaleString("en-IN")}
            </td>
          </tr>
        ))}

        {isLastPage && (
          <tr className="h-8 font-bold bg-gray-50">
            <td className="border border-black p-1 px-2 text-right" colSpan={4}>
              TOTAL:
            </td>
            <td className="border border-black p-1 px-2 text-right">
              ₹{grandTotal.toLocaleString("en-IN")}
            </td>
          </tr>
        )}
      </tbody>
    </table>

    <div className="text-center text-[10px] mt-4 font-sans">
      Page {pageNumber} of {totalPages}
    </div>
  </div>
);

// --------------------------------------------------
// MAIN PRINT PORTAL COMPONENT
// --------------------------------------------------
export const TripSheetReportPrint = ({
  sheets,
  onClose,
}: {
  sheets: TripSheetEntry[];
  onClose: () => void;
}) => {
  // 🛑 NEW: Ref for the print wrapper
  const printRef = useRef<HTMLDivElement>(null);

  // ▬▬▬ GRAND TOTAL ▬▬▬
  const grandTotal = useMemo(
    () => sheets.reduce((s, ts) => s + (ts.totalAmount ?? 0), 0),
    [sheets]
  );

  // ▬▬▬ SPLIT INTO PAGES ▬▬▬
  const ENTRIES_PER_PAGE = 35;
  const pages = useMemo(() => {
    const arr: TripSheetEntry[][] = [];
    for (let i = 0; i < sheets.length; i += ENTRIES_PER_PAGE) {
      arr.push(sheets.slice(i, i + ENTRIES_PER_PAGE));
    }
    return arr;
  }, [sheets]);

  // ▬▬▬ PRINT + CLOSE (UNIVERSAL JS FIX) ▬▬▬
  useEffect(() => {
    if (sheets.length === 0) return;

    const rootElement = document.getElementById("root");
    const printWrapper = printRef.current; // Get the wrapper element

    if (!rootElement || !printWrapper) {
      console.error("Print elements (root or wrapper) not found.");
      return;
    }

    // --- JS FORCE FIX START (UNIVERSAL RELIABILITY FIX) ---
    // 1. Store original styles
    const originalRootDisplay = rootElement.style.display;
    const originalWrapperDisplay = printWrapper.style.display;
    let printTimeout: number;

    // 2. Define Cleanup (Restore UI)
    const cleanupStyles = () => {
      // Use a timeout to ensure cleanup runs *after* the print dialog is truly closed
      setTimeout(() => {
        // Restore original styles
        rootElement.style.display = originalRootDisplay;
        printWrapper.style.display = originalWrapperDisplay;
        window.removeEventListener("afterprint", afterPrint);
        onClose(); // Close the manager
      }, 500); 
    };
    
    // 3. Define afterprint listener
    const afterPrint = () => {
      cleanupStyles(); 
    };

    window.addEventListener("afterprint", afterPrint);

    // 4. Force visibility change *before* print call (THE MOBILE FIX)
    rootElement.style.display = "none";
    printWrapper.style.display = "block";

    // 5. Trigger print after a short delay
    printTimeout = setTimeout(() => {
      window.print();
    }, 500); // Using 500ms universally for better reliability

    // --- JS FORCE FIX END ---

    // 6. Return cleanup function to run on component unmount
    return () => {
      window.removeEventListener("afterprint", afterPrint);
      clearTimeout(printTimeout);
      // Ensure cleanup runs if the component unmounts unexpectedly
      rootElement.style.display = originalRootDisplay;
      printWrapper.style.display = originalWrapperDisplay;
    };

  }, [sheets, onClose]); 

  // ▬▬▬ PORTAL CONTENT ▬▬▬
  const printContent = (
    // 🛑 NEW: Use the ref and set initial style to 'none'
    <div className="trip-report-wrapper" ref={printRef} style={{ display: 'none' }}> 
      <style>{`
        @media print {
          /* 🛑 HIDE EVERYTHING AGGRESSIVELY: Target #root and body children */
          #root, 
          body > *:not(.trip-report-wrapper) {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            position: fixed !important; 
            top: -9999px !important;
          }

          /* 🛑 SHOW REPORT WRAPPER: Use block, static position, and forced white background */
          .trip-report-wrapper {
            display: block !important;
            visibility: visible !important;
            position: static !important; 
            width: 100% !important;
            background-color: #fff !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Force page styling */
          .report-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          
          /* Page size and margin */
          @page { size: A4; margin: 0; }
          
          /* Ensure body and html are white */
          html, body {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        @media screen {
          /* Ensure wrapper is hidden when not printing */
          .trip-report-wrapper { display: none; }
        }
      `}</style>

      {pages.map((p, i) => (
        <ReportPage
          key={i}
          entries={p}
          pageNumber={i + 1}
          totalPages={pages.length}
          isLastPage={i === pages.length - 1}
          grandTotal={grandTotal}
        />
      ))}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
