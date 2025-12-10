import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  RefreshCw,
  X,
  FilterX,
  ChevronUp,
  User,
  Clock,
  Database,
  Loader2,
  Box,
  ArrowRight
} from 'lucide-react';
import { useServerPagination } from '../../hooks/useServerPagination';
import type { HistoryLog, GcEntry } from '../../types';
import { Button } from '../../components/shared/Button';
import { DateFilterButtons, getTodayDate, getYesterdayDate } from '../../components/shared/DateFilterButtons';
import { Pagination } from '../../components/shared/Pagination';
import LoadingScreen from '../../components/shared/LoadingScreen';
import { useDataContext } from '../../contexts/DataContext';

const AuditLogPage = () => {
  const { fetchGcById } = useDataContext();

  // Use Server Pagination Hook
  const {
    data: logs,
    loading,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setItemsPerPage,
    setCurrentPage,
    setFilters,
    filters,
    refresh
  } = useServerPagination<HistoryLog>({
    endpoint: '/users/history',
    
    initialFilters: { 
      search: '', 
      module: 'All', 
      action: 'All', 
      filterType: 'all',
      startDate: '',
      endDate: '' 
    }
  });

  // UI States
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<HistoryLog | null>(null);
  
  // State to hold the GC context for Loading Sheet details
  const [logContext, setLogContext] = useState<GcEntry | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  // --- Handlers ---

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
      endDate: end
    });
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setFilters({
      filterType: 'custom',
      startDate: start,
      endDate: end
    });
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      module: 'All', 
      action: 'All', 
      filterType: 'all',
      startDate: '',
      endDate: '' 
    });
  };

  // Fetch GC Context when a LoadingSheet log is opened
  useEffect(() => {
    if (selectedLog && (selectedLog.collectionName === 'LoadingSheet' || selectedLog.collectionName === 'GcEntry')) {
      setLoadingContext(true);
      fetchGcById(selectedLog.documentId)
        .then((data) => {
          setLogContext(data);
        })
        .catch(() => {
          setLogContext(null);
        })
        .finally(() => {
          setLoadingContext(false);
        });
    } else {
      setLogContext(null);
    }
  }, [selectedLog, fetchGcById]);

  // --- UI Helpers ---

  // 🟢 NEW: Helper to format date in 12-hour format
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getActionColor = (act: string) => {
    switch (act) {
      case 'CREATE': return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Better formatting for Arrays and Objects
  const formatValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-muted-foreground italic">Empty</span>;
    
    // Handle Boolean
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';

    // Handle Array
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-muted-foreground italic">[]</span>;
      // If it's a simple array of numbers/strings, join them
      if (typeof val[0] !== 'object') return val.join(', ');
      // If array of objects, show formatted JSON
      return <pre className="text-[10px] whitespace-pre-wrap max-h-32 overflow-y-auto">{JSON.stringify(val, null, 2)}</pre>;
    }

    // Handle Object
    if (typeof val === 'object') {
      return <pre className="text-[10px] whitespace-pre-wrap max-h-32 overflow-y-auto">{JSON.stringify(val, null, 2)}</pre>;
    }

    return String(val);
  };

  const hasActiveFilters = 
    filters.module !== 'All' || 
    filters.action !== 'All' || 
    filters.filterType !== 'all' || 
    !!filters.search;

  const responsiveBtnClass = "flex-1 md:flex-none text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap";

  // Loading Sheet Specific Logic
  const renderLoadingSheetChanges = () => {
    if (loadingContext) {
      return (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Loading content details...
        </div>
      );
    }

    // 1. Find the change record for 'loadedPackages'
    const loadedChange = selectedLog?.changes?.find(c => c.field === 'loadedPackages');
    
    if (!loadedChange) {
      // Check if it's a status change instead
      const statusChange = selectedLog?.changes?.find(c => c.field === 'loadingStatus');
      if(statusChange) {
         return (
            <div className="p-4 bg-muted/20 rounded border border-muted">
               <div className="text-sm font-medium text-foreground mb-2">Status Changed</div>
               <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{formatValue(statusChange.oldValue)}</span>
                  <ArrowRight size={14} className="text-muted-foreground" />
                  <span className="font-bold text-primary">{formatValue(statusChange.newValue)}</span>
               </div>
            </div>
         )
      }

      return (
        <div className="p-4 bg-muted/20 rounded text-center text-muted-foreground italic text-sm">
          No loading changes recorded in this update.
        </div>
      );
    }

    // 2. Helper to extract numbers for a specific Item ID from the log data
    const getPackagesForId = (data: any, itemId: string | null): Set<number> => {
        const set = new Set<number>();
        if (!data || !Array.isArray(data)) return set;

        data.forEach((entry: any) => {
            if (typeof entry === 'number') {
                // Legacy support or fallback
                if (itemId === null) set.add(entry);
            } else if (entry && typeof entry === 'object' && Array.isArray(entry.packages)) {
                // Ensure ID comparison is robust (String vs String)
                if (itemId === null || String(entry.itemId) === String(itemId)) {
                    entry.packages.forEach((p: number) => set.add(p));
                }
            }
        });
        return set;
    };

    // 3. Helper to Calculate Totals for Summary
    const getAllPackages = (data: any): number[] => {
       const list: number[] = [];
       if (!data || !Array.isArray(data)) return list;
       data.forEach((entry: any) => {
          if (typeof entry === 'number') list.push(entry);
          else if (entry?.packages) list.push(...entry.packages);
       });
       return list;
    };

    const totalOld = getAllPackages(loadedChange.oldValue);
    const totalNew = getAllPackages(loadedChange.newValue);
    const addedCount = totalNew.filter(x => !totalOld.includes(x)).length;
    const removedCount = totalOld.filter(x => !totalNew.includes(x)).length;

    // 4. Fallback Content Items
    let contentItems = logContext?.contentItems || [];
    if (contentItems.length === 0) {
       contentItems = [{
           id: 'FALLBACK_ALL',
           packing: 'Packages',
           contents: 'All Items (Details Unavailable)',
           fromNo: 1,
           qty: 0,
           prefix: ''
       }];
    }

    return (
      <div className="space-y-4">
        
        {/* SUMMARY HEADER (Old -> New) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/20 p-3 rounded-lg border border-muted gap-2">
           <div className="text-sm font-medium">
              <span className="text-muted-foreground">Total Loaded:</span> 
              <span className="ml-1 font-mono">{totalOld.length}</span> 
              <ArrowRight size={14} className="inline mx-2 text-muted-foreground" />
              <span className="font-mono text-foreground font-bold">{totalNew.length}</span>
           </div>
           <div className="flex gap-3 text-xs font-semibold">
              {addedCount > 0 && <span className="text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">+{addedCount} Added</span>}
              {removedCount > 0 && <span className="text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">-{removedCount} Removed</span>}
              {addedCount === 0 && removedCount === 0 && <span className="text-muted-foreground">No quantity changes</span>}
           </div>
        </div>

        {/* LEGEND */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 py-2 bg-background rounded-lg text-[10px] sm:text-xs font-medium text-muted-foreground border border-muted shadow-sm">
           <div className="flex items-center"><div className="w-2.5 h-2.5 bg-green-100 border border-green-400 rounded mr-2"></div> Newly Loaded</div>
           <div className="flex items-center"><div className="w-2.5 h-2.5 bg-red-50 border border-red-300 rounded mr-2 relative overflow-hidden"><div className="absolute inset-0 bg-red-400 opacity-20 transform -rotate-45"></div></div> Unloaded</div>
           <div className="flex items-center"><div className="w-2.5 h-2.5 bg-blue-100 border border-blue-200 rounded mr-2"></div> Previously Loaded</div>
           <div className="flex items-center"><div className="w-2.5 h-2.5 bg-background border border-gray-300 border-dashed rounded mr-2"></div> Remaining</div>
        </div>

        <div className="space-y-6">
          {contentItems.map((item: any, idx: number) => {
            const itemId = item.id === 'FALLBACK_ALL' ? null : item.id;
            
            const oldSet = getPackagesForId(loadedChange.oldValue, itemId);
            const newSet = getPackagesForId(loadedChange.newValue, itemId);
            const allRelevantNumbers = new Set([...oldSet, ...newSet]);
            
            let startNo, endNo, qty;
            
            if (item.id === 'FALLBACK_ALL') {
               if (allRelevantNumbers.size === 0) return null;
               const nums = Array.from(allRelevantNumbers);
               startNo = Math.min(...nums);
               endNo = Math.max(...nums);
               qty = endNo - startNo + 1;
            } else {
               startNo = parseInt(item.fromNo || '1');
               qty = parseInt(item.qty || '0');
               endNo = startNo + qty - 1;
            }

            const fullRange = Array.from({ length: qty }, (_, i) => startNo + i);

            return (
              <div key={idx} className="border border-muted rounded-lg overflow-hidden bg-background shadow-sm">
                {/* Content Header */}
                <div className="bg-muted/30 px-4 py-2.5 border-b border-muted flex justify-between items-center sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <Box size={16} className="text-primary" />
                    <span className="font-semibold text-sm text-foreground">
                      {item.packing} - {item.contents}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono bg-background px-2 py-0.5 rounded border border-muted">
                    Range: {startNo} - {endNo}
                  </span>
                </div>

                {/* Numbers Grid */}
                <div className="p-4 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                  {fullRange.map(num => {
                    const wasLoaded = oldSet.has(num);
                    const isLoaded = newSet.has(num);

                    let className = "";
                    let title = "";

                    if (isLoaded && !wasLoaded) {
                       className = "bg-green-100 text-green-700 border-green-400 font-bold ring-1 ring-green-400/30";
                       title = "Newly Loaded";
                    } else if (!isLoaded && wasLoaded) {
                       className = "bg-red-50 text-red-500 border-red-200 line-through decoration-red-500/50 opacity-70";
                       title = "Unloaded";
                    } else if (isLoaded && wasLoaded) {
                       className = "bg-blue-50 text-blue-700 border-blue-100";
                       title = "Previously Loaded";
                    } else {
                       className = "bg-background text-muted-foreground border-gray-200 border-dashed hover:bg-muted/20";
                       title = "Remaining";
                    }

                    return (
                      <div 
                        key={num} 
                        title={title} 
                        className={`
                          px-1 py-1 rounded text-[10px] sm:text-xs font-mono border flex items-center justify-center min-w-[28px] sm:min-w-[32px] transition-colors
                          ${className}
                        `}
                      >
                          {num}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between bg-background p-3 md:p-4 rounded-lg shadow border border-muted">
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search Doc ID or User..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full pl-9 md:pl-10 pr-4 py-2 text-xs md:text-sm bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          </div>
          <Button
            variant={hasActiveFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="h-9 md:h-10 px-3 shrink-0 text-xs md:text-sm"
            title="Toggle Filters"
          >
            <Filter size={16} className={hasActiveFilters ? "mr-1 md:mr-2" : ""} />
            <span className="hidden xs:inline">{hasActiveFilters && "Active"}</span>
          </Button>
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
          <Button
            variant="secondary"
            onClick={refresh}
            className={responsiveBtnClass}
          >
            <RefreshCw size={14} className="mr-1 sm:mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-muted/20 rounded-lg border border-muted animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-xs md:text-sm text-muted-foreground uppercase tracking-wider">Advanced Filters</h3>
            <div className="flex gap-2">
              <button onClick={clearAllFilters} className="text-xs flex items-center text-primary hover:text-primary/80 font-medium">
                <FilterX size={14} className="mr-1" /> Clear All
              </button>
              <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground ml-2"><ChevronUp size={20} /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Module</label>
              <div className="relative">
                <Database className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select
                  className="w-full pl-9 pr-3 py-2 bg-background border border-muted-foreground/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  value={filters.module || 'All'}
                  onChange={(e) => setFilters({ module: e.target.value })}
                >
                  <option value="All">All Modules</option>
                  <option value="GcEntry">GC Entry</option>
                  <option value="TripSheet">Trip Sheet</option>
                  <option value="LoadingSheet">Loading Sheet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Action</label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select
                  className="w-full pl-9 pr-3 py-2 bg-background border border-muted-foreground/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  value={filters.action || 'All'}
                  onChange={(e) => setFilters({ action: e.target.value })}
                >
                  <option value="All">All Actions</option>
                  <option value="CREATE">Created</option>
                  <option value="UPDATE">Updated</option>
                  <option value="DELETE">Deleted</option>
                </select>
              </div>
            </div>
          </div>

          <DateFilterButtons
            filterType={filters.filterType || 'all'}
            setFilterType={handleFilterTypeChange}
            customStart={filters.startDate || ''}
            setCustomStart={(val) => handleCustomDateChange(val, filters.endDate || '')}
            customEnd={filters.endDate || ''}
            setCustomEnd={(val) => handleCustomDateChange(filters.startDate || '', val)}
          />
        </div>
      )}

      {/* Data Table */}
      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        {loading ? (
           <div className="h-64 flex items-center justify-center">
             <LoadingScreen />
           </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-muted">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Doc ID</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Module</th>
                    
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted bg-background">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                        
                          <td className="px-6 py-4 text-sm font-bold text-primary">
                           {log.documentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {log.collectionName === 'GcEntry' ? 'GC Entry' : log.collectionName === 'TripSheet' ? 'Trip Sheet' : 'Loading Sheet'}
                        </td>
                       
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center text-foreground">
                            <User size={14} className="mr-2 text-muted-foreground" />
                            {log.changedBy}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs md:text-sm text-muted-foreground font-mono">
                           {/* 🟢 UPDATED: Using 12-hr format helper */}
                           {formatDateTime(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                           <span className={`px-2 py-1 rounded text-xs font-semibold border ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <button 
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                            title="View Changes"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p>No audit logs found matching your filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-muted bg-background">
               {logs.length > 0 ? (
                 logs.map((log) => (
                   <div key={log._id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-1.5 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-base font-bold text-blue-600 leading-none">
                              {log.documentId}
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase tracking-wide">
                              {log.collectionName === 'GcEntry' ? 'GC Entry' : log.collectionName === 'TripSheet' ? 'Trip Sheet' : 'Loading Sheet'}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-foreground">
                            <User size={13} className="mr-1.5 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">{log.changedBy}</span>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock size={12} className="mr-1.5 shrink-0" />
                            {/* 🟢 UPDATED: Using 12-hr format helper */}
                            {formatDateTime(log.timestamp)}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 shrink-0 pl-2">
                           <button 
                              onClick={() => setSelectedLog(log)}
                              className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-full transition-colors active:scale-95"
                              title="View Details"
                           >
                              <Eye size={20} />
                           </button>
                           <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold border uppercase tracking-wide ${getActionColor(log.action)}`}>
                              {log.action}
                           </span>
                        </div>
                      </div>
                   </div>
                 ))
               ) : (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                      <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
                      <p>No records found</p>
                  </div>
               )}
            </div>

            {/* Pagination */}
            <div className="border-t border-muted p-4">
              <Pagination 
                 currentPage={currentPage}
                 totalPages={totalPages}
                 onPageChange={setCurrentPage}
                 itemsPerPage={itemsPerPage}
                 onItemsPerPageChange={setItemsPerPage}
                 totalItems={totalItems}
              />
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-muted">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-muted flex items-center justify-between bg-muted/20">
               <div>
                  <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
                    Audit Details
                    <span className="px-2 py-0.5 text-xs font-mono bg-background border border-muted rounded text-muted-foreground">
                       {selectedLog.documentId}
                    </span>
                  </h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                    {/* 🟢 UPDATED: Using 12-hr format helper */}
                    By <span className="font-medium text-foreground">{selectedLog.changedBy}</span> on {formatDateTime(selectedLog.timestamp)}
                  </p>
               </div>
               <button 
                onClick={() => setSelectedLog(null)}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors"
               >
                 <X size={20} />
               </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto">
              {selectedLog.collectionName === 'LoadingSheet' ? (
                renderLoadingSheetChanges()
              ) : selectedLog.action === 'UPDATE' ? (
                 <div className="space-y-4">
                    <h4 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Field Changes</h4>
                    {selectedLog.changes && selectedLog.changes.length > 0 ? (
                      <div className="border border-muted rounded-lg overflow-hidden">
                        <div className="min-w-full overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase border-b border-muted">
                              <tr>
                                <th className="px-3 py-2 md:px-4 md:py-2 text-left w-1/3">Field</th>
                                <th className="px-3 py-2 md:px-4 md:py-2 text-left text-red-600 bg-red-50/50 w-1/3">Old</th>
                                <th className="px-3 py-2 md:px-4 md:py-2 text-left text-green-600 bg-green-50/50 w-1/3">New</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-muted">
                              {selectedLog.changes.map((change, idx) => (
                                <tr key={idx} className="hover:bg-muted/30">
                                  <td className="px-3 py-2 md:px-4 md:py-3 font-medium text-foreground border-r border-muted text-xs md:text-sm">
                                    {change.field}
                                  </td>
                                  <td className="px-3 py-2 md:px-4 md:py-3 text-gray-600 border-r border-muted bg-red-50/10 font-mono text-[10px] md:text-xs break-all">
                                    {formatValue(change.oldValue)}
                                  </td>
                                  <td className="px-3 py-2 md:px-4 md:py-3 text-gray-900 bg-green-50/10 font-mono text-[10px] md:text-xs break-all">
                                    {formatValue(change.newValue)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted/20 rounded text-center text-muted-foreground italic text-sm">
                        No specific field changes recorded (Soft Update)
                      </div>
                    )}
                 </div>
              ) : (
                 <div className="text-center py-6 md:py-8">
                    <div className={`mx-auto w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4 ${
                      selectedLog.action === 'CREATE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {selectedLog.action === 'CREATE' ? <FileText size={24} className="md:w-8 md:h-8" /> : <X size={24} className="md:w-8 md:h-8" />}
                    </div>
                    <h3 className="text-lg md:text-xl font-medium text-foreground">
                      Record {selectedLog.action === 'CREATE' ? 'Created' : 'Deleted'}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-md mx-auto">
                       This entire record was {selectedLog.action.toLowerCase()} by {selectedLog.changedBy}. 
                       {selectedLog.action === 'DELETE' && " The data is preserved in history but marked as deleted in the active system."}
                    </p>
                 </div>
              )}
            </div>

            <div className="p-3 md:p-4 border-t border-muted bg-muted/20 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-background border border-muted rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full md:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;