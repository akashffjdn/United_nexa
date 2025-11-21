import { useState, useMemo } from 'react';
import { Trash2, Search, Printer, Filter, XCircle, RotateCcw } from 'lucide-react'; 
import { DateFilterButtons, getTodayDate, getYesterdayDate, isDateInLast7Days } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { Button } from '../../components/shared/Button';
import { AutocompleteInput } from '../../components/shared/AutocompleteInput';
import { MultiSelect } from '../../components/shared/MultiSelect';
import { LoadListPrintManager, type LoadListJob } from './LoadListPrintManager'; 
import { usePagination } from '../../utils/usePagination';
import { Pagination } from '../../components/shared/Pagination';

export const LoadingSheetEntry = () => {
  const { gcEntries, deleteGcEntry, consignors, consignees, getUniqueDests } = useData();
    
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [consignorFilter, setConsignorFilter] = useState('');
  const [consigneeFilter, setConsigneeFilter] = useState<string[]>([]);
  const [selectedGcIds, setSelectedGcIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState(""); // Added dynamic message state
  const [loadListPrintingJobs, setLoadListPrintingJobs] = useState<LoadListJob[] | null>(null);
    
  // --- Clear Filters ---
  const clearAllFilters = () => {
    setSearch('');
    setFilterType('all');
    setCustomStart('');
    setCustomEnd('');
    setDestFilter('');
    setConsignorFilter('');
    setConsigneeFilter([]);
  };

  // --- Filter Logic ---
  const filteredGcEntries = useMemo(() => {
    return gcEntries.filter(gc => { 
      const consignor = consignors.find(c => c.id === gc.consignorId);
      const consignee = consignees.find(c => c.id === gc.consigneeId);
      
      // Universal Search
      const searchStr = search.toLowerCase();
      const rowData = [
        gc.id,
        consignor?.name,
        consignee?.name,
        gc.destination,
        gc.quantity,
        gc.packing,
        gc.contents
      ].join(' ').toLowerCase();

      const searchMatch = !search || rowData.includes(searchStr);

      const date = gc.gcDate;
      const dateMatch = (() => {
        switch (filterType) {
          case 'today': return date === getTodayDate();
          case 'yesterday': return date === getYesterdayDate();
          case 'week': return isDateInLast7Days(date);
          case 'custom': return (!customStart || date >= customStart) && (!customEnd || date <= customEnd);
          default: return true;
        }
      })();
      const destMatch = !destFilter || gc.destination === destFilter;
      const consignorMatch = !consignorFilter || gc.consignorId === consignorFilter;
      const consigneeMatch = consigneeFilter.length === 0 || consigneeFilter.includes(gc.consigneeId);
      return searchMatch && dateMatch && destMatch && consignorMatch && consigneeMatch;
    });
  }, [gcEntries, consignors, consignees, search, filterType, customStart, customEnd, destFilter, consignorFilter, consigneeFilter]);

  const destinationOptions = useMemo(getUniqueDests, [getUniqueDests]);
  const filteredConsignorOptions = useMemo(() => consignors.map(c => ({value:c.id, label:c.name})), [consignors]);
  const filteredConsigneeOptions = useMemo(() => consignees.map(c => ({value:c.id, label:c.name})), [consignees]);

  const { paginatedData, currentPage, setCurrentPage, totalPages, itemsPerPage, setItemsPerPage, totalItems } = usePagination({ data: filteredGcEntries, initialItemsPerPage: 10 });

  const handleDelete = (gcNo: string) => { 
    setDeletingId(gcNo); 
    setDeleteMessage(`Are you sure you want to delete GC #${gcNo}?`);
    setIsConfirmOpen(true); 
  };
  
  const handleConfirmDelete = () => { 
    if (deletingId) deleteGcEntry(deletingId); 
    setIsConfirmOpen(false); 
    setDeletingId(null); 
  };

  const handlePrintSingle = (gcNo: string) => {
    const gc = gcEntries.find(g => g.id === gcNo);
    if (!gc) return;
    const consignor = consignors.find(c => c.id === gc.consignorId);
    const consignee = consignees.find(c => c.id === gc.consigneeId);
    if (consignor && consignee) setLoadListPrintingJobs([{ gc, consignor, consignee }]);
  };
    
  const handlePrintSelected = () => {
    if (selectedGcIds.length === 0) return;
    const jobs: LoadListJob[] = selectedGcIds.map(id => {
      const gc = gcEntries.find(g => g.id === id);
      if (!gc) return null;
      const consignor = consignors.find(c => c.id === gc.consignorId);
      const consignee = consignees.find(c => c.id === gc.consigneeId);
      return (consignor && consignee) ? { gc, consignor, consignee } : null;
    }).filter(Boolean) as LoadListJob[];
    if (jobs.length > 0) { setLoadListPrintingJobs(jobs); setSelectedGcIds([]); }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedGcIds(e.target.checked ? paginatedData.map(gc => gc.id) : []);
  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => setSelectedGcIds(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(gc => selectedGcIds.includes(gc.id));
  
  const hasActiveFilters = destFilter || consignorFilter || consigneeFilter.length > 0 || filterType !== 'all' || search !== '';

  return (
    <div className="space-y-6">
      
      {/* 1. Top Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
         {/* LEFT: Search + Filter */}
         <div className="flex items-center gap-2 w-full md:w-1/2">
            <div className="relative flex-1">
               <input type="text" placeholder="Search all data..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"/>
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            </div>
            <Button 
               variant={hasActiveFilters ? 'primary' : 'outline'} 
               onClick={() => setShowFilters(!showFilters)} 
               className="h-10 px-3"
               title="Toggle Filters"
            >
               <Filter size={18} className={hasActiveFilters ? "mr-2" : ""} />
               {hasActiveFilters && "Active"}
            </Button>
         </div>
        
        {/* RIGHT: Actions */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <Button variant="secondary" onClick={handlePrintSelected} disabled={selectedGcIds.length === 0}>
            <Printer size={16} className="mr-2" /> Print Selected ({selectedGcIds.length})
          </Button>
        </div>
      </div>

      {/* 2. Collapsible Filters */}
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
             <AutocompleteInput label="Filter by Destination" options={destinationOptions} value={destFilter} onSelect={setDestFilter} placeholder="Search destination..." />
             <AutocompleteInput label="Filter by Consignor" options={filteredConsignorOptions} value={consignorFilter} onSelect={setConsignorFilter} placeholder="Search consignor..." />
             <div><label className="block text-sm font-medium text-muted-foreground mb-1">Filter by Consignee</label><MultiSelect options={filteredConsigneeOptions} selected={consigneeFilter} onChange={setConsigneeFilter} placeholder="Select..." searchPlaceholder="" emptyPlaceholder="" /></div>
          </div>
          <DateFilterButtons filterType={filterType} setFilterType={setFilterType} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />
        </div>
      )}

      {/* 3. Data Table Container */}
      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        
        {/* A) Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left"><input type="checkbox" className="h-4 w-4 accent-primary" checked={isAllSelected} onChange={handleSelectAll} /></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">GC No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">QTY</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Packing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Content</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Consignor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Consignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {paginatedData.map((gc) => (
                  <tr key={gc.id}>
                    <td className="px-4 py-4"><input type="checkbox" className="h-4 w-4 accent-primary" checked={selectedGcIds.includes(gc.id)} onChange={(e) => handleSelectRow(e, gc.id)} /></td>
                    <td className="px-6 py-4 text-primary font-semibold">{gc.id}</td>
                    <td className="px-6 py-4 text-sm">{gc.quantity}</td>
                    <td className="px-6 py-4 text-sm">{gc.packing}</td>
                    <td className="px-6 py-4 text-sm">{gc.contents}</td>
                    <td className="px-6 py-4 text-sm">{consignors.find(c=>c.id===gc.consignorId)?.name}</td>
                    <td className="px-6 py-4 text-sm">{consignees.find(c=>c.id===gc.consigneeId)?.name}</td>
                    <td className="px-6 py-4 space-x-3">
                      <button onClick={() => handlePrintSingle(gc.id)} className="text-green-600 hover:text-green-800"><Printer size={18} /></button>
                      <button onClick={() => handleDelete(gc.id)} className="text-destructive hover:text-destructive/80"><Trash2 size={18} /></button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* B) Mobile View: Detailed Cards (Matching image format) */}
        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.map((gc) => {
             const consignorName = consignors.find(c => c.id === gc.consignorId)?.name || "---";
             const consigneeName = consignees.find(c => c.id === gc.consigneeId)?.name || "---";

             return (
             <div key={gc.id} className="p-4 bg-background hover:bg-muted/10 transition-colors">
                <div className="flex justify-between items-start">
                  {/* Left Side: Checkbox + ID + Details */}
                  <div className="flex gap-3 w-full">
                     {/* Checkbox */}
                     <div className="pt-1">
                        <input 
                          type="checkbox" 
                          className="h-5 w-5 accent-primary" 
                          checked={selectedGcIds.includes(gc.id)} 
                          onChange={(e) => handleSelectRow(e, gc.id)} 
                        />
                     </div>

                     {/* Content Block */}
                     <div className="flex-1 space-y-1">
                        {/* Header: GC #ID */}
                        <div className="font-bold text-blue-600 text-lg leading-tight mb-2">
                          GC #{gc.id}
                        </div>

                        {/* Detailed Rows */}
                        <div className="text-sm space-y-0.5">
                          <div className="font-semibold text-foreground">From: {consignorName}</div>
                          <div className="text-muted-foreground">To: {consigneeName}</div>
                          <div className="text-muted-foreground">Qty DTS: {gc.quantity}</div>
                          <div className="text-muted-foreground">Packing: {gc.packing}</div>
                          <div className="text-muted-foreground">Content: {gc.contents}</div>
                        </div>
                     </div>
                  </div>

                  {/* Right Side: Action Icons Stacked Vertically */}
                  <div className="flex flex-col gap-3 pl-2">
                     <button onClick={() => handlePrintSingle(gc.id)} className="text-green-600 p-1 hover:bg-green-50 rounded">
                        <Printer size={20} />
                     </button>
                     <button onClick={() => handleDelete(gc.id)} className="text-destructive p-1 hover:bg-red-50 rounded">
                        <Trash2 size={20} />
                     </button>
                  </div>
                </div>

                {/* Bottom Footer: Case Qty */}
                <div className="mt-3 pt-2 text-sm font-medium text-foreground">
                   Case Qty: {gc.quantity}
                </div>
             </div>
           )})}
        </div>
        
        {filteredGcEntries.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No Loading Sheet entries match the selected filters.
            </div>
        )}

        <div className="border-t border-muted p-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
        </div>
      </div>

      <ConfirmationDialog 
        open={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete GC" 
        description={deleteMessage} 
      />
      {loadListPrintingJobs && <LoadListPrintManager jobs={loadListPrintingJobs} onClose={() => setLoadListPrintingJobs(null)} />}
    </div>
  );
};