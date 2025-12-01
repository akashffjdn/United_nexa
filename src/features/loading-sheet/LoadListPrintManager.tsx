import React, { useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import type { GcEntry, Consignor, Consignee } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { X, Printer } from 'lucide-react'; // Added icons for the screen-only toolbar

// Adjusted type to match previous request's LoadListJob interface
export type LoadListJob = {
    gc: GcEntry;
    consignor: Consignor;
    consignee: Consignee;
};

type LoadListPrintManagerProps = {
    jobs: LoadListJob[];
    onClose: () => void;
};

// Helper function to format the date
const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).replace(/\//g, '-');
};

export const LoadListPrintManager: React.FC<LoadListPrintManagerProps> = ({ jobs, onClose }) => {
    const { user } = useAuth();
    const userName = user?.name || 'User'; // Default name for safety

    const printRef = useRef<HTMLDivElement>(null);

    // --- 1. DATA PROCESSING ---
    const { printData, grandTotalQuantity } = useMemo(() => {
        const groupedLoads = jobs.reduce((acc, job) => {
            // Group by Godown, Consignor, and Consignee for the load list
            const key = `${job.gc.godown || 'N/A'}::${job.consignor.id}::${job.consignee.id}`;

            if (!acc[key]) {
                acc[key] = {
                    godown: job.gc.godown || 'N/A',
                    consignorName: job.consignor.name,
                    consigneeName: job.consignee.name,
                    totalQuantity: 0,
                    firstGcFromNo: Number(job.gc.fromNo || 0),
                    packingDetails: job.gc.packing || 'CASE',
                    contentDetails: job.gc.contents || 'FW',
                    gcList: [],
                };
            }

            acc[key].gcList.push(job.gc);
            acc[key].totalQuantity += Number(job.gc.quantity || 0);
            return acc;
        }, {} as Record<string, {
            godown: string;
            consignorName: string;
            consigneeName: string;
            totalQuantity: number;
            firstGcFromNo: number;
            packingDetails: string | undefined;
            contentDetails: string | undefined;
            gcList: GcEntry[];
        }>);

        const calculatedPrintData = Object.values(groupedLoads).map(group => {
            const sortedGcIds = group.gcList
                .map(g => Number(g.id))
                .sort((a, b) => a - b);

            const fromNo = group.firstGcFromNo;
            const toNo = fromNo > 0 ? fromNo + group.totalQuantity - 1 : null;

            return {
                ...group,
                sortedGcIds,
                primaryGcId: sortedGcIds.length > 0 ? sortedGcIds[0] : 'N/A',
                fromNo,
                toNo,
            };
        });

        const calculatedGrandTotalQuantity = calculatedPrintData.reduce((sum, data) => sum + data.totalQuantity, 0);

        return { printData: calculatedPrintData, grandTotalQuantity: calculatedGrandTotalQuantity };
    }, [jobs]);


    // --- 2. FIXED PRINT LOGIC (JS Force Hide/Show) ---
    useEffect(() => {
        const rootElement = document.getElementById("root");
        const printWrapper = printRef.current;

        if (!rootElement || !printWrapper) {
            console.error("Print elements (root or wrapper) not found.");
            return;
        }

        // Save original styles before forcing them
        const originalRootDisplay = rootElement.style.display;
        const originalWrapperDisplay = printWrapper.style.display;

        // Cleanup function restores original styles and calls onClose
        const cleanupStyles = () => {
            // Restore styles
            rootElement.style.display = originalRootDisplay;
            printWrapper.style.display = originalWrapperDisplay;

            window.removeEventListener("afterprint", afterPrint);
            onClose();
        };

        // Event listener for when the print dialog closes
        const afterPrint = () => {
            // Delay cleanup to ensure browser finishes rendering print preview/PDF
            setTimeout(cleanupStyles, 500);
        };

        window.addEventListener("afterprint", afterPrint);

        // Force visibility change *before* print call
        // This is CRITICAL for cross-browser, dark mode, and mobile printing fixes
        rootElement.style.setProperty("display", "none", "important");
        printWrapper.style.setProperty("display", "block", "important");

        // Auto-trigger print after a short delay to ensure styles and DOM updates are complete
        const printTimeout = setTimeout(() => {
            window.print();
        }, 350);

        // Cleanup on unmount
        return () => {
            window.removeEventListener("afterprint", afterPrint);
            clearTimeout(printTimeout);
            // Ensure styles are restored if component unmounts before print dialog closes
            cleanupStyles();
        };
    }, [onClose]);

    // Handle manual print click (needed for the toolbar)
    const handleManualPrint = () => {
        window.print();
    };


    if (jobs.length === 0) return null;

    // --- 3. RENDER CONTENT ---
    const printContent = (
        <div className="load-list-print-wrapper" ref={printRef}>
            <style>{`
                /* =========================================
                   1. PRINT STYLES (The Output Paper)
                   ========================================= */
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }

                    /* 🛑 HIDE EVERYTHING: Ensure only the wrapper shows (JS handles #root) */
                    body > *:not(.load-list-print-wrapper) {
                        display: none !important;
                    }
                    #root { display: none !important; }

                    /* 🛑 SHOW WRAPPER: Force white background AND BLACK TEXT for dark mode fix */
                    .load-list-print-wrapper {
                        display: block !important;
                        position: static !important; /* Not fixed/absolute in print */
                        width: 100% !important;
                        background-color: #fff !important;
                        color: #000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .load-list-print-wrapper * {
                        color: #000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Ensure global page background is white */
                    html, body {
                        background-color: #fff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                    }
                    
                    /* Hide Toolbar in Print */
                    .print-actions { display: none !important; }

                    /* CRITICAL FIX: Ensure main content and footer flow correctly */
                    .load-list-content {
                        padding-top: 0 !important;
                        padding-bottom: 0 !important;
                        /* Remove max-width on print for full A4 usage */
                        max-width: none !important;
                        width: 100% !important;
                    }
                    
                    /* CRITICAL FIX: Ensure the footer is NOT fixed on print */
                    .print-footer-container {
                        position: static !important; /* Forces it to flow with the content */
                        padding: 0 1rem !important; /* Keep original horizontal padding */
                        margin-top: 1rem;
                    }
                    
                    .print-split-footer {
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: flex-end !important;
                        width: 100% !important;
                    }
                }

                /* =========================================
                   2. SCREEN STYLES (The Preview Overlay & Toolbar)
                   ========================================= */
                @media screen {
                    /* The JS in useEffect is what toggles the display: block, 
                       but this provides a default state. */
                    .load-list-print-wrapper {
                        display: none;
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        width: 100vw;
                        height: 100dvh;
                        background-color: hsl(var(--muted)); 
                        z-index: 2147483647; 
                        overflow-y: auto;
                        overflow-x: hidden;
                    }

                    .load-list-content {
                        /* Padding for the toolbar and centering */
                        padding-top: 80px;
                        padding-bottom: 40px;
                        margin-left: auto;
                        margin-right: auto;
                        /* Simulate A4 page width, adjust this max-width if needed */
                        max-width: 210mm; 
                        min-height: 100%;
                        background: white;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    }
                    
                    /* Footer on screen should be fixed at the bottom of the visible area */
                    .print-footer-container {
                        position: sticky;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        z-index: 10;
                        /* Match the content's background/theme if necessary */
                        background-color: white; 
                        border-top: 1px solid hsl(var(--border));
                    }
                
                    /* --- TOOLBAR STYLES (Copied from previous example) --- */
                    .print-actions {
                        position: fixed;
                        top: 0; left: 0;
                        width: 100%;
                        height: 64px;
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

                    .preview-title { font-weight: 700; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .action-group { display: flex; gap: 10px; }
                    .btn-base {
                        display: flex; align-items: center; gap: 8px; padding: 8px 16px;
                        border-radius: 6px; font-weight: 600; font-size: 14px; border: none;
                        cursor: pointer; transition: all 0.2s;
                    }
                    .print-btn { background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
                    .print-btn:active { transform: scale(0.96); } .print-btn:hover { opacity: 0.9; }
                    .close-btn { background-color: hsl(var(--destructive)); color: hsl(var(--destructive-foreground)); }
                    .close-btn:active { transform: scale(0.96); } .close-btn:hover { opacity: 0.9; }

                    @media (max-width: 480px) {
                        .preview-title { font-size: 14px; max-width: 120px; }
                        .btn-base { padding: 6px 12px; font-size: 13px; }
                        .action-group { gap: 8px; }
                    }
                }
            `}</style>

            {/* HEADER TOOLBAR (Visible only on screen) */}
            <div className="print-actions">
                <span className="preview-title">
                    Load List Preview ({printData.length} Groups)
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

            {/* DOCUMENT CONTENT (Wrapped for screen preview/centering) */}
            <div className="load-list-content p-5 font-sans">

                {/* --- HEADER --- */}
                <div className="text-center m-5 print:mt-1 print:mb-3">
                    <h2 className="text-xl font-extrabold mb-1 print:text-[14pt]">UNITED TRANSPORT CO. SIVAKASI</h2>
                    <h3 className="text-lg font-extrabold print:text-[13pt]">LOAD TO AS ON {getCurrentDate()}</h3>
                </div>

                {/* --- BODY LIST --- */}
                {printData.map((data, index) => (
                    <div key={index} className="m-6 print:m-1 print:my-3 leading-snug">
                        <p className="font-bold text-base print:text-[11pt] whitespace-nowrap">
                            {data.godown} &nbsp;&nbsp;
                            {data.consignorName}
                            &nbsp;({data.primaryGcId})
                            &nbsp;[{data.totalQuantity} {data.packingDetails} {data.contentDetails}]
                            &nbsp;-&nbsp; {data.consigneeName}
                        </p>

                        {/* GC Range Numbers */}
                        {data.fromNo !== null && data.toNo !== null && data.fromNo > 0 && data.toNo > 0 && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 pl-5 text-left print:pl-2 print:text-[10pt]">
                                {
                                    Array.from(
                                        { length: data.toNo - data.fromNo + 1 },
                                        (_, i) => data.fromNo + i
                                    ).map((num) => (
                                        <span key={num} className="font-normal">{num}</span>
                                    ))
                                }
                            </div>
                        )}
                    </div>
                ))}

                {/* --- FOOTER --- */}
                {/* Replaced fixed classes with print-footer-container class for proper printing flow */}
                <div className="p-4 print-footer-container">
                    <div className="max-w-4xl font-bold text-lg mx-auto">
                        <div className="border-t-2 border-black w-full my-2 print:border-t-2"></div>

                        {/* Flex container to split Total (Left) and User Info (Right) */}
                        <div className="py-1 flex justify-between items-start print-split-footer">
                            {/* LEFT SIDE: Total Quantity */}
                            <div className="print:text-[12pt]">
                                **Total : {grandTotalQuantity}**
                            </div>

                            {/* RIGHT SIDE: User Name and Static Line */}
                            <div className="text-xs mb-1 text-center print:text-[10pt]">
                                <p className="italic font-bold mr-1 mb-1">{userName}</p>
                                <p className="italic font-bold mr-1">For UNITED TRANSPORT COMPANY</p>
                            </div>
                        </div>

                        <div className="border-t-2 border-black w-full my-2 print:border-t-2"></div>
                    </div>
                </div>

            </div>
        </div>
    );

    return ReactDOM.createPortal(printContent, document.body);
};
