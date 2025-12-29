import { useState, useEffect, useCallback } from 'react';
import { PendingStockPanel } from './PendingStockPanel';
import { WarehouseGridPanel } from './WarehouseGridPanel';
import type { GcContentItem, WarehouseRoom, WarehouseSlot } from '../../../types';
import { useData } from '../../../hooks/useData';
import { useToast } from '../../../contexts/ToastContext';
import { ConfirmationDialog } from '../../../components/shared/ConfirmationDialog';
import { 
    Box, 
    PanelLeftClose, 
    PanelLeft, 
    ArrowRight, 
    ArrowDown,
    Undo2,
    Info,
    Search,
    X
} from 'lucide-react';

// --- MOCK DATA ---
const MOCK_ROOMS: WarehouseRoom[] = [
    { id: 'room-a', name: 'Room A - Main Storage', shortCode: 'A', rows: 10, columns: 10, capacity: 100 },
    { id: 'room-b', name: 'Room B - Overflow', shortCode: 'B', rows: 8, columns: 12, capacity: 96 },
    { id: 'room-c', name: 'Room C - Cold Storage', shortCode: 'C', rows: 6, columns: 8, capacity: 48 },
];

const generateSlots = (room: WarehouseRoom): WarehouseSlot[] => {
    const slots: WarehouseSlot[] = [];
    for (let r = 1; r <= room.rows; r++) {
        for (let c = 1; c <= room.columns; c++) {
            slots.push({
                id: `${room.shortCode}-R${r.toString().padStart(2, '0')}-C${c.toString().padStart(2, '0')}`,
                roomId: room.id,
                rowId: r,
                colId: c,
                status: 'empty',
            });
        }
    }
    return slots;
};

// History entry for undo functionality
interface HistoryEntry {
    type: 'allocation' | 'removal';
    roomId: string;
    slots: WarehouseSlot[];
    items: GcContentItem[];
    timestamp: number;
    description?: string;
}

export const WarehouseManagementPage = () => {
    const toast = useToast();
    const { fetchGcById } = useData();

    // State
    const [selectedGcId, setSelectedGcId] = useState<string>('');
    const [pendingItems, setPendingItems] = useState<GcContentItem[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    
    // Warehouse State
    const [rooms] = useState<WarehouseRoom[]>(MOCK_ROOMS);
    const [currentRoomId, setCurrentRoomId] = useState<string>(MOCK_ROOMS[0].id);
    const [allSlots, setAllSlots] = useState<Map<string, WarehouseSlot[]>>(() => {
        const map = new Map();
        MOCK_ROOMS.forEach(room => map.set(room.id, generateSlots(room)));
        return map;
    });
    const [suggestedSlotId, setSuggestedSlotId] = useState<string | null>(null);

    // UI State
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMatches, setSearchMatches] = useState<Set<string>>(new Set());

    // Modal State
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkConfig, setBulkConfig] = useState<{ startSlotId: string, items: GcContentItem[] } | null>(null);
    const [fillMode, setFillMode] = useState<'horizontal' | 'vertical'>('horizontal');

    // Get current room's slots
    const currentSlots = allSlots.get(currentRoomId) || [];

    // --- Load Data ---
    useEffect(() => {
        if (!selectedGcId) {
            setPendingItems([]);
            return;
        }
        const loadGcItems = async () => {
            const gc = await fetchGcById(selectedGcId);
            if (gc && gc.contentItems) {
                setPendingItems(gc.contentItems);
            }
        };
        loadGcItems();
    }, [selectedGcId, fetchGcById]);

    // --- Logic Helpers ---
    
    /**
     * FIXED: Find available slots - does NOT require consecutive slots
     * It finds ANY empty slots starting from the given slot
     */
    const findAvailableSlots = useCallback((
        startSlotId: string, 
        totalQtyNeeded: number, 
        mode: 'horizontal' | 'vertical', 
        slots: WarehouseSlot[]
    ) => {
        const foundSlots: string[] = [];
        const startIndex = slots.findIndex(s => s.id === startSlotId);
        if (startIndex === -1) return [];

        const startSlot = slots[startIndex];
        const room = rooms.find(r => r.id === startSlot.roomId);
        if (!room) return [];

        if (mode === 'horizontal') {
            // Horizontal: Fill row by row starting from drop position
            // First, try from start index to end
            for (let i = startIndex; i < slots.length && foundSlots.length < totalQtyNeeded; i++) {
                if (slots[i].status === 'empty') {
                    foundSlots.push(slots[i].id);
                }
            }
            // If still need more, wrap around to beginning
            if (foundSlots.length < totalQtyNeeded) {
                for (let i = 0; i < startIndex && foundSlots.length < totalQtyNeeded; i++) {
                    if (slots[i].status === 'empty') {
                        foundSlots.push(slots[i].id);
                    }
                }
            }
        } else {
            // Vertical: Fill column by column
            // Start from the drop position's column, then move to next columns
            let currCol = startSlot.colId;
            let startRow = startSlot.rowId;
            let firstColumn = true;

            while (foundSlots.length < totalQtyNeeded && currCol <= room.columns) {
                // For first column, start from the drop row; for others, start from row 1
                const rowStart = firstColumn ? startRow : 1;
                
                for (let r = rowStart; r <= room.rows && foundSlots.length < totalQtyNeeded; r++) {
                    const slot = slots.find(s => s.rowId === r && s.colId === currCol);
                    if (slot && slot.status === 'empty') {
                        foundSlots.push(slot.id);
                    }
                }
                
                // If first column didn't start from row 1, fill rows above the start
                if (firstColumn && startRow > 1) {
                    for (let r = 1; r < startRow && foundSlots.length < totalQtyNeeded; r++) {
                        const slot = slots.find(s => s.rowId === r && s.colId === currCol);
                        if (slot && slot.status === 'empty') {
                            foundSlots.push(slot.id);
                        }
                    }
                }
                
                currCol++;
                firstColumn = false;
            }
            
            // If still need more, check columns before the start column
            if (foundSlots.length < totalQtyNeeded) {
                for (let c = 1; c < startSlot.colId && foundSlots.length < totalQtyNeeded; c++) {
                    for (let r = 1; r <= room.rows && foundSlots.length < totalQtyNeeded; r++) {
                        const slot = slots.find(s => s.rowId === r && s.colId === c);
                        if (slot && slot.status === 'empty' && !foundSlots.includes(slot.id)) {
                            foundSlots.push(slot.id);
                        }
                    }
                }
            }
        }

        return foundSlots;
    }, [rooms]);

    /**
     * Count total empty slots in a room
     */
    const countEmptySlots = useCallback((slots: WarehouseSlot[]) => {
        return slots.filter(s => s.status === 'empty').length;
    }, []);

    /**
     * Find first empty slot in a room
     */
    const findFirstEmptySlot = useCallback((slots: WarehouseSlot[]) => {
        return slots.find(s => s.status === 'empty');
    }, []);

    // --- Handlers ---
    const handleGcSelect = (gcId: string) => {
        setSelectedGcId(gcId);
        setSelectedItemIds(new Set());
    };

    const toggleItemSelection = (id: string) => {
        setSelectedItemIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        setSuggestedSlotId(null);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) setSelectedItemIds(new Set(pendingItems.map(i => i.id)));
        else setSelectedItemIds(new Set());
        setSuggestedSlotId(null);
    };

    const handleRoomChange = (roomId: string) => {
        setCurrentRoomId(roomId);
        setSuggestedSlotId(null);
        // Clear search when changing rooms
        setSearchQuery('');
        setSearchMatches(new Set());
    };

    // --- Search Handler ---
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        
        if (!query.trim()) {
            setSearchMatches(new Set());
            return;
        }

        const searchLower = query.toLowerCase().trim();
        const matches = new Set<string>();

        currentSlots.forEach(slot => {
            if (slot.status === 'occupied') {
                const matchesSearch = 
                    slot.id.toLowerCase().includes(searchLower) ||
                    slot.gcNo?.toLowerCase().includes(searchLower) ||
                    slot.displayLabel?.toLowerCase().includes(searchLower) ||
                    slot.contents?.toLowerCase().includes(searchLower);
                
                if (matchesSearch) {
                    matches.add(slot.id);
                }
            }
        });

        setSearchMatches(matches);
    }, [currentSlots]);

    const clearSearch = () => {
        setSearchQuery('');
        setSearchMatches(new Set());
    };

    /**
     * FIXED: Assisted Allotment - Now checks TOTAL available slots, not consecutive
     */
    const handleAssist = (item: GcContentItem) => {
        setSelectedItemIds(new Set([item.id]));
        const requiredQty = Number(item.qty) || 1;
        
        // Count total empty slots in current room
        const totalEmpty = countEmptySlots(currentSlots);
        
        if (totalEmpty >= requiredQty) {
            // Find first empty slot as starting point
            const firstEmpty = findFirstEmptySlot(currentSlots);
            if (firstEmpty) {
                setSuggestedSlotId(firstEmpty.id);
                toast.success(`Found space! ${totalEmpty} slots available. Suggested start: ${firstEmpty.id}`);
                return;
            }
        }
        
        // Not enough space in current room - check other rooms
        let bestRoom: { room: WarehouseRoom, empty: number, firstSlot: WarehouseSlot } | null = null;
        
        for (const room of rooms) {
            if (room.id === currentRoomId) continue;
            
            const roomSlots = allSlots.get(room.id) || [];
            const emptyCount = countEmptySlots(roomSlots);
            
            if (emptyCount >= requiredQty) {
                const firstSlot = findFirstEmptySlot(roomSlots);
                if (firstSlot && (!bestRoom || emptyCount > bestRoom.empty)) {
                    bestRoom = { room, empty: emptyCount, firstSlot };
                }
            }
        }

        if (bestRoom) {
            toast.info(
                `Current room has only ${totalEmpty} slots. "${bestRoom.room.name}" has ${bestRoom.empty} available!`,
                { duration: 5000 }
            );
        } else {
            const totalAcrossRooms = rooms.reduce((sum, room) => {
                const slots = allSlots.get(room.id) || [];
                return sum + countEmptySlots(slots);
            }, 0);
            
            toast.error(
                `Not enough space! Need ${requiredQty} slots. Total available across all rooms: ${totalAcrossRooms}`,
                { duration: 5000 }
            );
        }
    };

    // DROP Logic
    const handleDrop = (targetSlotId: string) => {
        let itemsToMove: GcContentItem[] = [];
        
        if (selectedItemIds.size > 0) {
            itemsToMove = pendingItems.filter(i => selectedItemIds.has(i.id));
        } else {
            return;
        }

        const totalQty = itemsToMove.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
        if (totalQty === 0) return;

        // Check if enough space before opening modal
        const totalEmpty = countEmptySlots(currentSlots);
        if (totalEmpty < totalQty) {
            toast.error(`Not enough space! Need ${totalQty} slots, only ${totalEmpty} available in this room.`);
            return;
        }

        setBulkConfig({ startSlotId: targetSlotId, items: itemsToMove });
        setBulkModalOpen(true);
    };

    const handleSlotClick = (slot: WarehouseSlot) => {
        if (slot.status === 'occupied') {
            toast.info(`Slot ${slot.id}: ${slot.displayLabel || 'Package'} (GC#${slot.gcNo || 'N/A'})`);
        } else if (selectedItemIds.size > 0) {
            handleDrop(slot.id);
        }
    };

    const confirmAllocation = (mode: 'horizontal' | 'vertical', items: GcContentItem[], startId: string) => {
        const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
        const targetSlotIds = findAvailableSlots(startId, totalQty, mode, currentSlots);

        if (targetSlotIds.length < totalQty) {
            toast.error(`Not enough space! Needed ${totalQty} slots, found ${targetSlotIds.length}.`);
            return;
        }

        // Save history for undo
        setHistory(prev => [...prev.slice(-9), {
            type: 'allocation',
            roomId: currentRoomId,
            slots: [...currentSlots],
            items: [...pendingItems],
            timestamp: Date.now(),
            description: `Allocated ${totalQty} slots`
        }]);

        // Perform Allocation
        const newSlots = [...currentSlots];
        let slotIndex = 0;

        items.forEach(item => {
            const qty = Number(item.qty) || 0;
            for (let q = 0; q < qty; q++) {
                if (slotIndex < targetSlotIds.length) {
                    const slotId = targetSlotIds[slotIndex];
                    const slotArrIdx = newSlots.findIndex(s => s.id === slotId);
                    
                    if (slotArrIdx !== -1) {
                        newSlots[slotArrIdx] = {
                            ...newSlots[slotArrIdx],
                            status: 'occupied',
                            contentId: item.id,
                            displayLabel: item.prefix || 'PKG',
                            gcNo: selectedGcId,
                            contents: item.contents,
                            packing: item.packing,
                            allocatedAt: new Date().toISOString()
                        };
                    }
                    slotIndex++;
                }
            }
        });

        setAllSlots(prev => new Map(prev).set(currentRoomId, newSlots));
        
        const itemIdsToRemove = items.map(i => i.id);
        setPendingItems(prev => prev.filter(i => !itemIdsToRemove.includes(i.id)));
        setSelectedItemIds(new Set());
        setSuggestedSlotId(null);
        toast.success(`Successfully allocated ${totalQty} slots!`);
    };

    const handleUndo = () => {
        const lastEntry = history[history.length - 1];
        if (!lastEntry) {
            toast.error('Nothing to undo');
            return;
        }

        // Restore the slots for the room that was modified
        setAllSlots(prev => new Map(prev).set(lastEntry.roomId, lastEntry.slots));
        
        // If we're not on the room that was modified, switch to it
        if (lastEntry.roomId !== currentRoomId) {
            setCurrentRoomId(lastEntry.roomId);
        }
        
        // Restore pending items
        setPendingItems(lastEntry.items);
        setHistory(prev => prev.slice(0, -1));
        toast.success(`Undo: ${lastEntry.description || 'Action reversed'}`);
    };

    // --- NEW: Removal Handlers ---

    /**
     * Remove a single slot
     */
    const handleRemoveSlot = useCallback((slotId: string) => {
        const slotIndex = currentSlots.findIndex(s => s.id === slotId);
        if (slotIndex === -1) return;

        const slot = currentSlots[slotIndex];
        if (slot.status !== 'occupied') return;

        // Save history for undo
        setHistory(prev => [...prev.slice(-9), {
            type: 'removal',
            roomId: currentRoomId,
            slots: [...currentSlots],
            items: [...pendingItems],
            timestamp: Date.now(),
            description: `Removed item from ${slotId}`
        }]);

        // Clear the slot
        const newSlots = [...currentSlots];
        newSlots[slotIndex] = {
            ...newSlots[slotIndex],
            status: 'empty',
            contentId: undefined,
            displayLabel: undefined,
            gcNo: undefined,
            contents: undefined,
            packing: undefined,
            allocatedAt: undefined
        };

        setAllSlots(prev => new Map(prev).set(currentRoomId, newSlots));
        toast.success(`Removed item from slot ${slotId}`);
    }, [currentSlots, currentRoomId, pendingItems, toast]);

    /**
     * Remove multiple slots (bulk removal)
     */
    const handleRemoveSlots = useCallback((slotIds: string[]) => {
        if (slotIds.length === 0) return;

        // Save history for undo
        setHistory(prev => [...prev.slice(-9), {
            type: 'removal',
            roomId: currentRoomId,
            slots: [...currentSlots],
            items: [...pendingItems],
            timestamp: Date.now(),
            description: `Removed ${slotIds.length} items`
        }]);

        // Clear the slots
        const newSlots = currentSlots.map(slot => {
            if (slotIds.includes(slot.id) && slot.status === 'occupied') {
                return {
                    ...slot,
                    status: 'empty' as const,
                    contentId: undefined,
                    displayLabel: undefined,
                    gcNo: undefined,
                    contents: undefined,
                    packing: undefined,
                    allocatedAt: undefined
                };
            }
            return slot;
        });

        setAllSlots(prev => new Map(prev).set(currentRoomId, newSlots));
        toast.success(`Removed ${slotIds.length} item${slotIds.length > 1 ? 's' : ''} from warehouse`);
    }, [currentSlots, currentRoomId, pendingItems, toast]);

    /**
     * Clear entire room
     */
    const handleClearRoom = useCallback(() => {
        const occupiedCount = currentSlots.filter(s => s.status === 'occupied').length;
        if (occupiedCount === 0) {
            toast.info('Room is already empty');
            return;
        }

        // Save history for undo
        const currentRoom = rooms.find(r => r.id === currentRoomId);
        setHistory(prev => [...prev.slice(-9), {
            type: 'removal',
            roomId: currentRoomId,
            slots: [...currentSlots],
            items: [...pendingItems],
            timestamp: Date.now(),
            description: `Cleared ${currentRoom?.name}`
        }]);

        // Clear all slots in the room
        const newSlots = currentSlots.map(slot => ({
            ...slot,
            status: 'empty' as const,
            contentId: undefined,
            displayLabel: undefined,
            gcNo: undefined,
            contents: undefined,
            packing: undefined,
            allocatedAt: undefined
        }));

        setAllSlots(prev => new Map(prev).set(currentRoomId, newSlots));
        toast.success(`Cleared all ${occupiedCount} item${occupiedCount > 1 ? 's' : ''} from ${currentRoom?.name}`);
    }, [currentSlots, currentRoomId, rooms, pendingItems, toast]);

    // Calculate stats for display
    const roomStats = {
        total: currentSlots.length,
        empty: countEmptySlots(currentSlots),
        occupied: currentSlots.length - countEmptySlots(currentSlots)
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-background">
            {/* Pending Stock Panel - Mobile: Full width sheet, Desktop: Side panel */}
            <div 
                className={`
                    transition-all duration-300 ease-in-out border-r border-border bg-card flex flex-col
                    ${isPanelCollapsed 
                        ? 'w-0 min-w-0 overflow-hidden opacity-0' 
                        : 'w-full lg:w-[320px] xl:w-[360px] 2xl:w-[400px] lg:min-w-[280px] h-[40vh] lg:h-full'
                    }
                `}
            >
                <PendingStockPanel 
                    selectedGcId={selectedGcId}
                    onGcSelect={handleGcSelect}
                    items={pendingItems}
                    selectedIds={selectedItemIds}
                    onToggleSelect={toggleItemSelection}
                    onSelectAll={handleSelectAll}
                    onAssist={handleAssist}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-[60vh] lg:h-full">
                {/* Toolbar - Responsive */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-2 sm:px-3 py-2 bg-card border-b border-border">
                    {/* Left Section */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <button
                            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
                            title={isPanelCollapsed ? 'Show Panel' : 'Hide Panel'}
                        >
                            {isPanelCollapsed ? (
                                <PanelLeft className="w-4 h-4 text-muted-foreground" />
                            ) : (
                                <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
                            )}
                        </button>

                        {selectedItemIds.size > 0 && (
                            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-lg">
                                <span className="text-[10px] sm:text-xs font-medium text-primary">
                                    {selectedItemIds.size} item{selectedItemIds.size > 1 ? 's' : ''}
                                </span>
                                <span className="hidden xs:inline text-[9px] sm:text-[10px] text-primary/70">
                                    ({pendingItems.filter(i => selectedItemIds.has(i.id)).reduce((s, i) => s + Number(i.qty), 0)} slots)
                                </span>
                            </div>
                        )}

                        {/* Room Quick Stats */}
                        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md text-[10px]">
                            <span className="text-muted-foreground">Room:</span>
                            <span className="font-medium text-emerald-600">{roomStats.empty} free</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{roomStats.total}</span>
                        </div>
                    </div>

                    {/* Center - Search Box */}
                    <div className="flex items-center gap-1.5 sm:gap-2 order-last sm:order-none w-full sm:w-auto mt-2 sm:mt-0">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 w-3 sm:w-3.5 h-3 sm:h-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search slots..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full sm:w-40 md:w-52 h-7 sm:h-8 pl-7 sm:pl-8 pr-6 sm:pr-7 text-[11px] sm:text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted transition-colors"
                                >
                                    <X className="w-3 h-3 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                        {searchQuery && searchMatches.size > 0 && (
                            <span className="text-[9px] sm:text-[10px] text-primary font-medium whitespace-nowrap">
                                {searchMatches.size} found
                            </span>
                        )}
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {history.length > 0 && (
                            <button
                                onClick={handleUndo}
                                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <Undo2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                <span className="hidden xs:inline">Undo</span>
                                <span className="hidden sm:inline">({history.length})</span>
                            </button>
                        )}

                        <div className="hidden lg:flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/50 rounded-lg">
                            <Info className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-muted-foreground" />
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                                Drag items or click empty slot to allocate
                            </span>
                        </div>
                    </div>
                </div>

                {/* Warehouse Grid */}
                <div className="flex-1 overflow-hidden">
                    <WarehouseGridPanel 
                        rooms={rooms}
                        currentRoomId={currentRoomId}
                        onRoomChange={handleRoomChange}
                        slots={currentSlots}
                        suggestedSlotId={suggestedSlotId}
                        onDrop={handleDrop}
                        onSlotClick={handleSlotClick}
                        onRemoveSlot={handleRemoveSlot}
                        onRemoveSlots={handleRemoveSlots}
                        onClearRoom={handleClearRoom}
                        searchMatches={searchMatches}
                    />
                </div>
            </div>

            {/* Bulk Allotment Modal */}
            <ConfirmationDialog
                open={bulkModalOpen}
                onClose={() => setBulkModalOpen(false)}
                onConfirm={() => {
                    if (bulkConfig) confirmAllocation(fillMode, bulkConfig.items, bulkConfig.startSlotId);
                    setBulkModalOpen(false);
                }}
                title="Allocate Warehouse Slots"
                description=""
                confirmText="Confirm Allocation"
                variant="primary"
                ConfirmIcon={Box}
            >
                <div className="space-y-3 sm:space-y-4">
                    {/* Summary */}
                    <div className="p-2.5 sm:p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Items to allocate:</span>
                            <span className="font-bold text-foreground">{bulkConfig?.items.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm mt-1">
                            <span className="text-muted-foreground">Total slots needed:</span>
                            <span className="font-bold text-primary">
                                {bulkConfig?.items.reduce((s, i) => s + Number(i.qty), 0) || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm mt-1">
                            <span className="text-muted-foreground">Available in room:</span>
                            <span className={`font-bold ${roomStats.empty >= (bulkConfig?.items.reduce((s, i) => s + Number(i.qty), 0) || 0) ? 'text-emerald-600' : 'text-destructive'}`}>
                                {roomStats.empty} slots
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm mt-1">
                            <span className="text-muted-foreground">Starting slot:</span>
                            <span className="font-mono text-[10px] sm:text-xs bg-muted px-1.5 sm:px-2 py-0.5 rounded">
                                {bulkConfig?.startSlotId}
                            </span>
                        </div>
                    </div>

                    {/* Fill Direction */}
                    <div>
                        <label className="block text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5 sm:mb-2">
                            Fill Direction
                        </label>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => setFillMode('horizontal')}
                                className={`
                                    flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 transition-all
                                    ${fillMode === 'horizontal' 
                                        ? 'border-primary bg-primary/5 shadow-sm' 
                                        : 'border-border hover:border-primary/40'
                                    }
                                `}
                            >
                                <div className={`
                                    w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center
                                    ${fillMode === 'horizontal' ? 'bg-primary/10' : 'bg-muted'}
                                `}>
                                    <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 ${fillMode === 'horizontal' ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>
                                <div className="text-left">
                                    <span className={`block text-xs sm:text-sm font-medium ${fillMode === 'horizontal' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        Horizontal
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] text-muted-foreground">Row by row</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFillMode('vertical')}
                                className={`
                                    flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 transition-all
                                    ${fillMode === 'vertical' 
                                        ? 'border-primary bg-primary/5 shadow-sm' 
                                        : 'border-border hover:border-primary/40'
                                    }
                                `}
                            >
                                <div className={`
                                    w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center
                                    ${fillMode === 'vertical' ? 'bg-primary/10' : 'bg-muted'}
                                `}>
                                    <ArrowDown className={`w-4 h-4 sm:w-5 sm:h-5 ${fillMode === 'vertical' ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>
                                <div className="text-left">
                                    <span className={`block text-xs sm:text-sm font-medium ${fillMode === 'vertical' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        Vertical
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] text-muted-foreground">Column by column</span>
                                </div>
                            </button>
                        </div>
                    </div>


                </div>
            </ConfirmationDialog>
        </div>
    );
};
