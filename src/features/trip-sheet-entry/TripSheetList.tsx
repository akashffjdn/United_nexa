import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePenLine, Trash2, Search, Printer, FileText, Filter, XCircle, RotateCcw } from "lucide-react";
import { DateFilterButtons, getTodayDate, getYesterdayDate } from "../../components/shared/DateFilterButtons";
import { ConfirmationDialog } from "../../components/shared/ConfirmationDialog";
import { Button } from "../../components/shared/Button";
import { AutocompleteInput } from "../../components/shared/AutocompleteInput";
import { MultiSelect } from "../../components/shared/MultiSelect";
import { useData } from "../../hooks/useData";
import { useServerPagination } from "../../hooks/useServerPagination";
import type { TripSheetEntry } from "../../types"; 
import { Pagination } from "../../components/shared/Pagination";
import { TripSheetPrintManager } from "./TripSheetPrintManager";
import { TripSheetReportPrint } from "./TripSheetReportView";

export const TripSheetList = () => {
  const navigate = useNavigate();
  const { deleteTripSheet, consignees, consignors, getUniqueDests } = useData();

  // --- 1. FILTER OPTIONS ---
  const placeOptions = useMemo(getUniqueDests, [getUniqueDests]);
  const consignorOptions = useMemo(() => consignors.map(c => ({ value: c.id, label: c.name })), [consignors]);
  const consigneeOptions = useMemo(() => consignees.map(c => ({ value: c.id, label: c.name })), [consignees]);

  // --- 2. SERVER PAGINATION (Optimized Payload) ---
  // This endpoint now returns ONLY: mfNo, fromPlace, toPlace, tsDate, totalAmount
  // The 'items' array is excluded to reduce latency.
  const {
    data: paginatedData,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setItemsPerPage,
    setFilters,
    filters,
    refresh
  } = useServerPagination<TripSheetEntry>({ 
    endpoint: '/operations/tripsheet',
    initialFilters: { search: '', filterType: 'all' }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [printIds, setPrintIds] = useState<string[] | null>(null);
  const [reportPrintingJobs, setReportPrintingJobs] = useState<TripSheetEntry[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [delId, setDelId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  // --- Filter Handlers ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleFilterTypeChange = (type: string) => {
    let start = '';
    let end = '';
    
    if (type === 'today') {
        start = getTodayDate();
        end = getTodayDate();
    } else if (type === 'yesterday') {
        start = getYesterdayDate();
        end = getYesterdayDate();
    } else if (type === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        start = d.toISOString().split('T')[0];
        end = getTodayDate();
    }

    setFilters({ 
        filterType: type, 
        startDate: start, 
        endDate: end,
        customStart: '', 
        customEnd: ''
    });
  };

  const handleCustomDateChange = (start: string, end: string) => {
      setFilters({ 
          filterType: 'custom', 
          customStart: start, 
          customEnd: end,
          startDate: start,
          endDate: end
      });
  };

  const clearAllFilters = () => {
    setFilters({ 
        search: '', 
        filterType: 'all', 
        startDate: '', 
        endDate: '', 
        toPlace: '', 
        consignor: '', 
        consignee: [] 
    });
  };

  const toggleSelect = (mfNo: string) => setSelected(prev => prev.includes(mfNo) ? prev.filter(x => x !== mfNo) : [...prev, mfNo]);
  
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(e.target.checked ? paginatedData.map(t => t.mfNo) : []);
  };
  
  const onDelete = (mfNo: string) => { 
    setDelId(mfNo); 
    setDeleteMessage(`Are you sure you want to delete Trip Sheet #${mfNo}?`);
    setConfirmOpen(true); 
  };
  
  const confirmDelete = async () => { 
    if (delId) {
      await deleteTripSheet(delId); 
      refresh(); 
    }
    setConfirmOpen(false); 
    setDelId(null); 
  };
  
  // Triggers TripSheetPrintManager, which fetches FULL data for each ID
  const handlePrintSingle = (id: string) => setPrintIds([id]);
  const handlePrintSelected = () => { if (selected.length > 0) setPrintIds(selected); };
  
  // Uses list data directly (safe because ReportView only needs summary fields)
  const handleShowReport = () => { 
    if (paginatedData.length > 0) setReportPrintingJobs(paginatedData); 
    else alert("No data to report."); 
  };

  const hasActiveFilters = !!filters.toPlace || !!filters.consignor || (filters.consignee && filters.consignee.length > 0) || filters.filterType !== 'all' || !!filters.search;
  const isAllSelected = paginatedData.length > 0 && selected.length === paginatedData.length;
  const responsiveBtnClass = "flex-1 md:flex-none text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap";

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
        <div className="flex items-center gap-2 w-full md:w-1/2">
           <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search TS No, Place, Driver..."
              value={filters.search || ''} 
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          </div>
          <Button 
             variant={hasActiveFilters ? 'primary' : 'outline'} 
             onClick={() => setShowFilters(!showFilters)} 
             className="h-10 px-3 shrink-0"
             title="Toggle Filters"
          >
            <Filter size={18} className={hasActiveFilters ? "mr-2" : ""} />
            {hasActiveFilters && "Active"}
          </Button>
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
          <Button 
            variant="secondary" 
            onClick={handleShowReport}
            className={responsiveBtnClass}
          >
            <FileText size={14} className="mr-1 sm:mr-2" /> Report
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={handlePrintSelected} 
            disabled={selected.length === 0}
            className={responsiveBtnClass}
          >
            <Printer size={14} className="mr-1 sm:mr-2" /> 
            Print ({selected.length})
          </Button>
          
          <Button 
            variant="primary" 
            onClick={() => navigate("/tripsheet/new")}
            className={responsiveBtnClass}
          >
            + Add New
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 bg-muted/20 rounded-lg border border-muted animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Advanced Filters</h3>
            <div className="flex gap-2">
              <button 
                onClick={clearAllFilters} 
                className="text-xs flex items-center text-primary hover:text-primary/80 font-medium"
              >
                <RotateCcw size={14} className="mr-1" /> Clear All
              </button>
              <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground ml-2"><XCircle size={18} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
             <AutocompleteInput 
                label="Filter by Destination" 
                options={placeOptions} 
                value={filters.toPlace || ''} 
                onSelect={(val) => setFilters({ toPlace: val })} 
                placeholder="Select destination..." 
             />
             
             <AutocompleteInput 
                label="Filter by Consignor" 
                options={consignorOptions} 
                value={filters.consignor || ''} 
                onSelect={(val) => setFilters({ consignor: val })} 
                placeholder="Select consignor..." 
             />
             
             <div>
               <label className="text-sm text-muted-foreground mb-0.5">Filter by Consignee</label>
               <MultiSelect 
                  options={consigneeOptions} 
                  selected={filters.consignee || []} 
                  onChange={(val) => setFilters({ consignee: val })} 
                  placeholder="Select consignees..." 
                  searchPlaceholder="Search..." 
                  emptyPlaceholder="None found" 
               />
             </div>
          </div>
          
          <DateFilterButtons 
            filterType={filters.filterType || 'all'} 
            setFilterType={handleFilterTypeChange} 
            customStart={filters.customStart || ''} 
            setCustomStart={(val) => handleCustomDateChange(val, filters.customEnd)} 
            customEnd={filters.customEnd || ''} 
            setCustomEnd={(val) => handleCustomDateChange(filters.customStart, val)} 
          />
        </div>
      )}

      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left"><input type="checkbox" className="h-4 w-4 accent-primary" checked={isAllSelected} onChange={toggleSelectAll} /></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">TS No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center">Loading data...</td></tr>
              ) : paginatedData.length > 0 ? (
                  paginatedData.map((ts) => (
                    <tr key={ts.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4"><input type="checkbox" className="h-4 w-4 accent-primary" checked={selected.includes(ts.mfNo)} onChange={() => toggleSelect(ts.mfNo)} /></td>
                      <td className="px-6 py-4 font-semibold text-primary">{ts.mfNo}</td>
                      <td className="px-6 py-4 text-sm">{ts.fromPlace}</td>
                      <td className="px-6 py-4 text-sm">{ts.toPlace}</td>
                      <td className="px-6 py-4 text-sm">{ts.tsDate}</td>
                      <td className="px-6 py-4 text-sm">₹{ts.totalAmount.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 space-x-3">
                        <button onClick={() => navigate(`/tripsheet/edit/${ts.mfNo}`)} className="text-blue-600 hover:text-blue-800"><FilePenLine size={18} /></button>
                        <button onClick={() => handlePrintSingle(ts.mfNo)} className="text-green-600 hover:text-green-800"><Printer size={18} /></button>
                        <button onClick={() => onDelete(ts.mfNo)} className="text-destructive hover:text-destructive/80"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
              ) : (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No Trip Sheets found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.map((ts) => (
            <div key={ts.id} className="p-4 bg-background hover:bg-muted/10 transition-colors border-b border-muted last:border-0">
               <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                     <div className="pt-1">
                        <input 
                          type="checkbox" 
                          className="h-5 w-5 accent-primary" 
                          checked={selected.includes(ts.mfNo)} 
                          onChange={() => toggleSelect(ts.mfNo)} 
                        />
                     </div>
                     <div className="flex-1 space-y-1">
                        <div className="font-bold text-blue-600 text-lg leading-tight mb-2">TS #{ts.mfNo}</div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                           <div><span className="font-medium text-foreground">Date:</span> {ts.tsDate}</div>
                           <div><span className="font-medium text-foreground">From:</span> {ts.fromPlace}</div>
                           <div><span className="font-medium text-foreground">To:</span> {ts.toPlace}</div>
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col gap-3 pl-2">
                     <button onClick={() => navigate(`/tripsheet/edit/${ts.mfNo}`)} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><FilePenLine size={20} /></button>
                     <button onClick={() => handlePrintSingle(ts.mfNo)} className="text-green-600 p-1 hover:bg-green-50 rounded"><Printer size={20} /></button>
                     <button onClick={() => onDelete(ts.mfNo)} className="text-destructive p-1 hover:bg-red-50 rounded"><Trash2 size={20} /></button>
                  </div>
               </div>
               <div className="mt-3 pt-2 text-sm font-medium text-foreground border-t border-dashed border-muted">
                  Amount: ₹{ts.totalAmount.toLocaleString("en-IN")}
               </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-muted p-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
        </div>
      </div>

      <ConfirmationDialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={confirmDelete} 
        title="Delete Trip Sheet" 
        description={deleteMessage} 
      />
      {printIds && <TripSheetPrintManager mfNos={printIds} onClose={() => setPrintIds(null)} />}
      {reportPrintingJobs && <TripSheetReportPrint sheets={reportPrintingJobs} onClose={() => setReportPrintingJobs(null)} />}
    </div>
  );
};