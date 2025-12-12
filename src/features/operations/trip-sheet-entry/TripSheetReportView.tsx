import { useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import type { TripSheetEntry, TripReportLabels } from '../../../types';
import { X, Printer } from 'lucide-react';
import { useDataContext } from '../../../contexts/DataContext'; // 🟢 Import DataContext

// --------------------------------------------------
// REPORT HEADER (Fixed for Even Alignment)
// --------------------------------------------------
const ReportHeader = ({ labels }: { labels: TripReportLabels }) => (
  <div
    className="w-full font-serif mb-0 text-black"
    style={{ fontFamily: '"Times New Roman", Times, serif' }}
  >
    <div className="text-center font-bold text-lg mb-1 uppercase">
      {labels.title}
    </div>

    <div className="border border-black flex">
      <div className="w-[70%] border-r border-black p-2">
        <div className="flex justify-between items-baseline text-xs font-bold mb-1 leading-none">
          <span>{labels.fixedGstinLabel} {labels.fixedGstinValue}</span>
          <span>{labels.mobileLabel} {labels.mobileNumberValue}</span>
        </div>

        <h1 className="text-2xl font-bold uppercase text-left tracking-tight mt-1">
          {labels.companyName}
        </h1>

        <p className="text-xs font-bold mt-1 text-left">
          {labels.companyAddress}
        </p>
      </div>

      <div className="w-[30%]"></div>
    </div>

    <div className="border-x border-b border-black p-1 pl-2 text-sm font-normal">
      {labels.mainHeader}
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
  labels: TripReportLabels; // 🟢 Pass labels down
}

const ReportPage = ({
  entries,
  pageNumber,
  totalPages,
  isLastPage,
  grandTotal,
  labels, // 🟢 Destructure labels
}: PageProps) => (
  <div
    className="report-page bg-white text-black"
    style={{
      width: "210mm",
      minHeight: "297mm",
      padding: "10mm",
      boxSizing: "border-box",
      fontFamily: '"Times New Roman", Times, serif',
      display: "flex",        // Enable Flexbox
      flexDirection: "column" // Stack children vertically
    }}
  >
    {/* CONTENT SECTION (Grows to fill space) */}
    <div className="flex-1">
      <ReportHeader labels={labels} />

      {/* TABLE */}
      <table className="w-full table-fixed border-collapse border-x border-b border-black text-[11px] leading-tight mt-0">
        <thead>
          <tr className="h-8">
            <th className="border border-black w-[12%] p-1 text-left font-bold text-xs">{labels.tsLabel}</th>
            <th className="border border-black w-[12%] p-1 text-left font-bold text-xs">{labels.dateLabel}</th>
            <th className="border border-black w-[20%] p-1 text-left font-bold text-xs">{labels.fromPlaceLabel}</th>
            <th className="border border-black w-[20%] p-1 text-left font-bold text-xs">{labels.toPlaceLabel}</th>
            <th className="border border-black w-[15%] p-1 text-right font-bold text-xs">{labels.amountLabel}</th>
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
                {labels.totalLabel}
              </td>
              <td className="border border-black p-1 px-2 text-right">
                ₹{grandTotal.toLocaleString("en-IN")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* FOOTER (Pushed to bottom via flex-1 above) */}
    <div className="mt-auto pt-4 text-center text-[10px] font-sans">
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
  const { printSettings } = useDataContext(); // 🟢 Get Settings
  const labels = printSettings.tripReport;    // 🟢 Alias

  const printTriggered = useRef(false);

  // 1. Calculate Grand Total
  const grandTotal = useMemo(
    () => sheets.reduce((s, ts) => s + (ts.totalAmount ?? 0), 0),
    [sheets]
  );

  // 2. Split into Pages
  const ENTRIES_PER_PAGE = 35;
  const pages = useMemo(() => {
    const arr: TripSheetEntry[][] = [];
    for (let i = 0; i < sheets.length; i += ENTRIES_PER_PAGE) {
      arr.push(sheets.slice(i, i + ENTRIES_PER_PAGE));
    }
    return arr;
  }, [sheets]);

  // 3. Auto Print Trigger
  useEffect(() => {
    if (sheets.length === 0) return;
    if (printTriggered.current) return;

    const timer = setTimeout(() => {
      printTriggered.current = true;
      window.print();
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [sheets]);

  const handleManualPrint = () => {
    window.print();
  };

  const printContent = (
    <div className="trip-report-print-wrapper">
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
          body > *:not(.trip-report-print-wrapper) {
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
          .trip-report-print-wrapper {
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
          .trip-report-print-wrapper * {
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
            min-height: 297mm;
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
          }
        }

        /* =========================================
           2. SCREEN STYLES (The Preview Overlay)
           ========================================= */
        @media screen {
          .trip-report-print-wrapper {
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
            min-height: 297mm;
            display: flex;
            flex-direction: column;
          }
        }

        /* =========================================
           3. MOBILE RESPONSIVENESS (Scaling)
           ========================================= */
        @media screen and (max-width: 800px) {
          .trip-report-print-wrapper {
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
          Trip Report Preview
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
        {pages.map((p, i) => (
          <ReportPage
            key={i}
            entries={p}
            pageNumber={i + 1}
            totalPages={pages.length}
            isLastPage={i === pages.length - 1}
            grandTotal={grandTotal}
            labels={labels} // 🟢 Pass labels
          />
        ))}
      </div>
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};