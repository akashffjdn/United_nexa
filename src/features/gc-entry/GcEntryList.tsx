import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePenLine,
  Trash2,
  Search,
  Printer,
  Filter,
  FilterX,
  XCircle,
  PackageCheck,
} from "lucide-react";
import {
  DateFilterButtons,
  getTodayDate,
  getYesterdayDate,
} from "../../components/shared/DateFilterButtons";
import { ConfirmationDialog } from "../../components/shared/ConfirmationDialog";
import { useData } from "../../hooks/useData";
import { useServerPagination } from "../../hooks/useServerPagination";
import { Button } from "../../components/shared/Button";
import { AsyncAutocomplete } from "../../components/shared/AsyncAutocomplete";
import { GcPrintManager, type GcPrintJob } from "./GcPrintManager";
import { Pagination } from "../../components/shared/Pagination";
import type { GcEntry, Consignor, Consignee } from "../../types";
import { useToast } from "../../contexts/ToastContext";

// Filter type definition
type GcFilter = {
  search?: string;
  filterType?: string;
  startDate?: string;
  endDate?: string;
  customStart?: string;
  customEnd?: string;
  destination?: string;
  consignor?: string;
  consignee?: string[];
};

type ExclusionFilterState = {
  isActive: boolean;
  filterKey?: string;
};

type SelectAllSnapshot = {
  active: boolean;
  total: number;
  filters: GcFilter;
};

export const GcEntryList = () => {
  const navigate = useNavigate();
  const {
    deleteGcEntry,
    fetchGcPrintData,
    searchConsignors,
    searchConsignees,
    searchToPlaces,
  } = useData();

  const toast = useToast();

  // ---------------------------------------------------------------------------
  // Server pagination - FIXED: Complete initialFilters
  // ---------------------------------------------------------------------------
  const {
    data: paginatedData,
    loading,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setItemsPerPage,
    setCurrentPage,
    setFilters,
    filters,
    refresh,
  } = useServerPagination<GcEntry>({
    endpoint: "/operations/gc",
    initialItemsPerPage: 10,
    initialFilters: {
      search: "",
      filterType: "all",
      startDate: "",
      endDate: "",
      customStart: "",
      customEnd: "",
      destination: "",
      consignor: "",
      consignee: []
    } as GcFilter,
  });

  // ---------------------------------------------------------------------------
  // UI state
  // ---------------------------------------------------------------------------
  const [showFilters, setShowFilters] = useState(false);
  const [destinationOption, setDestinationOption] = useState<any>(null);
  const [consignorOption, setConsignorOption] = useState<any>(null);
  const [consigneeOptions, setConsigneeOptions] = useState<any[]>([]);

  // ---------------------------------------------------------------------------
  // Selection state - FIXED: Proper typed snapshot
  // ---------------------------------------------------------------------------
  const [selectedGcNos, setSelectedGcNos] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [excludedGcNos, setExcludedGcNos] = useState<string[]>([]);
  const [selectAllSnapshot, setSelectAllSnapshot] = useState<SelectAllSnapshot>({
    active: false,
    total: 0,
    filters: {
      search: "",
      filterType: "all",
      startDate: "",
      endDate: "",
      customStart: "",
      customEnd: "",
      destination: "",
      consignor: "",
      consignee: []
    },
  });

  const [, setExclusionFilter] = useState<ExclusionFilterState>({
    isActive: false,
    filterKey: "",
  });

  // ---------------------------------------------------------------------------
  // Modal / print state
  // ---------------------------------------------------------------------------
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [printingJobs, setPrintingJobs] = useState<GcPrintJob[] | null>(null);

  // ---------------------------------------------------------------------------
  // Helper: Create complete filter object
  // ---------------------------------------------------------------------------
  const createCompleteFilters = (sourceFilters: GcFilter): GcFilter => {
    return {
      search: sourceFilters.search || "",
      filterType: sourceFilters.filterType || "all",
      startDate: sourceFilters.startDate || "",
      endDate: sourceFilters.endDate || "",
      customStart: sourceFilters.customStart || "",
      customEnd: sourceFilters.customEnd || "",
      destination: sourceFilters.destination || "",
      consignor: sourceFilters.consignor || "",
      consignee: sourceFilters.consignee || [],
    };
  };

  // ---------------------------------------------------------------------------
  // Async loaders
  // ---------------------------------------------------------------------------
  const loadDestinationOptions = useCallback(
    async (search: string, _prevOptions: any, { page }: any) => {
      const result = await searchToPlaces(search, page);
      return {
        options: result.data.map((p: any) => ({
          value: p.placeName,
          label: p.placeName,
        })),
        hasMore: result.hasMore,
        additional: { page: page + 1 },
      };
    },
    [searchToPlaces]
  );

  const loadConsignorOptions = useCallback(
    async (search: string, _prevOptions: any, { page }: any) => {
      const result = await searchConsignors(search, page);
      return {
        options: result.data.map((c: any) => ({
          value: c.id,
          label: c.name,
        })),
        hasMore: result.hasMore,
        additional: { page: page + 1 },
      };
    },
    [searchConsignors]
  );

  const loadConsigneeOptions = useCallback(
    async (search: string, _prevOptions: any, { page }: any) => {
      const result = await searchConsignees(search, page);
      return {
        options: result.data.map((c: any) => ({
          value: c.id,
          label: c.name,
        })),
        hasMore: result.hasMore,
        additional: { page: page + 1 },
      };
    },
    [searchConsignees]
  );

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleFilterTypeChange = (type: string) => {
    let start = "";
    let end = "";

    if (type === "today") {
      start = getTodayDate();
      end = getTodayDate();
    } else if (type === "yesterday") {
      start = getYesterdayDate();
      end = getYesterdayDate();
    } else if (type === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split("T")[0];
      end = getTodayDate();
    }

    setFilters({
      filterType: type,
      startDate: start,
      endDate: end,
      customStart: "",
      customEnd: "",
    });
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setFilters({
      filterType: "custom",
      customStart: start,
      customEnd: end,
      startDate: start,
      endDate: end,
    });
  };

  const clearAllFilters = () => {
    setDestinationOption(null);
    setConsignorOption(null);
    setConsigneeOptions([]);

    setFilters({
      search: "",
      filterType: "all",
      startDate: "",
      endDate: "",
      destination: "",
      consignor: "",
      consignee: [],
    });

    // clear selection + exclusion/snapshot state
    setSelectAllMode(false);
    setSelectedGcNos([]);
    setExcludedGcNos([]);
    setExclusionFilter({ isActive: false, filterKey: "" });
    setSelectAllSnapshot({
      active: false,
      total: 0,
      filters: createCompleteFilters({})
    });
  };

  const hasActiveFilters =
    !!filters.destination ||
    !!filters.consignor ||
    (filters.consignee && filters.consignee.length > 0) ||
    filters.filterType !== "all" ||
    !!filters.search;

  // ---------------------------------------------------------------------------
  // Selection helpers
  // ---------------------------------------------------------------------------
  const isRowSelected = (gcNo: string): boolean => {
    if (selectAllMode && selectAllSnapshot.active) {
      return !excludedGcNos.includes(gcNo);
    }
    return selectedGcNos.includes(gcNo);
  };

  const isAllVisibleSelected =
    paginatedData.length > 0 && paginatedData.every((gc) => isRowSelected(gc.gcNo));

  const isIndeterminate = useMemo(() => {
    if (paginatedData.length === 0) return false;
    const selectedCount = paginatedData.filter((gc) => isRowSelected(gc.gcNo)).length;
    return selectedCount > 0 && selectedCount < paginatedData.length;
  }, [paginatedData, selectAllMode, excludedGcNos, selectedGcNos, selectAllSnapshot]);

  const finalCount = selectAllMode && selectAllSnapshot.active
    ? Math.max(0, (selectAllSnapshot.total || totalItems) - excludedGcNos.length)
    : selectedGcNos.length;

  const printButtonText = `Print (${finalCount})`;

  const isAllSelected = selectAllMode && selectAllSnapshot.active
    ? excludedGcNos.length === 0
    : (totalItems > 0 && selectedGcNos.length === totalItems);

  const multipleSelected = finalCount > 0;

  const bulkButtonText = isAllSelected ? "Clear Selection" : "Select All";
  const bulkButtonIcon = isAllSelected ? XCircle : PackageCheck;
  const bulkButtonVariant = isAllSelected ? "destructive" : "primary";
  const BulkIconComponent = bulkButtonIcon;

  // ---------------------------------------------------------------------------
  // Selection handlers
  // ---------------------------------------------------------------------------
  const handleSelectAllVisible = (e: React.ChangeEvent<HTMLInputElement>) => {
    const visibleGcNos = paginatedData.map((gc) => gc.gcNo);
    const checked = e.target.checked;

    if (checked) {
      if (selectAllMode && selectAllSnapshot.active) {
        setExcludedGcNos((prev) => prev.filter((id) => !visibleGcNos.includes(id)));
      } else {
        setSelectedGcNos((prev) => Array.from(new Set([...prev, ...visibleGcNos])));
      }
    } else {
      if (selectAllMode && selectAllSnapshot.active) {
        setExcludedGcNos((prev) => Array.from(new Set([...prev, ...visibleGcNos])));
      } else {
        setSelectedGcNos((prev) => prev.filter((id) => !visibleGcNos.includes(id)));
      }
    }
  };

  const handleSelectRow = (gcNo: string, checked: boolean) => {
    if (selectAllMode && selectAllSnapshot.active) {
      if (checked) {
        setExcludedGcNos((prev) => prev.filter((id) => id !== gcNo));
      } else {
        setExcludedGcNos((prev) => Array.from(new Set([...prev, gcNo])));
      }
    } else {
      if (checked) {
        setSelectedGcNos((prev) => Array.from(new Set([...prev, gcNo])));
      } else {
        setSelectedGcNos((prev) => prev.filter((id) => id !== gcNo));
      }
    }
  };

  const handleCombinedBulkDeselect = () => {
    setSelectAllMode(false);
    setExcludedGcNos([]);
    setSelectedGcNos([]);
    setExclusionFilter({ isActive: false, filterKey: "" });
    setSelectAllSnapshot({
      active: false,
      total: 0,
      filters: createCompleteFilters({})
    });
  };

  // FIXED: Create complete filter snapshot
  const handleCombinedBulkSelect = () => {
    if (totalItems === 0) {
      toast.error("No items found to select based on current filters.");
      return;
    }

    const completeFilters = createCompleteFilters(filters);

    setSelectAllMode(true);
    setExcludedGcNos([]);
    setSelectedGcNos([]);
    setExclusionFilter({ isActive: false, filterKey: "" });
    setSelectAllSnapshot({
      active: true,
      total: totalItems,
      filters: completeFilters,
    });
  };

  const handleExcludeFilteredData = async () => {
    // CASE 1: Manual Selection Mode
    if (!selectAllMode || !selectAllSnapshot.active) {
      if (selectedGcNos.length === 0) {
        toast.error("Select at least one GC to exclude.");
        return;
      }

      setExcludedGcNos(prev =>
        Array.from(new Set([...prev, ...selectedGcNos]))
      );
      setSelectedGcNos([]);
      setExclusionFilter({ isActive: true, filterKey: "Manual Selection" });
      toast.success(`Excluded ${selectedGcNos.length} selected items.`);
      return;
    }

    // CASE 2: Select-All Mode (Bulk exclusion)
    try {
      const allMatching = await fetchGcPrintData([], true, {
        ...createCompleteFilters(filters),
        page: 1,
        perPage: 0
      });

      if (!allMatching || allMatching.length === 0) {
        toast.error("No items found to exclude.");
        return;
      }

      const idsToExclude = allMatching.map((gc: any) => gc.gcNo);

      setExcludedGcNos(prev =>
        Array.from(new Set([...prev, ...idsToExclude]))
      );

      setExclusionFilter({ isActive: true, filterKey: "Filter" });
      toast.success(`Excluded ${idsToExclude.length} filtered items.`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to exclude filtered records.");
    }
  };

  // ---------------------------------------------------------------------------
  // Print handlers - FIXED: Keep selection after print
  // ---------------------------------------------------------------------------
  const handlePrintSelected = async () => {
    if (finalCount === 0) {
      toast.error("No GC entries selected for printing.");
      return;
    }

    try {
      let printData: any[] = [];

      if (selectAllMode && selectAllSnapshot.active) {
        const filtersForPrint: GcFilter = {
          ...selectAllSnapshot.filters,
          excludeIds: excludedGcNos.length > 0 ? excludedGcNos : undefined,
        } as any;

        printData = await fetchGcPrintData([], true, filtersForPrint);
      } else {
        printData = await fetchGcPrintData(selectedGcNos);
      }

      const jobs: GcPrintJob[] = printData
        .map((item: any): GcPrintJob | null => {
          const { consignor, consignee, ...gcData } = item;
          if (!gcData || !consignor || !consignee) return null;
          return {
            gc: gcData as GcEntry,
            consignor: consignor as Consignor,
            consignee: consignee as Consignee,
          };
        })
        .filter((job): job is GcPrintJob => job !== null);

      if (jobs.length > 0) {
        setPrintingJobs(jobs);
        toast.success(`Prepared ${jobs.length} print job(s).`);
        // FIXED: Selection is NOT reset after print - keeping it visible
      } else {
        toast.error("Failed to prepare print jobs. No GCs matched criteria.");
      }
    } catch (error) {
      console.error("Bulk print error:", error);
      toast.error("An error occurred while preparing print jobs.");
    }
  };

  const handlePrintSingle = async (gcNo: string) => {
    try {
      const printData = await fetchGcPrintData([gcNo]);
      if (printData && printData.length > 0) {
        const item = printData[0];
        const { consignor, consignee, ...gcData } = item;
        setPrintingJobs([
          {
            gc: gcData as GcEntry,
            consignor: consignor as Consignor,
            consignee: consignee as Consignee,
          },
        ]);
      } else {
        toast.error("Failed to fetch GC details for printing.");
      }
    } catch (error) {
      console.error("Print error:", error);
      toast.error("An error occurred while fetching print data.");
    }
  };

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  const handleEdit = (gcNo: string) => navigate(`/gc-entry/edit/${gcNo}`);

  const handleDelete = (gcNo: string) => {
    setDeletingId(gcNo);
    setDeleteMessage(`Are you sure you want to delete GC Entry #${gcNo}?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await deleteGcEntry(deletingId);
      refresh();
      setSelectedGcNos((prev) => prev.filter((id) => id !== deletingId));
      setExcludedGcNos((prev) => prev.filter((id) => id !== deletingId));
    }
    setIsConfirmOpen(false);
    setDeletingId(null);
  };

  const responsiveBtnClass =
    "w-full md:w-auto text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap";

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="flex flex-col md:flex-row gap-2 sm:gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search all data..."
              value={filters.search || ""}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          </div>

          <Button
            variant={hasActiveFilters ? "primary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 px-3 shrink-0"
            title="Toggle Filters"
          >
            <Filter size={18} className={hasActiveFilters ? "mr-2" : ""} />
            {hasActiveFilters && "Active"}
          </Button>
        </div>

        <div className="w-full md:w-auto mt-2 md:mt-0 grid grid-cols-3 gap-2 md:flex md:flex-row md:gap-2 md:justify-stretch">
          <Button variant="secondary" onClick={handlePrintSelected} disabled={finalCount === 0} className={responsiveBtnClass}>
            <Printer size={14} className="mr-1 sm:mr-2" />
            {printButtonText}
          </Button>

          <Button
            variant={bulkButtonVariant}
            onClick={isAllSelected ? handleCombinedBulkDeselect : handleCombinedBulkSelect}
            className={responsiveBtnClass}
            disabled={!selectAllMode && selectedGcNos.length === 0 && totalItems === 0}
            title={bulkButtonText === "Clear Selection" ? "Click to remove all items from selection" : "Select all filtered items"}
          >
            <BulkIconComponent size={14} className="mr-1 sm:mr-2" />
            {bulkButtonText}
          </Button>

          <Button variant="primary" onClick={() => navigate("/gc-entry/new")} className={responsiveBtnClass}>
            + Add New GC
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="p-4 bg-muted/20 rounded-lg border border-muted animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Advanced Filters</h3>
            <div className="flex gap-2 items-center">
              {multipleSelected && (
                <button onClick={handleExcludeFilteredData} className="text-xs flex items-center text-destructive hover:text-destructive/80 font-medium" disabled={paginatedData.length === 0} title="Exclude all visible items from the current bulk selection">
                  <XCircle size={14} className="mr-1" /> Exclude
                </button>
              )}
              <button onClick={clearAllFilters} className="text-xs flex items-center text-primary hover:text-primary/80 font-medium">
                <FilterX size={14} className="mr-1" /> Clear All
              </button>
            </div>
          </div>

          {excludedGcNos.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-sm">
              <strong>Exclusion Active:</strong> {excludedGcNos.length} GCs are currently excluded from the bulk selection
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <AsyncAutocomplete
                label="Filter by Destination"
                placeholder="Search destination..."
                value={destinationOption}
                onChange={(val) => {
                  setDestinationOption(val);
                  const destinationValue = (val as any)?.value || "";
                  setFilters({ destination: destinationValue });
                }}
                loadOptions={loadDestinationOptions}
                defaultOptions
              />
            </div>

            <div className="space-y-2">
              <AsyncAutocomplete
                label="Filter by Consignor"
                placeholder="Search consignor..."
                value={consignorOption}
                onChange={(val) => {
                  setConsignorOption(val);
                  const consignorValue = (val as any)?.value || "";
                  setFilters({ consignor: consignorValue });
                }}
                loadOptions={loadConsignorOptions}
                defaultOptions
              />
            </div>

            <div>
              <AsyncAutocomplete
                label="Filter by Consignee (Multi-select)"
                loadOptions={loadConsigneeOptions}
                value={consigneeOptions}
                onChange={(val: any) => {
                  const arr = Array.isArray(val) ? val : val ? [val] : [];
                  setConsigneeOptions(arr);
                  const ids = arr.map((v: any) => v.value);
                  setFilters({ consignee: ids });
                }}
                placeholder="Select consignees..."
                isMulti={true}
                defaultOptions
              />
            </div>
          </div>

          <DateFilterButtons
            filterType={filters.filterType || "all"}
            setFilterType={handleFilterTypeChange}
            customStart={filters.customStart || ""}
            setCustomStart={(val) => handleCustomDateChange(val, filters.customEnd)}
            customEnd={filters.customEnd || ""}
            setCustomEnd={(val) => handleCustomDateChange(filters.customStart, val)}
          />
        </div>
      )}

      {/* Data table */}
      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left w-12" title="Select/Deselect all visible items">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary border-muted-foreground/30 rounded focus:ring-primary"
                    checked={isAllVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAllVisible}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">GC No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Consignor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Consignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Dest.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center">Loading data...</td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((gc) => {
                  const consignorName = (gc as any).consignorName || "N/A";
                  const consigneeName = (gc as any).consigneeName || "N/A";
                  const tripSheetId = gc.tripSheetId;
                  const isAssigned = tripSheetId && tripSheetId !== "";
                  const isSelected = isRowSelected(gc.gcNo);

                  return (
                    <tr key={gc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <input type="checkbox" className="h-4 w-4 accent-primary" checked={isSelected} onChange={(e) => handleSelectRow(gc.gcNo, e.target.checked)} />
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">{gc.gcNo}</td>
                      <td className="px-6 py-4 text-sm">{consignorName}</td>
                      <td className="px-6 py-4 text-sm">{consigneeName}</td>
                      <td className="px-6 py-4 text-sm">{gc.destination}</td>
                      <td className="px-6 py-4 text-sm">{gc.totalQty}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isAssigned ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                          {isAssigned ? `TS# ${tripSheetId}` : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button onClick={() => handleEdit(gc.gcNo)} className="text-blue-600 hover:text-blue-800"><FilePenLine size={18} /></button>
                        <button onClick={() => handlePrintSingle(gc.gcNo)} className="text-green-600 hover:text-green-800"><Printer size={18} /></button>
                        <button onClick={() => handleDelete(gc.gcNo)} className="text-destructive hover:text-destructive/80"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">No GC Entries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.map((gc) => {
            const consignorName = (gc as any).consignorName || "N/A";
            const consigneeName = (gc as any).consigneeName || "N/A";
            const tripSheetId = gc.tripSheetId;
            const isAssigned = tripSheetId && tripSheetId !== "";
            const isSelected = isRowSelected(gc.gcNo);

            return (
              <div key={gc.id} className={`p-4 hover:bg-muted/30 transition-colors border-b border-muted last:border-0`}>
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 flex-1">
                    <div className="pt-1">
                      <input type="checkbox" className="h-4 w-4 accent-primary" checked={isSelected} onChange={(e) => handleSelectRow(gc.gcNo, e.target.checked)} />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="font-bold text-blue-600 text-lg">GC #{gc.gcNo}</div>
                      <div className="font-semibold text-foreground">{consignorName}</div>
                      <div className="text-sm text-muted-foreground">To: {consigneeName}</div>
                      <div className="text-sm text-muted-foreground">At: {gc.destination}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pl-2">
                    <button onClick={() => handleEdit(gc.gcNo)} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><FilePenLine size={20} /></button>
                    <button onClick={() => handlePrintSingle(gc.gcNo)} className="text-green-600 p-1 hover:bg-green-50 rounded"><Printer size={20} /></button>
                    <button onClick={() => handleDelete(gc.gcNo)} className="text-destructive p-1 hover:bg-red-50 rounded"><Trash2 size={20} /></button>
                  </div>
                </div>

                <div className="flex justify-end items-end mt-3 pt-3 border-t border-dashed border-muted">
                  <div className={`text-sm font-bold ${isAssigned ? "text-green-600" : "text-muted-foreground"}`}>Status: {isAssigned ? `TS# ${tripSheetId}` : "Pending"}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-muted p-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
        </div>
      </div>

      <ConfirmationDialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Delete GC" description={deleteMessage} />
      {printingJobs && <GcPrintManager jobs={printingJobs} onClose={() => setPrintingJobs(null)} />}
    </div>
  );
};
