import React, { useState } from 'react';
import { AsyncAutocomplete } from '../../../components/shared/AsyncAutocomplete';
import { useData } from '../../../hooks/useData';
import type { GcContentItem } from '../../../types';
import { 
    Lightbulb, 
    Package, 
    CheckSquare, 
    Square, 
    GripVertical,
    Weight,
    Boxes,
    Search,
    PackageOpen,
    ChevronDown,
    ChevronUp,
    Filter
} from 'lucide-react';

interface PendingStockPanelProps {
    selectedGcId: string;
    onGcSelect: (gcId: string) => void;
    items: GcContentItem[];
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onSelectAll: (checked: boolean) => void;
    onAssist: (item: GcContentItem) => void;
}

export const PendingStockPanel = ({
    selectedGcId,
    onGcSelect,
    items,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    onAssist
}: PendingStockPanelProps) => {
    const { searchGcEntries } = useData();
    const [gcOption, setGcOption] = useState<any>(null);
    const [searchFilter, setSearchFilter] = useState('');
    const [sortBy, setSortBy] = useState<'default' | 'qty' | 'weight'>('default');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const loadGcOptions = async (search: string, _prevOptions: any, { page }: any) => {
        const result = await searchGcEntries(search, page);
        return {
            options: result.data.map((gc: any) => ({
                value: gc.gcNo,
                label: `${gc.gcNo} - ${gc.consignorName || 'Unknown'}`,
                original: gc
            })),
            hasMore: result.hasMore,
            additional: { page: page + 1 },
        };
    };

    const handleGcChange = (option: any) => {
        setGcOption(option);
        onGcSelect(option?.value || '');
        setSearchFilter('');
    };

    const handleDragStart = (e: React.DragEvent, item: GcContentItem) => {
        e.dataTransfer.setData('application/react-dnd', 'warehouse-move');
        e.dataTransfer.effectAllowed = 'move';
        
        let totalQty = 0;
        let itemCount = 0;

        if (selectedIds.has(item.id)) {
            items.forEach(i => {
                if (selectedIds.has(i.id)) {
                    totalQty += Number(i.qty) || 0;
                    itemCount++;
                }
            });
        } else {
            totalQty = Number(item.qty) || 0;
            itemCount = 1;
        }

        const dragImage = document.createElement('div');
        dragImage.className = 'bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-xl text-xs font-bold flex items-center gap-2';
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        dragImage.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg> ${itemCount} Item${itemCount > 1 ? 's' : ''} (${totalQty} Slots)`;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    // Filter and sort items
    const filteredItems = items
        .filter(item => {
            if (!searchFilter) return true;
            const search = searchFilter.toLowerCase();
            return (
                item.contents?.toLowerCase().includes(search) ||
                item.packing?.toLowerCase().includes(search) ||
                item.prefix?.toLowerCase().includes(search)
            );
        })
        .sort((a, b) => {
            if (sortBy === 'qty') {
                const diff = (Number(a.qty) || 0) - (Number(b.qty) || 0);
                return sortOrder === 'asc' ? diff : -diff;
            }
            if (sortBy === 'weight') {
                const diff = (Number(a.weight) || 0) - (Number(b.weight) || 0);
                return sortOrder === 'asc' ? diff : -diff;
            }
            return 0;
        });

    const allSelected = items.length > 0 && selectedIds.size === items.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;
    
    const totalSelectedQty = items
        .filter(i => selectedIds.has(i.id))
        .reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

    const totalQty = items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

    const toggleSort = (field: 'qty' | 'weight') => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    return (
        <div className="flex flex-col h-full bg-card">
            {/* Header - Responsive */}
            <div className="p-2.5 sm:p-3 md:p-4 border-b border-border bg-card">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <PackageOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xs sm:text-sm font-bold text-foreground">Pending Stock</h2>
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground hidden xs:block">Drag items to warehouse grid</p>
                        </div>
                    </div>
                    {items.length > 0 && (
                        <div className="text-right">
                            <span className="text-base sm:text-lg font-bold text-primary">{items.length}</span>
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground">Items</p>
                        </div>
                    )}
                </div>
                
                {/* GC Selector */}
                <AsyncAutocomplete
                    label="Select GC Number"
                    loadOptions={loadGcOptions}
                    value={gcOption}
                    onChange={handleGcChange}
                    placeholder="Search GC..."
                    defaultOptions={true}
                />
            </div>

            {/* Stats Bar - Only show when items exist */}
            {items.length > 0 && (
                <div className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-muted/30 border-b border-border">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Select All */}
                            <button
                                onClick={() => onSelectAll(!allSelected)}
                                className={`
                                    flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium transition-colors
                                    ${allSelected || someSelected 
                                        ? 'bg-primary/10 text-primary' 
                                        : 'text-muted-foreground hover:bg-muted'
                                    }
                                `}
                            >
                                {allSelected ? (
                                    <CheckSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                ) : someSelected ? (
                                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-primary rounded bg-primary/30" />
                                ) : (
                                    <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                )}
                                <span className="hidden xs:inline">{allSelected ? 'Deselect' : 'Select All'}</span>
                                <span className="xs:hidden">{allSelected ? 'All' : 'All'}</span>
                            </button>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`
                                    flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium transition-colors
                                    ${isFilterOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}
                                `}
                            >
                                <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden xs:inline">Filter</span>
                            </button>
                        </div>

                        {/* Selection Info */}
                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary/10 rounded-md">
                                <span className="text-[10px] sm:text-xs font-medium text-primary">
                                    {selectedIds.size} selected
                                </span>
                                <span className="text-[9px] sm:text-[10px] text-primary/70 hidden xs:inline">
                                    ({totalSelectedQty} slots)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Filter/Sort Options */}
                    {isFilterOpen && (
                        <div className="mt-2 pt-2 border-t border-border space-y-2">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 w-3 sm:w-3.5 h-3 sm:h-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search contents..."
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    className="w-full h-7 sm:h-8 pl-7 sm:pl-8 pr-2 sm:pr-3 text-[11px] sm:text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {/* Sort Buttons */}
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground">Sort:</span>
                                <button
                                    onClick={() => toggleSort('qty')}
                                    className={`
                                        flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-medium transition-colors
                                        ${sortBy === 'qty' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}
                                    `}
                                >
                                    Qty
                                    {sortBy === 'qty' && (sortOrder === 'asc' ? <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />)}
                                </button>
                                <button
                                    onClick={() => toggleSort('weight')}
                                    className={`
                                        flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-medium transition-colors
                                        ${sortBy === 'weight' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}
                                    `}
                                >
                                    Weight
                                    {sortBy === 'weight' && (sortOrder === 'asc' ? <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />)}
                                </button>
                                {sortBy !== 'default' && (
                                    <button
                                        onClick={() => setSortBy('default')}
                                        className="text-[9px] sm:text-[10px] text-muted-foreground hover:text-foreground underline"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content List - Responsive */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                {!selectedGcId ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-3 sm:px-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted/50 flex items-center justify-center mb-2 sm:mb-3">
                            <Search className="w-5 h-5 sm:w-7 sm:h-7 text-muted-foreground/50" />
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Select a GC Number</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-0.5 sm:mt-1">Use the dropdown above to load pending items</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-3 sm:px-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted/50 flex items-center justify-center mb-2 sm:mb-3">
                            <Package className="w-5 h-5 sm:w-7 sm:h-7 text-muted-foreground/50" />
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                            {searchFilter ? 'No matching items' : 'No pending items'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-0.5 sm:mt-1">
                            {searchFilter ? 'Try a different search term' : 'All items have been allocated'}
                        </p>
                    </div>
                ) : (
                    filteredItems.map(item => {
                        const isSelected = selectedIds.has(item.id);
                        return (
                            <div
                                key={item.id}
                                draggable="true"
                                onDragStart={(e) => handleDragStart(e, item)}
                                className={`
                                    relative group rounded-lg border-2 transition-all duration-200 
                                    cursor-grab active:cursor-grabbing active:scale-[0.98]
                                    ${isSelected 
                                        ? 'bg-primary/5 border-primary shadow-sm ring-2 ring-primary/20' 
                                        : 'bg-card border-border hover:border-primary/40 hover:shadow-md'
                                    }
                                `}
                            >
                                {/* Drag Handle - Hidden on mobile touch */}
                                <div className="absolute left-0 top-0 bottom-0 w-5 sm:w-6 hidden sm:flex items-center justify-center rounded-l-lg bg-muted/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                                </div>

                                <div className="p-2.5 sm:p-3 sm:pl-4">
                                    {/* Top Row */}
                                    <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                                            {/* Selection Checkbox */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
                                                className="shrink-0 p-0.5"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                                ) : (
                                                    <Square className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/40 hover:text-primary transition-colors" />
                                                )}
                                            </button>

                                            {/* Prefix Badge */}
                                            <span className="shrink-0 text-[9px] sm:text-[10px] font-bold text-primary bg-primary/10 px-1 sm:px-1.5 py-0.5 rounded">
                                                {item.prefix || 'PKG'}
                                            </span>

                                            {/* Contents */}
                                            <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                                {item.contents}
                                            </span>
                                        </div>

                                        {/* Assist Button */}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onAssist(item); }}
                                            className={`
                                                shrink-0 p-1 sm:p-1.5 rounded-lg transition-all
                                                ${isSelected 
                                                    ? 'bg-amber-100 text-amber-600' 
                                                    : 'text-muted-foreground/50 hover:bg-amber-50 hover:text-amber-500'
                                                }
                                            `}
                                            title="Find best spot"
                                        >
                                            <Lightbulb className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSelected ? 'fill-amber-200' : ''}`} />
                                        </button>
                                    </div>

                                    {/* Details Grid - Responsive */}
                                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                                        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 bg-muted/50 rounded-md">
                                            <Boxes className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground shrink-0" />
                                            <span className="text-muted-foreground hidden xs:inline">Qty:</span>
                                            <span className="font-bold text-foreground">{item.qty}</span>
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 bg-muted/50 rounded-md overflow-hidden">
                                            <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground shrink-0" />
                                            <span className="truncate text-foreground">{item.packing}</span>
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 bg-muted/50 rounded-md">
                                            <Weight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground shrink-0" />
                                            <span className="font-medium text-foreground truncate">{item.weight || '-'}<span className="hidden xs:inline"> kg</span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer Summary - Responsive */}
            {items.length > 0 && (
                <div className="p-2 sm:p-3 border-t border-border bg-muted/30">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
                        <span className="text-muted-foreground">
                            Total: <span className="font-semibold text-foreground">{items.length} items</span>
                        </span>
                        <span className="text-muted-foreground">
                            Slots needed: <span className="font-bold text-primary">{totalQty}</span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
