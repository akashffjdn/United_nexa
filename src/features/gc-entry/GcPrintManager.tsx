import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GcEntry, Consignor, Consignee } from "../../types";
import { GcPrintCopy } from "./GcPrintCopy";
import { X, Printer } from 'lucide-react';

export interface GcPrintJob {
  gc: GcEntry;
  consignor?: Consignor;
  consignee?: Consignee;
}

interface GcPrintManagerProps {
  jobs: GcPrintJob[];
  onClose: () => void;
}

export const GcPrintManager = ({ jobs, onClose }: GcPrintManagerProps) => {
  const printTriggered = useRef(false);

  const printPages = useMemo(() => {
    return jobs.flatMap(({ gc, consignor, consignee }) => {
      if (!consignor || !consignee) return [];
      return [
        <GcPrintCopy key={`${gc.id}-consignor`} gc={gc} consignor={consignor} consignee={consignee} copyType="CONSIGNOR COPY" />,
        <GcPrintCopy key={`${gc.id}-consignee`} gc={gc} consignor={consignor} consignee={consignee} copyType="CONSIGNEE COPY" />,
        <GcPrintCopy key={`${gc.id}-lorry`} gc={gc} consignor={consignor} consignee={consignee} copyType="LORRY COPY" />,
      ];
    });
  }, [jobs]);

  useEffect(() => {
    if (printTriggered.current) return;
    const timer = setTimeout(() => {
      printTriggered.current = true;
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleManualPrint = () => {
    window.print();
  };

  const printContent = (
    <div className="gc-print-wrapper">
      <style>{`
        /* ================= PRINT STYLES ================= */
        @media print {
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
          }
          #root { display: none !important; }
          .gc-print-wrapper {
            position: absolute;
            top: 0; left: 0; width: 100%;
            background: white;
            z-index: 9999;
          }
          .gc-print-wrapper * {
            color: black !important;
            print-color-adjust: exact !important;
          }
          .print-actions { display: none !important; }
          .print-page {
            break-after: page;
            page-break-after: always;
          }
        }

        /* ================= SCREEN / PREVIEW STYLES ================= */
        @media screen {
          .gc-print-wrapper {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100vw;
            height: 100vh; /* Fallback */
            height: 100dvh; /* Dynamic Viewport Height for Mobile */
            background-color: #374151; /* Dark gray for better contrast */
            z-index: 2147483647;
            overflow-y: auto;
            overflow-x: hidden; /* Prevent horizontal scroll on body */
            padding-top: 70px;
            padding-bottom: 40px;
            box-sizing: border-box;
            -webkit-overflow-scrolling: touch;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          /* Default Page Style (Desktop) */
          .print-page {
            background: white;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
            margin-bottom: 20px;
            /* Allow the component to dictate width (210mm), but ensure it renders nicely */
            transform-origin: top center;
            transition: transform 0.2s ease;
          }
        }

        /* ================= MOBILE RESPONSIVE TWEAKS ================= */
        @media screen and (max-width: 800px) {
          .gc-print-wrapper {
            padding-top: 60px; /* Slightly smaller header space */
            padding-left: 0;
            padding-right: 0;
            background-color: #1f2937;
          }

          /* SCALE DOWN THE A4 PAGE TO FIT MOBILE WIDTH 
             A4 width is approx 794px. 
             If screen is 390px, we need approx 0.45 - 0.5 scale.
             Using a flexible container logic here.
          */
          .print-page {
            /* Scale down to 48% (fits most phones ~375px wide) */
            transform: scale(0.48); 
            margin-bottom: -130mm; /* Negative margin to pull up the next page due to scaling whitespace */
            margin-top: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          }
        }

        @media screen and (min-width: 450px) and (max-width: 800px) {
           /* Tablets / Large Phones */
           .print-page {
             transform: scale(0.65);
             margin-bottom: -90mm;
           }
        }

        /* ================= TOOLBAR STYLES ================= */
        .print-actions {
          position: fixed;
          top: 0; left: 0;
          width: 100%;
          height: 60px;
          background-color: #111827; /* Very dark slate */
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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
          gap: 12px;
        }

        .btn-base {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .print-btn {
          background-color: #3b82f6; 
          color: white;
        }
        .print-btn:active { transform: scale(0.96); }

        .close-btn {
          background-color: #ef4444; 
          color: white;
        }
        .close-btn:active { transform: scale(0.96); }

        /* Mobile Toolbar Tweaks */
        @media screen and (max-width: 480px) {
          .preview-title { font-size: 14px; }
          .btn-base { padding: 6px 12px; font-size: 13px; }
          .action-group { gap: 8px; }
          /* Hide text on very small screens if needed, keeping icon */
          /* .btn-base span { display: none; } */
        }
      `}</style>

      {/* HEADER */}
      <div className="print-actions">
        <span className="preview-title">
          Preview ({jobs.length})
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

      {/* DOCUMENT PAGES (Wrapped in container for centering) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {printPages}
      </div>
    </div>
  );

  return createPortal(printContent, document.body);
};