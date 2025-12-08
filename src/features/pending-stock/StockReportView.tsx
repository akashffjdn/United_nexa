import { useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import type { GcEntry, Consignor, Consignee, StockLabels } from '../../types';
import { X, Printer } from 'lucide-react';
import { useDataContext } from '../../contexts/DataContext'; // 🟢 Import DataContext

// --- Report Header (Fixed for Even Alignment) ---
// 🟢 Update: Accept labels as props
const ReportHeader = ({ label }: { label: StockLabels }) => (
  <div className="w-full font-serif mb-0 text-black" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
    {/* Top Title */}
    <div className="text-center font-bold text-lg mb-1 uppercase">
      {label.title}
    </div>

    {/* Main Header Box */}
    <div className="border border-black flex">
      
      {/* Left Section (Company Info) */}
      <div className="w-[70%] border-r border-black p-2">
        <div className="flex justify-between items-baseline text-xs font-bold mb-1 lining-nums leading-none">
          <span>{label.fixedGstinLabel} {label.fixedGstinValue}</span>
          <span>{label.mobileLabel} {label.mobileNumberValue}</span>
        </div>

        <h1 className="text-2xl font-bold uppercase text-left tracking-tight mt-1">
          {label.companyName}
        </h1>
        <p className="text-xs font-bold mt-1 text-left">
          {label.companyAddress}
        </p>
      </div>

      {/* Right Section (Empty Box) */}
      <div className="w-[30%]">
        {/* Intentionally empty to match uploaded format */}
      </div>
    </div>

    {/* Sub Header Row */}
    <div className="border-x border-b border-black p-1 pl-2 text-sm font-normal">
      {label.mainHeader}
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
  labels: StockLabels; // 🟢 Pass labels down
}

const ReportPage = ({ 
  jobs, 
  pageNumber, 
  totalPages, 
  isLastPage, 
  grandTotal,
  labels // 🟢 Destructure
}: ReportPageProps) => {
  return (
    <div 
      className="report-page bg-white text-black relative"
      style={{ 
        width: "210mm", 
        height: "297mm",  // Changed to fixed height for consistent footer positioning
        padding: "10mm 10mm",
        boxSizing: "border-box",
        fontFamily: '"Times New Roman", Times, serif' 
      }}
    >
      <ReportHeader label={labels} /> {/* 🟢 Pass labels */}

      {/* Table */}
      <table className="w-full table-fixed border-collapse border-x border-b border-black text-[11px] leading-tight mt-0">
        <thead>
          <tr className="h-8">
            <th className="border border-black w-[8%] p-1 text-left font-bold text-xs">{labels.gcLabel}</th>
            <th className="border border-black w-[8%] p-1 text-left font-bold text-xs">{labels.stockCountLabel}</th>
            <th className="border border-black w-[15%] p-1 text-center font-bold text-xs">{labels.contentLabel}</th>
            <th className="border border-black w-[30%] p-1 text-center font-bold text-xs">{labels.consignorLabel}</th>
            <th className="border border-black w-[30%] p-1 text-center font-bold text-xs">{labels.consigneeLabel}</th>
            <th className="border border-black w-[12%] p-1 text-center font-bold text-xs">{labels.dateLabel}</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(({ gc, consignor, consignee }) => (
            <tr key={gc.id} className="h-6">
              <td className="border border-black p-1 px-2 text-left">{gc.gcNo}</td>
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
              <td className="border border-black p-1 px-2 text-right">{labels.totalLabel}</td>
              <td className="border border-black p-1 px-2 text-left">{grandTotal}</td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Static Footer */}
      <div className="absolute bottom-0 left-0 w-full pb-8 text-center">
        <div className="text-[10px] font-sans text-black">
          Page {pageNumber} of {totalPages}
        </div>
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
  const { printSettings } = useDataContext(); // 🟢 Get Settings
  const labels = printSettings.stockReport; // 🟢 Alias
  
  const printTriggered = useRef(false);
  
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

  // 3. Auto Print Trigger
  useEffect(() => {
    if (jobs.length === 0) return;
    if (printTriggered.current) return;

    // Small delay ensures content renders into the portal before printing
    const timer = setTimeout(() => {
        printTriggered.current = true;
        window.print();
    }, 1000); 

    return () => {
        clearTimeout(timer);
    };
  }, [jobs]);

  const handleManualPrint = () => {
    window.print();
  };

  const printContent = (
    <div className="stock-report-print-wrapper">
      <style>{`
        /* =========================================
           1. PRINT STYLES (The Output Paper)
           ========================================= */
        @media print {
          /* Remove browser default margins */
          @page {
            size: A4;
            margin: 0; 
          }

          /* Hide main app UI */
          body > *:not(.stock-report-print-wrapper) {
            display: none !important;
          }
          #root {
            display: none !important;
          }

          /* Reset HTML/Body */
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
          }

          /* Wrapper takes over */
          .stock-report-print-wrapper {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
            z-index: 9999;
          }

          /* Force black text */
          .stock-report-print-wrapper * {
            color: black !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          /* Hide Toolbar */
          .print-actions { display: none !important; }

          /* Page Breaks */
          .report-page {
            break-after: page;
            page-break-after: always;
            width: 210mm;
            height: 297mm; /* Force exact height */
            overflow: hidden;
            position: relative;
          }
        }

        /* =========================================
           2. SCREEN STYLES (The Preview Overlay)
           ========================================= */
        @media screen {
          .stock-report-print-wrapper {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100vw;
            height: 100dvh; /* Mobile-friendly viewport height */
            
            /* Theme-aware background color */
            background-color: hsl(var(--muted)); 
            
            z-index: 2147483647; /* Max Z-Index */
            overflow-y: auto;
            overflow-x: hidden;
            
            /* Layout for centering pages */
            padding-top: 80px; /* Space for fixed header */
            padding-bottom: 40px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            
            -webkit-overflow-scrolling: touch;
          }

          /* Desktop Page Preview Style */
          .report-page {
            background: white;
            color: black; /* Preview text always black */
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            margin-bottom: 24px;
            transform-origin: top center;
            transition: transform 0.2s ease;
            width: 210mm; /* Fixed A4 width */
            height: 297mm; /* Fixed height for preview */
            position: relative;
          }
        }

        /* =========================================
           3. MOBILE RESPONSIVENESS (Scaling)
           ========================================= */
        @media screen and (max-width: 800px) {
          .stock-report-print-wrapper {
            padding-top: 70px;
            padding-left: 0;
            padding-right: 0;
            background-color: #1f2937; /* Darker background on mobile */
          }

          .report-page {
            /* Scale A4 (794px) down to fit ~375px screens */
            transform: scale(0.46); 
            /* Pull up the whitespace caused by scaling */
            margin-bottom: -135mm; 
            margin-top: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          }
        }

        @media screen and (min-width: 450px) and (max-width: 800px) {
           /* Tablets */
           .report-page {
             transform: scale(0.65);
             margin-bottom: -90mm;
           }
        }

        /* =========================================
           4. TOOLBAR STYLES (Themed)
           ========================================= */
        .print-actions {
          position: fixed;
          top: 0; left: 0;
          width: 100%;
          height: 64px;
          
          /* Theme variables for colors */
          background-color: hsl(var(--card));
          color: hsl(var(--foreground));
          border-bottom: 1px solid hsl(var(--border));
          
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          z-index: 2147483648;
        }

        .preview-title {
          font-weight: 700;
          font-size: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .action-group {
          display: flex;
          gap: 10px;
        }

        .btn-base {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        /* Themed Primary Button */
        .print-btn {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .print-btn:active { transform: scale(0.96); }
        .print-btn:hover { opacity: 0.9; }

        /* Themed Destructive Button */
        .close-btn {
          background-color: hsl(var(--destructive));
          color: hsl(var(--destructive-foreground));
        }
        .close-btn:active { transform: scale(0.96); }
        .close-btn:hover { opacity: 0.9; }

        /* Small screen adjustments for toolbar */
        @media screen and (max-width: 480px) {
          .preview-title { font-size: 14px; max-width: 120px; }
          .btn-base { padding: 6px 12px; font-size: 13px; }
          .action-group { gap: 8px; }
        }
      `}</style>

      {/* HEADER TOOLBAR */}
      <div className="print-actions">
        <span className="preview-title">
          Stock Report Preview
        </span>
        <div className="action-group">
          <button onClick={handleManualPrint} className="btn-base print-btn">
            <Printer size={18} />
            <span>Print</span>
          </button>
          <button onClick={onClose} className="btn-base close-btn">
            <X size={18} />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT PAGES */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {pages.map((pageJobs, index) => (
          <ReportPage
            key={index}
            jobs={pageJobs}
            pageNumber={index + 1}
            totalPages={pages.length}
            isLastPage={index === pages.length - 1}
            grandTotal={grandTotal}
            labels={labels} // 🟢 Pass labels
          />
        ))}
      </div>
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};