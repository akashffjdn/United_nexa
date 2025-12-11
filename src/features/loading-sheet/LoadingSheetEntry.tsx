import { useState, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  Search, 
  Printer, 
  PackageCheck, 
  Filter, 
  XCircle, 
  FilterX,
  Hash,
  User,
  Package,
  ChevronRight,
  ChevronUp,
} from 'lucide-react';
import { DateFilterButtons, getTodayDate, getYesterdayDate } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { Button } from '../../components/shared/Button';
import { AsyncAutocomplete } from '../../components/shared/AsyncAutocomplete';
import { GcPrintManager, type GcPrintJob } from '../gc-entry/GcPrintManager';
import type { GcEntry, Consignor, Consignee } from '../../types';

import { useServerPagination } from '../../hooks/useServerPagination';
import { Pagination } from '../../components/shared/Pagination';
import { StockReportPrint } from '../pending-stock/StockReportView';
import { LoadListPrintManager, type LoadListJob } from './LoadListPrintManager';
import { QtySelectionDialog } from './QtySelectionDialog';
import { useToast } from '../../contexts/ToastContext';

type ExclusionFilterState = {
  isActive: boolean;
  filterKey?: string;
};

export const LoadingSheetEntry = () => {
  const {
    deleteGcEntry,
    saveLoadingProgress,
    fetchGcById,
    fetchLoadingSheetPrintData,
    searchConsignors,
    searchConsignees,
    searchToPlaces,
    searchGodowns
  } = useData();

  const toast = useToast();

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
  } = useServerPagination<GcEntry & { loadedCount?: number, consignorId?: string, destination?: string, totalQty?: number }>({
    endpoint: '/operations/loading-sheet',
    initialFilters: { search: '', filterType: 'all' },
    initialItemsPerPage: 10
  });

  const [showFilters, setShowFilters] = useState(false);
  const [destinationOption, setDestinationOption] = useState<any>(null);
  const [consignorOption, setConsignorOption] = useState<any>(null);
  const [godownOption, setGodownOption] = useState<any>(null);
  const [consigneeOptions, setConsigneeOptions] = useState<any[]>([]);

  const [selectedGcIds, setSelectedGcIds] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [excludedGcIds, setExcludedGcIds] = useState<string[]>([]);

  const [exclusionFilter, setExclusionFilter] = useState<ExclusionFilterState>({
    isActive: false,
    filterKey: ''
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [isQtySelectOpen, setIsQtySelectOpen] = useState(false);

  const [currentQtySelection, setCurrentQtySelection] = useState<{ 
    gcId: string; 
    maxQty: number; 
    startNo: number; 
    loadedPackages: any[];
    contentItems: any[]; 
  } | null>(null);
    
  const [reportPrintingJobs, setReportPrintingJobs] = useState<any[] | null>(null);
  const [gcPrintingJobs, setGcPrintingJobs] = useState<GcPrintJob[] | null>(null);
  const [loadListPrintingJobs, setLoadListPrintingJobs] = useState<LoadListJob[] | null>(null);

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

    setFilters({ filterType: type, startDate: start, endDate: end, customStart: '', customEnd: '' });
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setFilters({ filterType: 'custom', customStart: start, customEnd: end, startDate: start, endDate: end });
  };

  const clearAllFilters = () => {
    setDestinationOption(null);
    setConsignorOption(null);
    setConsigneeOptions([]);
    setGodownOption(null);
    setFilters({ search: '', filterType: 'all', startDate: '', endDate: '', destination: '', consignor: '', consignee: [], godown: '' });
    setSelectAllMode(false);
    setSelectedGcIds([]);
    setExcludedGcIds([]);
    setExclusionFilter({ isActive: false, filterKey: '' });
  };

  const loadDestinationOptions = useCallback(async (search: string, _prevOptions: any, { page }: any) => {
    const result = await searchToPlaces(search, page);
    return { options: result.data.map((p: any) => ({ value: p.placeName, label: p.placeName })), hasMore: result.hasMore, additional: { page: page + 1 } };
  }, [searchToPlaces]);

  const loadConsignorOptions = useCallback(async (search: string, _prevOptions: any, { page }: any) => {
    const result = await searchConsignors(search, page);
    return { options: result.data.map((c: any) => ({ value: c.id, label: c.name })), hasMore: result.hasMore, additional: { page: page + 1 } };
  }, [searchConsignors]);

  const loadConsigneeOptions = useCallback(async (search: string, _prevOptions: any, { page }: any) => {
    const result = await searchConsignees(search, page);
    return { options: result.data.map((c: any) => ({ value: c.id, label: c.name })), hasMore: result.hasMore, additional: { page: page + 1 } };
  }, [searchConsignees]);

  const loadGodownOptions = useCallback(async (search: string, _prevOptions: any, { page }: any) => {
    const result = await searchGodowns(search, page);
    return { options: result.data.map((g: any) => ({ value: g.godownName || g.name, label: g.godownName || g.name })), hasMore: result.hasMore, additional: { page: page + 1 } };
  }, [searchGodowns]);

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const isChecked = e.target.checked;
    if (selectAllMode) {
      if (!isChecked) {
        setExcludedGcIds(prev => Array.from(new Set([...prev, id])));
      } else {
        setExcludedGcIds(prev => prev.filter(gcId => gcId !== id));
      }
    } else {
      setSelectedGcIds(prev => isChecked ? Array.from(new Set([...prev, id])) : prev.filter(gcId => gcId !== id));
    }
  };

  const isRowSelected = (gcNo: string): boolean => {
    if (selectAllMode) return !excludedGcIds.includes(gcNo);
    return selectedGcIds.includes(gcNo);
  };

  const handleCombinedBulkDeselect = async () => {
    const hasFiltersToDeselect = !!filters.consignor || (Array.isArray(filters.consignee) && filters.consignee.length > 0) || !!filters.destination || !!filters.godown || filters.filterType !== 'all' || !!filters.search;
    let totalDeselected = 0;

    if (!hasFiltersToDeselect) {
      const visibleSelectedIds = paginatedData.map(gc => gc.gcNo).filter(isRowSelected);
      if (visibleSelectedIds.length > 0) {
        if (selectAllMode) {
          setExcludedGcIds(prev => Array.from(new Set([...prev, ...visibleSelectedIds])));
        } else {
          setSelectedGcIds(prev => prev.filter(id => !visibleSelectedIds.includes(id)));
        }
        totalDeselected = visibleSelectedIds.length;
      }
    } else {
      try {
        const allMatchingItems = await fetchLoadingSheetPrintData([], true, filters);
        if (!allMatchingItems || allMatchingItems.length === 0) {
          toast.error('No items found matching the current combination of active filters.');
          clearAllFilters();
          return;
        }
        const allMatchingIds = allMatchingItems.map((item: any) => item.gcNo);
        totalDeselected = allMatchingIds.length;
        if (!selectAllMode) {
          setSelectedGcIds(prev => prev.filter(id => !allMatchingIds.includes(id)));
        } else {
          setExcludedGcIds(prev => Array.from(new Set([...prev, ...allMatchingIds])));
        }
      } catch (error) {
        console.error("Bulk deselect failed:", error);
        toast.error('An error occurred while deselecting filtered items.');
        return;
      }
    }

    if (hasFiltersToDeselect || totalDeselected > 0) {
      clearAllFilters();
    }
  };

  const handleCombinedBulkSelect = async () => {
    const hasFiltersToSelect = !!filters.consignor || (Array.isArray(filters.consignee) && filters.consignee.length > 0) || !!filters.destination || !!filters.godown || filters.filterType !== 'all' || !!filters.search;

    try {
      if (!hasFiltersToSelect) {
        setSelectAllMode(true);
        setExcludedGcIds([]);
        setSelectedGcIds([]);
        setExclusionFilter({ isActive: false, filterKey: '' });
      } else {
        const allMatchingItems = await fetchLoadingSheetPrintData([], true, filters);
        if (!allMatchingItems || allMatchingItems.length === 0) {
          toast.error('No items found matching the current filters.');
          return;
        }
        const allMatchingIds = allMatchingItems.map((item: any) => item.gcNo);
        setSelectAllMode(true);
        setExcludedGcIds([]);
        setSelectedGcIds(allMatchingIds);
        setExclusionFilter({ isActive: false, filterKey: '' });
      }
    } catch (error) {
      console.error("Bulk select failed:", error);
      toast.error('An error occurred while selecting items.');
    }
  };

  useEffect(() => {
    if (selectAllMode) {
      const currentVisibleIds = paginatedData.map(gc => gc.gcNo).filter(gcId => !excludedGcIds.includes(gcId));
      const currentSelectedSet = new Set(selectedGcIds);
      if (currentSelectedSet.size !== currentVisibleIds.length || !currentVisibleIds.every(id => currentSelectedSet.has(id))) {
        setSelectedGcIds(currentVisibleIds);
      }
    }
  }, [paginatedData, selectAllMode, excludedGcIds]);

  const isAllVisibleSelected = paginatedData.length > 0 && paginatedData.every(gc => isRowSelected(gc.gcNo));

  const handleDeselectAllVisible = () => {
    const visibleGcNos = paginatedData.map(gc => gc.gcNo);
    if (isAllVisibleSelected) {
      if (selectAllMode) {
        setExcludedGcIds(prev => Array.from(new Set([...prev, ...visibleGcNos])));
      } else {
        setSelectedGcIds(prev => prev.filter(id => !visibleGcNos.includes(id)));
      }
    } else {
      if (selectAllMode) {
        setExcludedGcIds(prev => prev.filter(gcId => !visibleGcNos.includes(gcId)));
      } else {
        setSelectedGcIds(prev => Array.from(new Set([...prev, ...visibleGcNos])));
      }
    }
  };

  const handleExcludeFilteredData = () => {
    if (!selectAllMode) {
      toast.error("You must first click 'Select All' to use the exclusion feature.");
      return;
    }
    const visibleGcNos = paginatedData.map(gc => gc.gcNo);
    if (visibleGcNos.length === 0) {
      toast.error("No visible items to exclude.");
      return;
    }
    setExcludedGcIds(prev => Array.from(new Set([...prev, ...visibleGcNos])));

    let filterKey: string | undefined;
    if (filters.consignor) filterKey = "Consignor";
    else if (filters.destination) filterKey = "Destination";
    else if (filters.godown) filterKey = "Godown";
    else if (filters.consignee && filters.consignee.length > 0) filterKey = "Consignee";

    setExclusionFilter({ isActive: true, filterKey });
  };

  const handleDelete = (gcNo: string) => {
    setDeletingId(gcNo);
    setDeleteMessage('Are you sure you want to delete GC #' + gcNo + '?');
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await deleteGcEntry(deletingId);
      refresh();
    }
    setIsConfirmOpen(false);
    setDeletingId(null);
  };

  const handlePrintSingle = async (gcNo: string) => {
    try {
      const printData = await fetchLoadingSheetPrintData([gcNo]);
      if (printData && printData.length > 0) {
        const item = printData[0];
        const { consignor, consignee, ...gcData } = item;
        setLoadListPrintingJobs([{
          gc: gcData as GcEntry,
          consignor: { ...consignor, id: consignor.id || consignor._id || 'unknown' } as Consignor,
          consignee: { ...consignee, id: consignee.id || consignee._id || 'unknown' } as Consignee
        }]);
      } else {
        toast.error("Failed to fetch GC details.");
      }
    } catch (error) {
      console.error("Print error:", error);
      toast.error("An error occurred while fetching print data.");
    }
  };

  const handlePrintSelected = async () => {
    const count = selectAllMode ? Math.max(0, totalItems - excludedGcIds.length) : selectedGcIds.length;
    if (count === 0) return;

    try {
      let results = [];
      if (selectAllMode) {
        results = await fetchLoadingSheetPrintData([], true, { ...filters, excludeIds: excludedGcIds });
      } else {
        results = await fetchLoadingSheetPrintData(selectedGcIds);
      }

      if (!results || results.length === 0) {
        toast.error("No data received for selected GCs.");
        return;
      }

      const jobs: LoadListJob[] = results.map((item: any) => {
        const { consignor, consignee, ...gcData } = item;
        return {
          gc: gcData as GcEntry,
          consignor: { ...consignor, id: consignor.id || consignor._id } as Consignor,
          consignee: { ...consignee, id: consignee.id || consignee._id } as Consignee
        };
      });

      if (jobs.length > 0) {
        setLoadListPrintingJobs(jobs);
        setSelectAllMode(false);
        setExcludedGcIds([]);
        setSelectedGcIds([]);
        setExclusionFilter({ isActive: false, filterKey: '' });
      }
    } catch (error) {
      console.error("Bulk print failed", error);
      toast.error("Failed to prepare print jobs.");
    }
  };

  const handleOpenQtySelect = async (gc: GcEntry) => {
    const fullGc = await fetchGcById(gc.gcNo);
    if (fullGc) {
      const maxQty = parseInt(fullGc.quantity?.toString() || "0") || 1;
      const startNo = parseInt(fullGc.fromNo?.toString() || '1') || 1;
      setCurrentQtySelection({ gcId: fullGc.gcNo, maxQty, startNo, loadedPackages: fullGc.loadedPackages || [], contentItems: fullGc.contentItems || [] });
      setIsQtySelectOpen(true);
    } else {
      toast.error("Failed to load GC details.");
    }
  };

  const handleSaveSelectedQty = async (qtyArray: any) => {
    if (currentQtySelection) {
      await saveLoadingProgress(currentQtySelection.gcId, qtyArray);
      refresh();
    }
    setIsQtySelectOpen(false);
    setCurrentQtySelection(null);
  };

  const hasActiveFilters = !!filters.destination || !!filters.consignor || (filters.consignee && filters.consignee.length > 0) || !!filters.godown || filters.filterType !== 'all' || !!filters.search;
  const totalItemsInFilter = hasActiveFilters && selectAllMode ? selectedGcIds.length : totalItems;
  const finalCount = selectAllMode ? Math.max(0, totalItemsInFilter - excludedGcIds.length) : selectedGcIds.length;
  const printButtonText = 'Print (' + finalCount + ')';
  const bulkButtonText = selectAllMode ? "Clear Selection" : "Select All";
  const BulkIconComponent = selectAllMode ? XCircle : PackageCheck;
  const handleBulkAction = selectAllMode ? handleCombinedBulkDeselect : handleCombinedBulkSelect;
  const bulkButtonVariant = selectAllMode ? "destructive" : "primary";
  const multipleSelected = finalCount > 1;

  return (
    <div className="space-y-4">
      {/* ===== CONTROL BAR ===== */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
       {/* Desktop - Single Row (xl and above) */}
<div className="hidden xl:flex items-center gap-3">
  {/* Search Bar (Stays on Left) */}
  <div className="relative flex-1 max-w-md">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <input 
      type="text" 
      placeholder="Search loading sheet..." 
      value={filters.search || ''} 
      onChange={handleSearchChange} 
      className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm" 
    />
  </div>

  {/* Button Group (Moved to Right using ml-auto) */}
  <div className="flex items-center gap-3 ml-auto">
    <Button 
      variant={hasActiveFilters ? "primary" : "outline"} 
      onClick={() => setShowFilters(!showFilters)} 
      className="h-10 px-4 shrink-0"
    >
      <Filter className="w-4 h-4" />
      Filters
      {hasActiveFilters && <span className="ml-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
    </Button>

    <Button 
      variant="secondary" 
      onClick={handlePrintSelected} 
      disabled={finalCount === 0} 
      className="h-10"
    >
      <Printer className="w-4 h-4" />
      {printButtonText}
    </Button>

    <Button 
      variant={bulkButtonVariant} 
      onClick={handleBulkAction} 
      className="h-10"
    >
      <BulkIconComponent className="w-4 h-4" />
      {bulkButtonText}
    </Button>
  </div>
</div>

        {/* Tablet & Mobile - Two Rows (below xl) */}
        <div className="flex xl:hidden flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search loading sheet..." value={filters.search || ''} onChange={handleSearchChange} className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm" />
            </div>
            <Button variant={hasActiveFilters ? "primary" : "outline"} onClick={() => setShowFilters(!showFilters)} className="h-10 px-3 shrink-0">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Filters</span>
              {hasActiveFilters && <span className="ml-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handlePrintSelected} disabled={finalCount === 0} className="flex-1 h-9 text-xs sm:text-sm">
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="ml-1">({finalCount})</span>
            </Button>

            <Button variant={bulkButtonVariant} onClick={handleBulkAction} className="flex-1 h-9 text-xs sm:text-sm">
              <BulkIconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-1">{selectAllMode ? "Clear" : "Select All"}</span>
              <span className="sm:hidden ml-1">{selectAllMode ? "Clear" : "All"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ===== FILTERS PANEL ===== */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-foreground">Filters</h3>
            <div className="flex items-center gap-2">
              {multipleSelected && (
                <button onClick={handleExcludeFilteredData} disabled={paginatedData.length === 0} className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exclude Visible</span>
                </button>
              )}
              <button onClick={clearAllFilters} className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium">
                <FilterX className="w-3.5 h-3.5" />
                Clear All
              </button>
              <button onClick={() => setShowFilters(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {exclusionFilter.isActive && selectAllMode && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
              <XCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Exclusion Active: {excludedGcIds.length} GCs excluded
                {exclusionFilter.filterKey && <> (filtered by <strong>{exclusionFilter.filterKey}</strong>)</>}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <AsyncAutocomplete label="Godown" loadOptions={loadGodownOptions} value={godownOption} onChange={(val: any) => { setGodownOption(val); setFilters({ godown: val?.value || '' }); }} placeholder="Search godown..." defaultOptions />
            <AsyncAutocomplete label="Destination" loadOptions={loadDestinationOptions} value={destinationOption} onChange={(val: any) => { setDestinationOption(val); setFilters({ destination: val?.value || '' }); }} placeholder="Search destination..." defaultOptions />
            <AsyncAutocomplete label="Consignor" loadOptions={loadConsignorOptions} value={consignorOption} onChange={(val: any) => { setConsignorOption(val); setFilters({ consignor: val?.value || '' }); }} placeholder="Search consignor..." defaultOptions />
            <AsyncAutocomplete label="Consignee (Multi-select)" loadOptions={loadConsigneeOptions} value={consigneeOptions} onChange={(val: any) => { const arr = Array.isArray(val) ? val : (val ? [val] : []); setConsigneeOptions(arr); setFilters({ consignee: arr.map((v: any) => v.value) }); }} placeholder="Select consignees..." isMulti={true} defaultOptions />
          </div>

          <DateFilterButtons filterType={filters.filterType || 'all'} setFilterType={handleFilterTypeChange} customStart={filters.customStart || ''} setCustomStart={(val) => handleCustomDateChange(val, filters.customEnd)} customEnd={filters.customEnd || ''} setCustomEnd={(val) => handleCustomDateChange(filters.customStart, val)} />
        </div>
      )}

      {/* ===== DATA TABLE ===== */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Desktop Table - xl and above */}
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left w-12"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isAllVisibleSelected} onChange={handleDeselectAllVisible} /></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><Hash className="w-3.5 h-3.5" />GC No</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><User className="w-3.5 h-3.5" />Consignor</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><User className="w-3.5 h-3.5" />Consignee</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><Package className="w-3.5 h-3.5" />Total Qty</div></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((gc) => {
                  const consignorName = (gc as any).consignorName || 'N/A';
                  const consigneeName = (gc as any).consigneeName || 'N/A';
                  const loadedCount = gc.loadedCount || 0;
                  const totalCount = parseInt((gc.totalQty ?? 0).toString()) || 0;
                  const pendingCount = totalCount - loadedCount;
                  const isPartiallyPending = pendingCount > 0 && pendingCount < totalCount;
                  const isFullyPending = pendingCount === totalCount && totalCount > 0;
                  const isSelected = isRowSelected(gc.gcNo);

                  return (
                    <tr key={gc.gcNo} className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-3"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected} onChange={() => handleSelectRow({ target: { checked: !isSelected } } as any, gc.gcNo)} /></td>
                      <td className="px-4 py-3"><span className="font-semibold text-primary">{gc.gcNo}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{consignorName}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{consigneeName}</span></td>
                      <td className="px-4 py-3"><span className="text-sm font-semibold text-foreground">{totalCount}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${isFullyPending ? 'bg-muted text-foreground' : isPartiallyPending ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600'}`}>{pendingCount}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenQtySelect(gc as GcEntry)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors" title="Load"><PackageCheck className="w-4 h-4" /></button>
                          <button onClick={() => handlePrintSingle(gc.gcNo)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors" title="Print"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(gc.gcNo)} className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-2"><Package className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No entries found</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tablet Table - lg to xl */}
        <div className="hidden lg:block xl:hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-3 text-left w-10"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isAllVisibleSelected} onChange={handleDeselectAllVisible} /></th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">GC No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Consignor / Consignee</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty / Pending</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-12 text-center"><div className="flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((gc) => {
                  const consignorName = (gc as any).consignorName || 'N/A';
                  const consigneeName = (gc as any).consigneeName || 'N/A';
                  const loadedCount = gc.loadedCount || 0;
                  const totalCount = parseInt((gc.totalQty ?? 0).toString()) || 0;
                  const pendingCount = totalCount - loadedCount;
                  const isPartiallyPending = pendingCount > 0 && pendingCount < totalCount;
                  const isFullyPending = pendingCount === totalCount && totalCount > 0;
                  const isSelected = isRowSelected(gc.gcNo);

                  return (
                    <tr key={gc.gcNo} className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-3"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected} onChange={() => handleSelectRow({ target: { checked: !isSelected } } as any, gc.gcNo)} /></td>
                      <td className="px-3 py-3"><span className="font-semibold text-primary">{gc.gcNo}</span></td>
                      <td className="px-3 py-3"><div className="text-sm"><span className="text-foreground block">{consignorName}</span><span className="text-muted-foreground text-xs">→ {consigneeName}</span></div></td>
                      <td className="px-3 py-3"><div className="text-sm"><span className="text-foreground block font-semibold">{totalCount}</span><span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${isFullyPending ? 'bg-muted text-foreground' : isPartiallyPending ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600'}`}>{pendingCount} pending</span></div></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenQtySelect(gc as GcEntry)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors" title="Load"><PackageCheck className="w-4 h-4" /></button>
                          <button onClick={() => handlePrintSingle(gc.gcNo)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors" title="Print"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(gc.gcNo)} className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={5} className="px-3 py-12 text-center"><div className="flex flex-col items-center gap-2"><Package className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No entries found</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - below lg */}
        <div className="block lg:hidden divide-y divide-border">
          {loading ? (
            <div className="p-6 text-center"><div className="flex flex-col items-center gap-2"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></div>
          ) : paginatedData.length > 0 ? (
            paginatedData.map((gc) => {
              const consignorName = (gc as any).consignorName || 'N/A';
              const consigneeName = (gc as any).consigneeName || 'N/A';
              const loadedCount = gc.loadedCount || 0;
              const totalCount = parseInt((gc.totalQty ?? 0).toString()) || 0;
              const pendingCount = totalCount - loadedCount;
              const isPartiallyPending = pendingCount > 0 && pendingCount < totalCount;
              const isFullyPending = pendingCount === totalCount && totalCount > 0;
              const isSelected = isRowSelected(gc.gcNo);

              return (
                <div key={gc.gcNo} className={`p-4 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                  <div className="flex gap-3">
                    <div className="pt-0.5 flex-shrink-0"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected} onChange={() => handleSelectRow({ target: { checked: !isSelected } } as any, gc.gcNo)} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5"><Hash className="w-4 h-4 text-primary/60" /><span className="font-bold text-primary">GC #{gc.gcNo}</span></div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${isFullyPending ? 'bg-muted text-foreground' : isPartiallyPending ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600'}`}>{pendingCount} Pending</span>
                      </div>
                      <div className="space-y-1.5 text-sm mb-3">
                        <div className="flex items-center gap-2 text-foreground"><User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">From:</span><span className="truncate">{consignorName}</span></div>
                        <div className="flex items-center gap-2 text-foreground"><ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">To:</span><span className="truncate">{consigneeName}</span></div>
                        <div className="flex items-center gap-2 text-foreground"><Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">Total Qty:</span><span className="font-semibold">{totalCount}</span></div>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <button onClick={() => handleOpenQtySelect(gc as GcEntry)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"><PackageCheck className="w-3.5 h-3.5" />Load</button>
                        <button onClick={() => handlePrintSingle(gc.gcNo)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"><Printer className="w-3.5 h-3.5" />Print</button>
                        <button onClick={() => handleDelete(gc.gcNo)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center"><div className="flex flex-col items-center gap-2"><Package className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No entries found</p></div></div>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-border p-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
        </div>
      </div>

      {/* Modals */}
      <ConfirmationDialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Delete GC Entry" description={deleteMessage} />
      {reportPrintingJobs && <StockReportPrint data={reportPrintingJobs} onClose={() => setReportPrintingJobs(null)} />}
      {gcPrintingJobs && <GcPrintManager jobs={gcPrintingJobs} onClose={() => setGcPrintingJobs(null)} />}
      {loadListPrintingJobs && <LoadListPrintManager jobs={loadListPrintingJobs} onClose={() => setLoadListPrintingJobs(null)} />}
      {currentQtySelection && <QtySelectionDialog open={isQtySelectOpen} onClose={() => { setIsQtySelectOpen(false); setCurrentQtySelection(null); }} onSelect={handleSaveSelectedQty} gcId={currentQtySelection.gcId} maxQty={currentQtySelection.maxQty} startNo={currentQtySelection.startNo} currentSelected={currentQtySelection.loadedPackages} contentItems={currentQtySelection.contentItems} />}
    </div>
  );
};