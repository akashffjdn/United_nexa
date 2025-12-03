import { useState, useMemo, useCallback, useEffect } from 'react';
import type { FromPlace } from '../../types';
import { FilePenLine, Trash2, Search, Download } from 'lucide-react';
import { FromPlacesForm } from './FromPlacesForm';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { Button } from '../../components/shared/Button';
import { usePagination } from '../../utils/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import { CsvImporter } from '../../components/shared/CsvImporter';
import { useToast } from '../../contexts/ToastContext';
interface FormErrorState { general: string | null; }
export type DuplicateCheckFn = (currentPlaceName: string, currentShortName: string, editingId: string | undefined) => { place: string | null; short: string | null; };

export const FromPlaceList = () => {
    const { fromPlaces, addFromPlace, updateFromPlace, deleteFromPlace, fetchFromPlaces } = useData();
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingFromPlace, setEditingFromPlace] = useState<FromPlace | undefined>(undefined);
    const [, setGeneralError] = useState<FormErrorState>({ general: null }); 

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteMessage, setDeleteMessage] = useState("");

    // --- Fetch on Mount (Screen-Wise API Call) ---
    useEffect(() => {
        fetchFromPlaces();
    }, [fetchFromPlaces]);

    const filteredFromPlaces = useMemo(() => {
        return fromPlaces.filter(
            fp => 
              fp.placeName.toLowerCase().includes(search.toLowerCase()) ||
              fp.shortName.toLowerCase().includes(search.toLowerCase())
        );
    }, [fromPlaces, search]);

    const {
        paginatedData: currentFromPlaces,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        totalItems,
        totalPages
    } = usePagination({ data: filteredFromPlaces, initialItemsPerPage: 10 });

    const checkDuplicates: DuplicateCheckFn = useCallback((currentPlaceName, currentShortName, editingId) => {
        let placeConflict: string | null = null;
        let shortConflict: string | null = null;
        const placeNameNormalized = currentPlaceName.trim().toLowerCase();
        const shortNameNormalized = currentShortName.trim().toLowerCase();

        fromPlaces.forEach(fp => {
            if (editingId && fp.id === editingId) return;
            if (fp.placeName.toLowerCase() === placeNameNormalized && placeNameNormalized !== '') placeConflict = 'Place Name Already Exists';
            if (fp.shortName.toLowerCase() === shortNameNormalized && shortNameNormalized !== '') shortConflict = 'Short Name Already Exists';
        });
        return { place: placeConflict, short: shortConflict };
    }, [fromPlaces]);

    const clearFormErrors = () => setGeneralError({ general: null });

    const handleEdit = (fromPlace: FromPlace) => { clearFormErrors(); setEditingFromPlace(fromPlace); setIsFormOpen(true); };
    
    const handleDelete = (fromPlace: FromPlace) => {
        setDeletingId(fromPlace.id);
        setDeleteMessage(`Are you sure you want to delete from place "${fromPlace.placeName}"?`);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => { if (deletingId) deleteFromPlace(deletingId); setIsConfirmOpen(false); setDeletingId(null); };
    const handleCreateNew = () => { clearFormErrors(); setEditingFromPlace(undefined); setIsFormOpen(true); };
    const handleFormClose = () => { setIsFormOpen(false); setEditingFromPlace(undefined); clearFormErrors(); };
    const handleFormError = (message: string) => { setGeneralError({ general: message }); };

    const handleFormSave = (savedFromPlace: FromPlace) => {
        clearFormErrors();
        const errors = checkDuplicates(savedFromPlace.placeName, savedFromPlace.shortName, editingFromPlace?.id);
        if (errors.place || errors.short) {
            setGeneralError({ general: 'Cannot save due to duplicate entry.' });
            return;
        }
        if (editingFromPlace) updateFromPlace(savedFromPlace);
        else addFromPlace(savedFromPlace);
        handleFormClose();
    };

    const handleImport = (data: FromPlace[]) => {
        data.forEach(fp => addFromPlace(fp));
    };

    const handleExport = () => {
        if (filteredFromPlaces.length === 0) {
            toast.error("No data to export");
            return;
        }
        const headers = ['Place Name', 'Short Name'];
        const csvContent = [
            headers.join(','),
            ...filteredFromPlaces.map(fp => [
                `"${fp.placeName.replace(/"/g, '""')}"`,
                `"${fp.shortName.replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `from_places_export.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // --- RESPONSIVE BUTTON STYLE HELPER ---
    const responsiveBtnClass = "flex-1 md:flex-none text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap";

    return (
        <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
                {/* LEFT: Search */}
                <div className="w-full md:w-1/2 relative">
                    <input
                        type="text"
                        placeholder="Search by Place Name or Short Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                </div>

                {/* RIGHT: Create */}
                <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
                    <Button 
                        variant="outline" 
                        onClick={handleExport} 
                        size="sm" 
                        title="Export CSV"
                        className={responsiveBtnClass}
                    >
                        <Download size={14} className="mr-1 sm:mr-2" /> Export
                    </Button>
                    
                    <CsvImporter<FromPlace>
                        onImport={handleImport}
                        existingData={fromPlaces}
                        label="Import" // Added label for mobile fit
                        className={responsiveBtnClass} // Responsive Class
                        checkDuplicate={(newItem, existing) => 
                            newItem.placeName.toLowerCase() === existing.placeName.toLowerCase() ||
                            newItem.shortName.toLowerCase() === existing.shortName.toLowerCase()
                        }
                        mapRow={(row) => {
                            if (!row.placename || !row.shortname) return null; // Require both
                            return {
                                id: `fp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                placeName: row.placename,
                                shortName: row.shortname
                            };
                        }}
                    />
                    
                    <Button 
                        variant="primary" 
                        onClick={handleCreateNew}
                        size="sm" 
                        className={responsiveBtnClass}
                    >
                        + Add From Place
                    </Button>
                </div>
            </div>

            <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-muted">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">S.No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">From Place Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Short Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted">
                            {currentFromPlaces.length > 0 ? (
                                currentFromPlaces.map((fromPlace, index) => (
                                    <tr key={fromPlace.id} className="hover:bg-muted/30">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{fromPlace.placeName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{fromPlace.shortName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                            <button onClick={() => handleEdit(fromPlace)} className="text-blue-600"><FilePenLine size={18} /></button>
                                            <button onClick={() => handleDelete(fromPlace)} className="text-destructive"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        No entries found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="block md:hidden divide-y divide-muted">
                    {currentFromPlaces.length > 0 ? (
                        currentFromPlaces.map((fromPlace, index) => (
                            <div key={fromPlace.id} className="p-4 hover:bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm text-muted-foreground">#{(currentPage - 1) * itemsPerPage + index + 1}</div>
                                        <div className="text-lg font-semibold text-foreground">{fromPlace.placeName}</div>
                                        <div className="text-sm text-muted-foreground">Short Name: {fromPlace.shortName}</div>
                                    </div>
                                    <div className="flex flex-col space-y-3 pt-1">
                                        <button onClick={() => handleEdit(fromPlace)} className="text-blue-600"><FilePenLine size={18} /></button>
                                        <button onClick={() => handleDelete(fromPlace)} className="text-destructive"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            No entries found.
                        </div>
                    )}
                </div>
                
                {totalItems > 0 && (
                    <div className="border-t border-muted p-4">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
                    </div>
                )}
            </div>

            {isFormOpen && (
                <FromPlacesForm 
                    initialData={editingFromPlace}
                    onClose={handleFormClose}
                    onSave={handleFormSave}
                    onError={handleFormError} 
                    checkDuplicates={checkDuplicates} 
                />
            )}

            <ConfirmationDialog 
                open={isConfirmOpen} 
                onClose={() => setIsConfirmOpen(false)} 
                onConfirm={handleConfirmDelete} 
                title="Delete Entry" 
                description={deleteMessage} 
            />
        </div>
    );
};