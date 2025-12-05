import React, { useCallback, useEffect, useState } from "react";
import type { StockLabels } from "../../types";

// --- TYPE DEFINITIONS ---
type Change = {
    field: keyof StockLabels;
    oldValue: string;
};

type StockReportTemplateProps = Partial<{
    onEdit: (hasChanges: boolean, saveHandler: () => void, resetHandler: () => void, undoHandler: () => void) => void;
}>;

// --- MOCK CONTEXT HOOK (Unchanged) ---
const useStockContext = () => {
    // Default initial labels based on StockLabels type
    const defaultLabels: StockLabels = {
        title: "STOCK REPORT",
        companyName: "UNITED TRANSPORT COMPANY",
        companyAddress: "164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123",
        fixedGstinLabel: "GSTIN:",
        fixedGstinValue: "33ABLPV5082H3Z8",
        mobileLabel: "Mobile :",
        mobileNumberValue: "9787718433",
        mainHeader: "Overall Stock Report",
        gcLabel: "GC.No.",
        stockCountLabel: "Stock Qty",
        contentLabel: "Contents",
        consignorLabel: "Consignor",
        consigneeLabel: "Consignee",
        dateLabel: "GC Date",
        totalLabel: "Total :"
    };

    const [reportLabels, setReportLabels] = useState<StockLabels>(defaultLabels);

    const updateReportLabels = (newLabels: StockLabels) => {
        setReportLabels(newLabels);
        console.log("Stock Report Labels updated (Local Mock):", newLabels);
    };

    return { reportLabels, updateReportLabels };
};

// --- EditableText Component (Unchanged) ---
const EditableText: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    placeholder?: string;
}> = ({ value, onChange, className = "", placeholder = "" }) => (
    <input
        type="text"
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        // Note: Added block/appearance-none to ensure it takes up full width in small containers
        className={`border border-dashed border-gray-400 p-0.5 w-full appearance-none block focus:border-solid focus:bg-white ${className}`}
        style={{ minWidth: '30px' }}
    />
);

// --- Core Template Component with Action Logic ---
const StockReportCoreTemplate: React.FC<StockReportTemplateProps> = ({ onEdit }) => {
    const { reportLabels: originalLabels, updateReportLabels } = useStockContext();
    
    const [localLabels, setLocalLabels] = useState<StockLabels>(originalLabels);
    const [historyStack, setHistoryStack] = useState<Change[]>([]);
    const hasChanges = historyStack.length > 0;

    // --- Action Handlers (Unchanged) ---
    const saveHandler = useCallback(() => {
        updateReportLabels(localLabels);
        setHistoryStack([]);
    }, [localLabels, updateReportLabels]);

    const resetHandler = useCallback(() => {
        setLocalLabels(originalLabels);
        setHistoryStack([]);
    }, [originalLabels]);

    const undoHandler = useCallback(() => {
        setHistoryStack(prevStack => {
            if (prevStack.length === 0) return prevStack;

            const lastChange = prevStack[prevStack.length - 1];
            
            setLocalLabels((prevLabels: StockLabels) => ({
                ...prevLabels,
                [lastChange.field]: lastChange.oldValue || ''
            }));

            return prevStack.slice(0, -1);
        });
    }, []);

    // --- Effects (Unchanged) ---
    useEffect(() => {
        if (JSON.stringify(localLabels) !== JSON.stringify(originalLabels)) {
            setLocalLabels(originalLabels);
            setHistoryStack([]);
        }
    }, [originalLabels]);

    useEffect(() => {
        if (onEdit) {
            onEdit(hasChanges, saveHandler, resetHandler, undoHandler);
        }
    }, [hasChanges, onEdit, saveHandler, resetHandler, undoHandler]);
    
    // --- Change Handler with History Recording (Unchanged) ---
    const handleTextChange = (field: keyof StockLabels) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const newValue = e.target.value;
        const currentValue = localLabels[field];

        setLocalLabels((prevLabels: StockLabels) => ({
            ...prevLabels,
            [field]: newValue
        }));

        if (newValue !== currentValue) {
            setHistoryStack(prevStack => {
                return [
                    ...prevStack,
                    { field: field, oldValue: currentValue || '' }
                ];
            });
        }
    };

    // --- Template Markup (MODIFIED FOR RESPONSIVENESS) ---
    return (
        <div
            className="report-page bg-white text-black shadow-2xl mx-auto border border-gray-300"
            // 👇 Responsive styles: Use max-width on smaller screens, then 'lg:w-[210mm]' for desktop/print.
            style={{
                maxWidth: "100%", // Fluid max width
                minHeight: "230mm",
                padding: "10px", // Smaller padding on mobile
                boxSizing: "border-box",
                fontFamily: '"Times New Roman", Times, serif'
            }}
        >
            {/* Header */}
            <div className="w-full font-serif mb-0 text-black">
                {/* Top Title */}
                <div className="text-center font-bold text-base md:text-lg mb-1 uppercase">
                     <EditableText
                        value={localLabels.title }
                        // 👇 Responsive font size
                        className="text-base font-bold text-center w-auto md:text-lg"
                        placeholder="STOCK REPORT"
                        onChange={handleTextChange("title")}
                    />
                </div>
            
                {/* Main Header Box */}
                <div className="border border-black flex flex-col md:flex-row">
                    {/* 👇 Use 'md:w-[70%]' for tablet/desktop, 'w-full' for mobile. Removed fixed border-r on mobile. */}
                    <div className="w-full md:w-[70%] md:border-r border-black p-2">
                        {/* GSTIN and Mobile - flex-wrap to stack on small screens */}
                        <div className="flex flex-wrap justify-between gap-2 items-baseline text-xs font-bold mb-1 lining-nums leading-none">
                            <span className="flex gap-1">
                                <EditableText
                                    value={localLabels.fixedGstinLabel }
                                    className="text-xs font-bold w-auto text-right"
                                    placeholder="GSTIN:..."
                                    onChange={handleTextChange("fixedGstinLabel")}
                                />
                                <EditableText
                                    value={localLabels.fixedGstinValue }
                                    className="text-xs font-bold w-auto"
                                    onChange={handleTextChange("fixedGstinValue")}
                                />
                            </span>
                            <span className="flex gap-1">
                                <EditableText
                                    value={localLabels.mobileLabel }
                                    className="text-xs font-bold w-auto text-right"
                                    placeholder="Mobile :..."
                                    onChange={handleTextChange("mobileLabel")}
                                />
                                <EditableText
                                    value={localLabels.mobileNumberValue }
                                    className="text-xs font-bold w-auto"
                                    onChange={handleTextChange("mobileNumberValue")}
                                />
                            </span>
                        </div>
                    
                        {/* Company Name */}
                        {/* 👇 Responsive font size */}
                        <h1 className="text-xl md:text-2xl font-bold uppercase text-left tracking-tight mt-1">
                            <EditableText
                                value={localLabels.companyName }
                                className="text-xl font-bold text-left tracking-tight md:text-2xl"
                                placeholder="UNITED TRANSPORT COMPANY"
                                    onChange={handleTextChange("companyName")}
                            />
                        </h1>
                        {/* Company Address */}
                        <p className="text-xs font-bold mt-1 text-left">
                            <EditableText
                                value={localLabels.companyAddress }
                                className="text-xs font-bold text-left"
                                placeholder="Address..."
                                    onChange={handleTextChange("companyAddress")}
                            />
                        </p>
                    </div>
                    {/* Placeholder for the other 30% of the header, which is empty in the original code. */}
                    <div className="w-full md:w-[30%] p-2">
                        {/* Add empty space for structure */}
                    </div>
                </div>
            
                <div className="border-x border-b border-black p-1 pl-2 text-sm font-normal">
                    <EditableText
                        value={localLabels.mainHeader }
                        className="text-xs font-bold w-auto"
                        placeholder="Stock Report"
                                    onChange={handleTextChange("mainHeader")}
                    />
                </div>
            </div>

            {/* Table Wrapper for Horizontal Scroll on Mobile */}
            <div className="w-full overflow-x-auto">
                <table 
                    className="w-full table-fixed border-collapse border-x border-b border-black text-[11px] leading-tight mt-0"
                    // 👇 Min width to prevent columns from crushing on mobile
                    style={{ minWidth: '700px' }} 
                >
                    <thead>
                        <tr className="h-8">
                            {/* Note: Kept percentages for desktop, but min-width on table prevents crush */}
                            <th className="border border-black w-[10%] p-1 text-left font-bold text-xs">
                                <EditableText value={localLabels.gcLabel } className="font-bold text-xs text-left"  onChange={handleTextChange("gcLabel")}/>
                            </th>
                            <th className="border border-black w-[12%] p-1 text-left font-bold text-xs">
                                <EditableText value={localLabels.stockCountLabel } className="font-bold text-xs text-left" onChange={handleTextChange("stockCountLabel")} />
                            </th>
                            <th className="border border-black w-[15%] p-1 text-center font-bold text-xs">
                                <EditableText value={localLabels.contentLabel } className="font-bold text-xs text-center" onChange={handleTextChange("contentLabel")} />
                            </th>
                            <th className="border border-black w-[30%] p-1 text-center font-bold text-xs">
                                <EditableText value={localLabels.consignorLabel } className="font-bold text-xs text-center" onChange={handleTextChange("consignorLabel")} />
                            </th>
                            <th className="border border-black w-[30%] p-1 text-center font-bold text-xs">
                                <EditableText value={localLabels.consigneeLabel } className="font-bold text-xs text-center" onChange={handleTextChange("consigneeLabel")} />
                            </th>
                            <th className="border border-black w-[12%] p-1 text-center font-bold text-xs">
                                <EditableText value={localLabels.dateLabel } className="font-bold text-xs text-center" onChange={handleTextChange("dateLabel")} />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Placeholder rows for data (if needed) */}
                        <tr className="h-8">
                             <td className="border border-black p-1 px-2 text-right"></td>
                             <td className="border border-black p-1 px-2 text-left"></td>
                             <td className="border border-black p-1 px-2 text-left"></td>
                             <td className="border border-black p-1 px-2 text-left"></td>
                             <td className="border border-black p-1 px-2 text-left"></td>
                             <td className="border border-black p-1 px-2 text-left"></td>
                        </tr>
                        <tr className="h-8 font-bold bg-gray-50">
                            <td className="border border-black p-1 px-2 text-right">
                                <EditableText value={localLabels.totalLabel} className="font-bold text-xs text-right w-auto" placeholder="Total :" onChange={handleTextChange("totalLabel")}/>
                            </td>
                            <td className="border border-black p-1 px-2 text-left"></td>
                            <td className="border border-black p-1" colSpan={4}></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Outer Wrapper Component (Exports and passes onEdit) ---
export const StockReportTemplate: React.FC<StockReportTemplateProps> = (props) => {
    return (
        <div className="stock-report-screen-wrapper bg-gray-100 dark:bg-black">
             <style>{`
                .stock-report-screen-wrapper {
                    min-height: 100vh;
                }
                .report-page {
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    margin: 20px auto;
                    border: 1px solid #ccc;
                }

                /* 🟢 Desktop/Print Styles (Targeting larger screens and print) */
                @media (min-width: 1024px) { /* Tailind's 'lg' breakpoint */
                    .report-page {
                        width: 210mm; /* Fixed A4 width for desktop/print preview */
                        padding: 10mm 10mm;
                    }
                }

                /* 🟢 Print Styles (Overrides all for clean printing) */
                @media print {
                    .stock-report-screen-wrapper {
                        display: block !important;
                        background: white;
                    }
                    .report-page {
                        box-shadow: none;
                        border: none;
                        margin: 0;
                        padding: 0;
                        width: 210mm !important; /* Ensure A4 for printing */
                        max-width: 210mm !important; 
                        min-height: 297mm; /* Ensure full A4 height */
                    }
                    /* Ensure EditableText does not show dashed borders when printed */
                    .report-page input[type="text"] {
                        border: none !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                    }
                    @page { size: A4; margin: 0; }
                }
            `}</style>
            {/* Pass all props (including onEdit) to the core component */}
            <StockReportCoreTemplate {...props} />
        </div>
    );
}