import { useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import type { GcEntry, Consignor, Consignee } from '../../types';

// Helper to detect mobile devices (screens smaller than 768px)
const isMobileScreen = () => window.innerWidth < 768;

// --- Report Header (Fixed for Even Alignment) ---
const ReportHeader = () => (
  <div className="w-full font-serif mb-0 text-black" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
    {/* Top Title */}
    <div className="text-center font-bold text-lg mb-1 uppercase">
      STOCK REPORT
    </div>

    {/* Main Header Box */}
    <div className="border border-black flex">
      
      {/* Left Section (Company Info) */}
      <div className="w-[70%] border-r border-black p-2">
        
        <div className="flex justify-between items-baseline text-xs font-bold mb-1 lining-nums leading-none">
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

      {/* Right Section (Empty Box) */}
      <div className="w-[30%]">
        {/* Intentionally empty to match uploaded format */}
      </div>
    </div>

    {/* Sub Header Row */}
    <div className="border-x border-b border-black p-1 pl-2 text-sm font-normal">
      Overall Stock Report
    </div>
  </div>
);

// --- Report Page Component ---
interface ReportPageProps {
  jobs: {
    gc: GcEntry;
    consignor?: Consignor;
    consignee?: Consignee;
  }[];
  pageNumber: number;
  totalPages: number;
  isLastPage: boolean;
  grandTotal: number;
}

const ReportPage = ({ 
  jobs, 
  pageNumber, 
  totalPages, 
  isLastPage, 
  grandTotal 
}: ReportPageProps) => {
  return (
    <div 
      className="report-page bg-white text-black"
      style={{ 
        width: "210mm", 
        minHeight: "297mm", 
        padding: "10mm 10mm",
        boxSizing: "border-box",
        fontFamily: '"Times New Roman", Times, serif' 
      }}
    >
      <ReportHeader />

      {/* Table */}
      <table className="w-full table-fixed border-collapse border-x border-b border-black text-[11px] leading-tight mt-0">
        <thead>
          <tr className="h-8">
            <th className="border border-black w-[8%] p-1 text-left font-bold text-xs">GC.No.</th>
            <th className="border border-black w-[8%] p-1 text-left font-bold text-xs">Stock Qty</th>
            <th className="border border-black w-[15%] p-1 text-center font-bold text-xs">Contents</th>
            <th className="border border-black w-[30%] p-1 text-center font-bold text-xs">Consignor</th>
            <th className="border border-black w-[30%] p-1 text-center font-bold text-xs">Consignee</th>
            <th className="border border-black w-[12%] p-1 text-center font-bold text-xs">GC Date</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(({ gc, consignor, consignee }) => (
            <tr key={gc.id} className="h-6">
              <td className="border border-black p-1 px-2 text-left">{gc.id}</td>
              <td className="border border-black p-1 px-2 text-left">{gc.quantity}</td>
              <td className="border border-black p-1 px-2 text-left">
                {`${gc.packing} - ${gc.contents}`}
              </td>
              <td className="border border-black p-1 px-2 text-left uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                {consignor?.name || ''}
              </td>
              <td className="border border-black p-1 px-2 text-left uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                {consignee?.name || ''}
              </td>
              <td className="border border-black p-1 px-2 text-center">
                {gc.gcDate}
              </td>
            </tr>
          ))}

          {/* TOTAL ROW - Only show on the last page */}
          {isLastPage && (
            <tr className="h-8 font-bold bg-gray-50">
              <td className="border border-black p-1 px-2 text-right">Total:</td>
              <td className="border border-black p-1 px-2 text-left">{grandTotal}</td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Page Number Footer */}
      <div className="text-center text-[10px] mt-4 font-sans">
        Page {pageNumber} of {totalPages}
      </div>
    </div>
  );
};

// --- Main Print Component ---
interface StockReportPrintProps {
  jobs: {
    gc: GcEntry;
    consignor?: Consignor;
    consignee?: Consignee;
  }[];
  onClose: () => void;
}

export const StockReportPrint = ({ jobs, onClose }: StockReportPrintProps) => {
  // 🛑 Ref for the print wrapper element
  const printRef = useRef<HTMLDivElement>(null); 
  
  // 1. Calculate Grand Total of Quantity
  const grandTotal = useMemo(() => {
    return jobs.reduce((sum, job) => {
      const qty = parseFloat(job.gc.quantity?.toString() || '0');
      return sum + (isNaN(qty) ? 0 : qty);
    }, 0);
  }, [jobs]);

  // 2. Pagination Logic
  const ENTRIES_PER_PAGE = 35;
  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < jobs.length; i += ENTRIES_PER_PAGE) {
      chunks.push(jobs.slice(i, i + ENTRIES_PER_PAGE));
    }
    return chunks;
  }, [jobs]);

  // 3. Print Lifecycle (SPLIT LOGIC)
  useEffect(() => {
    if (jobs.length === 0) return;

    const rootElement = document.getElementById("root");
    const printWrapper = printRef.current; 
    const isMobile = isMobileScreen(); // Determine device type

    if (!rootElement || !printWrapper) {
        console.error("Print elements (root or wrapper) not found.");
        return;
    }
    
    let printTimeout: number;

    // --- 1. DEFINE UNIVERSAL CLEANUP ---
    // Store original styles *before* they might be changed by JS
    const originalRootDisplay = rootElement.style.display;
    const originalWrapperDisplay = printWrapper.style.display;
    
    const cleanupStyles = () => {
        // Restore original styles
        rootElement.style.display = originalRootDisplay;
        printWrapper.style.display = originalWrapperDisplay;
        window.removeEventListener("afterprint", afterPrint);
        onClose(); // Close the manager
    };
    
    const afterPrint = () => {
        // Use a timeout to ensure cleanup runs *after* the print dialog is truly closed
        setTimeout(cleanupStyles, 500); 
    };
    
    // ---------------------------------------------------------
    // 2. MOBILE LOGIC: JS FORCE FIX (Hides UI)
    // ---------------------------------------------------------
    if (isMobile) {
      window.addEventListener("afterprint", afterPrint);

      // Force visibility change *before* print call (THE MOBILE FIX)
      // Manually hide the app and show the print content
      rootElement.style.display = "none";
      printWrapper.style.display = "block";

      // Trigger print after a delay for DOM rendering
      printTimeout = setTimeout(() => {
        window.print();
      }, 500);
    } 
    
    // ---------------------------------------------------------
    // 3. DESKTOP LOGIC: CSS ONLY (Keeps UI visible)
    // ---------------------------------------------------------
    else {
      window.addEventListener("afterprint", afterPrint);

      // Trigger print. Rely on CSS @media print to hide #root.
      printTimeout = setTimeout(() => {
        window.print();
      }, 350);
    }

    // Return cleanup function to run on component unmount
    return () => {
        window.removeEventListener("afterprint", afterPrint);
        clearTimeout(printTimeout);
        // Ensure styles are restored if component unmounts unexpectedly
        rootElement.style.display = originalRootDisplay;
        printWrapper.style.display = originalWrapperDisplay;
    };

  }, [jobs, onClose]);

  const printContent = (
    // 🛑 Use ref and set initial style to 'none' for screen view
    <div className="print-report-wrapper" ref={printRef} style={{ display: 'none' }}>
      <style>{`
        @media print {
          /* 🛑 HIDE EVERYTHING AGGRESSIVELY: This handles the desktop hide via CSS */
          #root,
          body > *:not(.print-report-wrapper) {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            position: fixed !important; 
            top: -9999px !important;
          }
          
          /* 🛑 SHOW WRAPPER: Force white background */
          .print-report-wrapper {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Ensure global page background is white */
          html, body {
              background-color: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
          }
          .report-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
        @media screen {
          .print-report-wrapper {
            display: none;
          }
        }
      `}</style>

      {pages.map((pageJobs, index) => (
        <ReportPage
          key={index}
          jobs={pageJobs}
          pageNumber={index + 1}
          totalPages={pages.length}
          isLastPage={index === pages.length - 1}
          grandTotal={grandTotal}
        />
      ))}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
