import React, { useMemo, useState, useEffect } from 'react';
import type { WarehouseRoom, WarehouseSlot } from '../../../types';
import { 
    Box, 
    ChevronDown, 
    Maximize2, 
    Minimize2, 
    RotateCcw, 
    ZoomIn, 
    ZoomOut,
    Warehouse,
    Grid3X3,
    AlertCircle,
    X,
    MousePointer2,
    Trash2,
    CheckSquare
} from 'lucide-react';

interface WarehouseGridPanelProps {
    rooms: WarehouseRoom[];
    currentRoomId: string;
    onRoomChange: (roomId: string) => void;
    slots: WarehouseSlot[];
    suggestedSlotId: string | null;
    onDrop: (slotId: string) => void;
    onSlotClick?: (slot: WarehouseSlot) => void;
    // NEW: Optional props for removal features
    onRemoveSlot?: (slotId: string) => void;
    onRemoveSlots?: (slotIds: string[]) => void;
    onClearRoom?: () => void;
    // Search matches passed from parent
    searchMatches?: Set<string>;
}

// =====================================================
// NEW FEATURE: Slot Detail Modal Component (Compact)
// =====================================================
interface SlotDetailModalProps {
    slot: WarehouseSlot | null;
    onClose: () => void;
    onRemove?: (slotId: string) => void;
}

const SlotDetailModal = ({ slot, onClose, onRemove }: SlotDetailModalProps) => {
    if (!slot) return null;

    const handleRemove = () => {
        if (onRemove) {
            onRemove(slot.id);
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/40"
            onClick={onClose}
        >
            <div 
                className="bg-card rounded-lg shadow-xl border border-border w-full max-w-[280px] sm:max-w-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
            >
                {/* Header - Compact */}
                <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 border-b border-border bg-muted/40">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                        <span className="font-semibold text-xs sm:text-sm text-foreground">{slot.id}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-0.5 sm:p-1 rounded hover:bg-muted transition-colors"
                    >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Content - Compact Grid */}
                <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
                    {/* Row 1: GC & Label */}
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        <div className="bg-muted/40 rounded px-1.5 sm:px-2 py-1 sm:py-1.5">
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground block">GC Number</span>
                            <span className="text-xs sm:text-sm font-bold text-foreground">{slot.gcNo || 'N/A'}</span>
                        </div>
                        <div className="bg-muted/40 rounded px-1.5 sm:px-2 py-1 sm:py-1.5">
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground block">Label</span>
                            <span className="text-xs sm:text-sm font-semibold text-foreground">{slot.displayLabel || 'PKG'}</span>
                        </div>
                    </div>

                    {/* Row 2: Contents & Packing */}
                    {(slot.contents || slot.packing) && (
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                            {slot.contents && (
                                <div className="bg-muted/40 rounded px-1.5 sm:px-2 py-1 sm:py-1.5">
                                    <span className="text-[9px] sm:text-[10px] text-muted-foreground block">Contents</span>
                                    <span className="text-xs sm:text-sm font-medium text-foreground truncate block">{slot.contents}</span>
                                </div>
                            )}
                            {slot.packing && (
                                <div className="bg-muted/40 rounded px-1.5 sm:px-2 py-1 sm:py-1.5">
                                    <span className="text-[9px] sm:text-[10px] text-muted-foreground block">Packing</span>
                                    <span className="text-xs sm:text-sm font-medium text-foreground">{slot.packing}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Row 3: Position & Time */}
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        <div className="bg-muted/40 rounded px-1.5 sm:px-2 py-1 sm:py-1.5">
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground block">Position</span>
                            <span className="text-xs sm:text-sm font-medium text-foreground">R{slot.rowId} C{slot.colId}</span>
                        </div>
                        {slot.allocatedAt && (
                            <div className="bg-muted/40 rounded px-1.5 sm:px-2 py-1 sm:py-1.5">
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground block">Allocated</span>
                                <span className="text-[10px] sm:text-xs font-medium text-foreground">
                                    {new Date(slot.allocatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions - Compact */}
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 border-t border-border bg-muted/20">
                    <button
                        onClick={onClose}
                        className="flex-1 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded transition-colors"
                    >
                        Close
                    </button>
                    {onRemove && (
                        <button
                            onClick={handleRemove}
                            className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-destructive hover:bg-destructive/90 rounded transition-colors"
                        >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            Remove
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// =====================================================
// NEW FEATURE: Confirmation Modal Component
// =====================================================
interface ConfirmModalProps {
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning';
}

const ConfirmModal = ({ open, title, message, confirmText, onConfirm, onCancel, variant = 'danger' }: ConfirmModalProps) => {
    if (!open) return null;

    return (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
        >
            <div 
                className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-[300px] sm:max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 sm:p-5 text-center">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full flex items-center justify-center mb-3 sm:mb-4 ${
                        variant === 'danger' ? 'bg-destructive/10' : 'bg-amber-100'
                    }`}>
                        <AlertCircle className={`w-6 h-6 sm:w-7 sm:h-7 ${
                            variant === 'danger' ? 'text-destructive' : 'text-amber-600'
                        }`} />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 sm:mb-2">{title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{message}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-t border-border bg-muted/20">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white rounded-lg transition-colors ${
                            variant === 'danger' 
                                ? 'bg-destructive hover:bg-destructive/90' 
                                : 'bg-amber-500 hover:bg-amber-600'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// =====================================================
// MAIN COMPONENT
// =====================================================
export const WarehouseGridPanel = ({
    rooms,
    currentRoomId,
    onRoomChange,
    slots,
    suggestedSlotId,
    onDrop,
    onSlotClick,
    onRemoveSlot,
    onRemoveSlots,
    onClearRoom,
    searchMatches: externalSearchMatches
}: WarehouseGridPanelProps) => {

    const currentRoom = rooms.find(r => r.id === currentRoomId);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

    // Use external search matches if provided, otherwise empty set
    const searchMatches = externalSearchMatches || new Set<string>();

    // NEW: Selection Mode State
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

    // NEW: Modal State
    const [detailModalSlot, setDetailModalSlot] = useState<WarehouseSlot | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        confirmText: string;
        onConfirm: () => void;
        variant?: 'danger' | 'warning';
    }>({ open: false, title: '', message: '', confirmText: '', onConfirm: () => {} });

    // Calculate Capacity Stats (EXISTING)
    const stats = useMemo(() => {
        if (!currentRoom) return { total: 0, occupied: 0, free: 0, percent: 0 };
        const total = currentRoom.capacity;
        const occupied = slots.filter(s => s.status === 'occupied').length;
        const free = total - occupied;
        const percent = Math.round((free / total) * 100);
        return { total, occupied, free, percent };
    }, [slots, currentRoom]);

    // NEW: Selection mode handlers
    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode);
        if (isSelectMode) {
            setSelectedSlots(new Set());
        }
    };

    const toggleSlotSelection = (slotId: string) => {
        setSelectedSlots(prev => {
            const next = new Set(prev);
            if (next.has(slotId)) {
                next.delete(slotId);
            } else {
                next.add(slotId);
            }
            return next;
        });
    };

    const clearSelection = () => {
        setSelectedSlots(new Set());
    };

    // NEW: Removal handlers
    const handleRemoveSelected = () => {
        if (selectedSlots.size === 0) return;

        setConfirmModal({
            open: true,
            title: 'Remove Selected Items',
            message: `Are you sure you want to remove ${selectedSlots.size} item${selectedSlots.size > 1 ? 's' : ''} from the warehouse?`,
            confirmText: `Remove ${selectedSlots.size} Item${selectedSlots.size > 1 ? 's' : ''}`,
            variant: 'danger',
            onConfirm: () => {
                if (onRemoveSlots) {
                    onRemoveSlots(Array.from(selectedSlots));
                }
                setSelectedSlots(new Set());
                setIsSelectMode(false);
                setConfirmModal(prev => ({ ...prev, open: false }));
            }
        });
    };

    const handleClearRoom = () => {
        const occupiedCount = slots.filter(s => s.status === 'occupied').length;
        if (occupiedCount === 0) return;

        setConfirmModal({
            open: true,
            title: 'Clear Entire Room',
            message: `Are you sure you want to clear all ${occupiedCount} item${occupiedCount > 1 ? 's' : ''} from ${currentRoom?.name}?`,
            confirmText: 'Clear All',
            variant: 'warning',
            onConfirm: () => {
                if (onClearRoom) {
                    onClearRoom();
                }
                setConfirmModal(prev => ({ ...prev, open: false }));
            }
        });
    };

    // MODIFIED: Slot click handler (enhanced for new features)
    const handleSlotClick = (slot: WarehouseSlot) => {
        if (isSelectMode && slot.status === 'occupied') {
            toggleSlotSelection(slot.id);
        } else if (slot.status === 'occupied') {
            // NEW: Open detail modal for occupied slots
            setDetailModalSlot(slot);
        } else if (onSlotClick) {
            // EXISTING: Pass through to original handler for empty slots
            onSlotClick(slot);
        }
    };

    // EXISTING: Drag handlers (unchanged)
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDropOnSlot = (e: React.DragEvent, slotId: string) => {
        e.preventDefault();
        onDrop(slotId);
    };

    // EXISTING: Zoom handlers (unchanged)
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 20, 150));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 20, 60));
    const handleResetZoom = () => setZoomLevel(100);

    // EXISTING: Color helpers (unchanged)
    const getStatusColor = (percent: number) => {
        if (percent >= 50) return 'text-emerald-600';
        if (percent >= 20) return 'text-amber-600';
        return 'text-destructive';
    };

    const getProgressColor = (percent: number) => {
        if (percent >= 50) return 'bg-emerald-500';
        if (percent >= 20) return 'bg-amber-500';
        return 'bg-destructive';
    };

    // NEW: Clear selection when room changes
    useEffect(() => {
        setSelectedSlots(new Set());
    }, [currentRoomId]);

    return (
        <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
            {/* Header - Responsive */}
            <div className="bg-card border-b border-border p-2.5 sm:p-3 md:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                    {/* Left Section */}
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                        {/* Room Selector */}
                        <div className="relative flex items-center gap-1.5 sm:gap-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Warehouse className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                            </div>
                            <div className="relative">
                                <select
                                    value={currentRoomId}
                                    onChange={(e) => onRoomChange(e.target.value)}
                                    className="appearance-none bg-transparent text-foreground font-bold text-sm sm:text-base md:text-lg pr-5 sm:pr-6 focus:outline-none cursor-pointer hover:text-primary transition-colors max-w-[140px] sm:max-w-none truncate"
                                >
                                    {rooms.map(room => (
                                        <option key={room.id} value={room.id}>{room.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="hidden md:block h-8 w-px bg-border" />

                        {/* Capacity Stats - Desktop */}
                        <div className="hidden md:flex flex-col">
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Available</span>
                            <div className="flex items-baseline gap-1 sm:gap-1.5">
                                <span className={`text-lg sm:text-xl font-bold ${getStatusColor(stats.percent)}`}>
                                    {stats.free}
                                </span>
                                <span className="text-[10px] sm:text-xs text-muted-foreground">/ {stats.total}</span>
                                <span className={`text-[10px] sm:text-xs font-medium ${getStatusColor(stats.percent)}`}>
                                    ({stats.percent}%)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                        {/* Mobile Stats */}
                        <div className="md:hidden flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted/50 rounded-lg">
                            <span className={`text-xs sm:text-sm font-bold ${getStatusColor(stats.percent)}`}>{stats.free}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">free</span>
                        </div>

                        {/* Progress Bar - Desktop */}
                        <div className="hidden lg:flex items-center gap-2">
                            <div className="w-24 xl:w-32 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(stats.percent)}`}
                                    style={{ width: `${100 - stats.percent}%` }}
                                />
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground">{stats.occupied} used</span>
                        </div>

                        <div className="h-5 sm:h-6 w-px bg-border hidden xs:block" />

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5 sm:p-1">
                            <button
                                onClick={handleZoomOut}
                                disabled={zoomLevel <= 60}
                                className="p-1 sm:p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                            </button>
                            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground min-w-[32px] sm:min-w-[40px] text-center">
                                {zoomLevel}%
                            </span>
                            <button
                                onClick={handleZoomIn}
                                disabled={zoomLevel >= 150}
                                className="p-1 sm:p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                            </button>
                            <button
                                onClick={handleResetZoom}
                                className="p-1 sm:p-1.5 rounded-md hover:bg-muted transition-colors hidden xs:block"
                                title="Reset Zoom"
                            >
                                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Fullscreen Toggle */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors"
                            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? (
                                <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                            ) : (
                                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Legend Row - Responsive */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border">
                    {/* Legend */}
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">Legend:</span>
                        <div className="flex items-center gap-1 sm:gap-1.5">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-card border-2 border-border" />
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground">Empty</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-destructive/20 border-2 border-destructive/40" />
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground">Occupied</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-amber-100 border-2 border-amber-400 animate-pulse" />
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground">Suggested</span>
                        </div>
                        {/* Search Match indicator */}
                        {searchMatches.size > 0 && (
                            <div className="flex items-center gap-1 sm:gap-1.5">
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-blue-100 border-2 border-blue-500" />
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground">Match</span>
                            </div>
                        )}
                        {/* Selected indicator */}
                        {isSelectMode && (
                            <div className="flex items-center gap-1 sm:gap-1.5">
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-red-100 border-2 border-red-500" />
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground">Selected</span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        {/* Select Mode Toggle */}
                        <button
                            onClick={toggleSelectMode}
                            className={`
                                flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all
                                ${isSelectMode 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }
                            `}
                        >
                            <MousePointer2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="hidden xs:inline">{isSelectMode ? 'Exit Select' : 'Select Mode'}</span>
                            <span className="xs:hidden">{isSelectMode ? 'Exit' : 'Select'}</span>
                        </button>

                        {/* Selection Actions */}
                        {isSelectMode && selectedSlots.size > 0 && (
                            <>
                                <div className="h-4 w-px bg-border hidden xs:block" />
                                <span className="text-[9px] sm:text-[10px] font-medium text-red-600 bg-red-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                    {selectedSlots.size} selected
                                </span>
                                <button
                                    onClick={handleRemoveSelected}
                                    className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-medium text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    <span className="hidden xs:inline">Remove</span>
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                >
                                    Clear
                                </button>
                            </>
                        )}

                        {/* Clear Room Button */}
                        {stats.occupied > 0 && onClearRoom && !isSelectMode && (
                            <button
                                onClick={handleClearRoom}
                                className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-medium text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Clear entire room"
                            >
                                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline">Clear Room</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Grid Area - Responsive */}
            <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 bg-muted/20">
                {currentRoom ? (
                    <div 
                        className="mx-auto transition-transform duration-200 origin-top-left"
                        style={{ 
                            transform: `scale(${zoomLevel / 100})`,
                            maxWidth: currentRoom.columns * 110
                        }}
                    >
                        {/* Column Headers - Responsive */}
                        <div 
                            className="grid gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2 pl-6 sm:pl-8 md:pl-10"
                            style={{ gridTemplateColumns: `repeat(${currentRoom.columns}, minmax(50px, 1fr))` }}
                        >
                            {Array.from({ length: currentRoom.columns }, (_, i) => (
                                <div key={i} className="text-center text-[8px] sm:text-[9px] md:text-[10px] font-bold text-muted-foreground">
                                    C{(i + 1).toString().padStart(2, '0')}
                                </div>
                            ))}
                        </div>

                        {/* Grid with Row Headers - Responsive */}
                        {Array.from({ length: currentRoom.rows }, (_, rowIndex) => (
                            <div key={rowIndex} className="flex gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                                {/* Row Header */}
                                <div className="w-5 sm:w-6 md:w-8 flex items-center justify-center text-[8px] sm:text-[9px] md:text-[10px] font-bold text-muted-foreground shrink-0">
                                    R{(rowIndex + 1).toString().padStart(2, '0')}
                                </div>
                                
                                {/* Row Slots - Responsive */}
                                <div 
                                    className="grid gap-1 sm:gap-1.5 md:gap-2 flex-1"
                                    style={{ gridTemplateColumns: `repeat(${currentRoom.columns}, minmax(50px, 1fr))` }}
                                >
                                    {slots
                                        .filter(slot => slot.rowId === rowIndex + 1)
                                        .sort((a, b) => a.colId - b.colId)
                                        .map(slot => {
                                            const isSuggested = slot.id === suggestedSlotId;
                                            const isOccupied = slot.status === 'occupied';
                                            const isHovered = hoveredSlot === slot.id;
                                            // NEW: Additional states
                                            const isSearchMatch = searchMatches.has(slot.id);
                                            const isSelected = selectedSlots.has(slot.id);

                                            return (
                                                <div
                                                    key={slot.id}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDropOnSlot(e, slot.id)}
                                                    onMouseEnter={() => setHoveredSlot(slot.id)}
                                                    onMouseLeave={() => setHoveredSlot(null)}
                                                    onClick={() => handleSlotClick(slot)}
                                                    className={`
                                                        relative aspect-square rounded-md sm:rounded-lg border-2 
                                                        flex flex-col items-center justify-center p-1 sm:p-1.5
                                                        transition-all duration-200 cursor-pointer
                                                        ${isSelected
                                                            ? 'bg-red-50 border-red-500 ring-2 ring-red-300 shadow-md'
                                                            : isSearchMatch
                                                                ? 'bg-blue-50 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                                                                : isOccupied 
                                                                    ? 'bg-destructive/10 border-destructive/30 hover:border-destructive/50' 
                                                                    : isSuggested 
                                                                        ? 'bg-amber-50 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-pulse ring-2 ring-amber-400/30' 
                                                                        : isHovered
                                                                            ? 'bg-primary/5 border-primary/50 shadow-md'
                                                                            : 'bg-card border-border hover:border-primary/30 hover:shadow-sm'
                                                        }
                                                    `}
                                                >
                                                    {/* Selection Checkbox Indicator */}
                                                    {isSelectMode && isOccupied && (
                                                        <div className={`
                                                            absolute top-0.5 sm:top-1 right-0.5 sm:right-1 w-3 h-3 sm:w-4 sm:h-4 rounded flex items-center justify-center transition-colors
                                                            ${isSelected 
                                                                ? 'bg-red-500 text-white' 
                                                                : 'bg-muted/60 text-muted-foreground'
                                                            }
                                                        `}>
                                                            {isSelected && <CheckSquare className="w-2 h-2 sm:w-3 sm:h-3" />}
                                                        </div>
                                                    )}

                                                    {/* Slot Label */}
                                                    <span className={`
                                                        absolute top-0.5 sm:top-1 left-0.5 sm:left-1.5 text-[6px] sm:text-[7px] md:text-[8px] font-mono font-medium
                                                        ${isSelected 
                                                            ? 'text-red-600'
                                                            : isSearchMatch 
                                                                ? 'text-blue-600' 
                                                                : isOccupied 
                                                                    ? 'text-destructive/60' 
                                                                    : isSuggested 
                                                                        ? 'text-amber-600' 
                                                                        : 'text-muted-foreground/50'
                                                        }
                                                    `}>
                                                        {slot.colId}
                                                    </span>

                                                    {/* Content */}
                                                    {isOccupied ? (
                                                        <div className={`flex flex-col items-center ${
                                                            isSelected ? 'text-red-600' : isSearchMatch ? 'text-blue-600' : 'text-destructive'
                                                        }`}>
                                                            <Box className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mb-0.5 ${
                                                                isSelected ? 'fill-red-200' : isSearchMatch ? 'fill-blue-200' : 'fill-destructive/20'
                                                            }`} />
                                                            <span className="text-[7px] sm:text-[8px] md:text-[9px] font-bold text-center leading-tight line-clamp-2">
                                                                {slot.displayLabel || 'PKG'}
                                                            </span>
                                                            {slot.gcNo && (
                                                                <span className={`text-[6px] sm:text-[7px] md:text-[8px] mt-0.5 ${
                                                                    isSelected ? 'text-red-500' : isSearchMatch ? 'text-blue-500' : 'text-destructive/60'
                                                                }`}>
                                                                    GC#{slot.gcNo}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : isSuggested ? (
                                                        <div className="flex flex-col items-center text-amber-600">
                                                            <Grid3X3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mb-0.5" />
                                                            <span className="text-[7px] sm:text-[8px] md:text-[9px] font-bold">Drop Here</span>
                                                        </div>
                                                    ) : (
                                                        <div className={`
                                                            flex flex-col items-center transition-opacity
                                                            ${isHovered ? 'opacity-100' : 'opacity-30'}
                                                        `}>
                                                            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rounded border-2 border-dashed border-current mb-0.5" />
                                                            <span className="text-[7px] sm:text-[8px] md:text-[9px] text-muted-foreground">Empty</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-3 opacity-30" />
                        <p className="text-xs sm:text-sm font-medium">No room selected</p>
                        <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">Select a room from the dropdown above</p>
                    </div>
                )}
            </div>

            {/* Hover Tooltip */}
            {hoveredSlot && !isSelectMode && (
                <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-foreground text-background text-[10px] sm:text-xs font-medium rounded-lg shadow-lg z-50">
                    Slot: {hoveredSlot}
                </div>
            )}

            {/* Select Mode Tooltip */}
            {isSelectMode && (
                <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-primary-foreground text-[10px] sm:text-xs font-medium rounded-lg shadow-lg z-50 flex items-center gap-1.5 sm:gap-2">
                    <MousePointer2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Click occupied slots to select for removal</span>
                    <span className="xs:hidden">Tap slots to select</span>
                </div>
            )}

            {/* Slot Detail Modal */}
            <SlotDetailModal
                slot={detailModalSlot}
                onClose={() => setDetailModalSlot(null)}
                onRemove={onRemoveSlot}
            />

            {/* Confirmation Modal */}
            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                variant={confirmModal.variant}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
            />
        </div>
    );
};
