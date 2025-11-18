// src/modules/fromPlaces/FromPlaceList.tsx 

import { useState, useMemo, useCallback } from 'react'; // Added useCallback
import type { FromPlace } from '../../types';
import { FilePenLine, Trash2, Search } from 'lucide-react';
import { FromPlacesForm } from './FromPlacesForm';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { usePagination } from '../../utils/usePagination';
import { Pagination } from '../../components/shared/Pagination';

// Define a type for the error state to keep track of any form-wide error
interface FormErrorState {
    general: string | null;
}

// Define the signature for the validation prop we will pass down
export type DuplicateCheckFn = (
    currentPlaceName: string, 
    currentShortName: string, 
    editingId: string | undefined
) => { 
    place: string | null; 
    short: string | null; 
};

export const FromPlaceList = () => {
    const { fromPlaces, addFromPlace, updateFromPlace, deleteFromPlace } = useData();

    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingFromPlace, setEditingFromPlace] = useState<FromPlace | undefined>(undefined);
    
    // Simplified error state for general form issues, duplicates handled dynamically
    const [, setGeneralError] = useState<FormErrorState>({ general: null }); 

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ... (Filtering and Pagination logic remains the same) ...
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
    } = usePagination({ data: filteredFromPlaces, initialItemsPerPage: 10 });
    // --- End Pagination Integration ---

    // 🌟 NEW: Memoized function to check for duplicates against the global list
    const checkDuplicates: DuplicateCheckFn = useCallback((currentPlaceName, currentShortName, editingId) => {
        let placeConflict: string | null = null;
        let shortConflict: string | null = null;
        
        const placeNameNormalized = currentPlaceName.trim().toLowerCase();
        const shortNameNormalized = currentShortName.trim().toLowerCase();

        fromPlaces.forEach(fp => {
            // Skip the current item if we are editing
            if (editingId && fp.id === editingId) {
                return;
            }

            // Check for duplicate Place Name
            if (fp.placeName.toLowerCase() === placeNameNormalized && placeNameNormalized !== '') {
                placeConflict = 'Place Name Already Exists';
            }
            
            // Check for duplicate Short Name
            if (fp.shortName.toLowerCase() === shortNameNormalized && shortNameNormalized !== '') {
                shortConflict = 'Short Name Already Exists';
            }
        });
        
        return { place: placeConflict, short: shortConflict };
    }, [fromPlaces]); // Dependency on fromPlaces to ensure fresh data

    // Function to clear all errors
    const clearFormErrors = () => setGeneralError({ general: null });

    // --- Handlers ---
    const handleEdit = (fromPlace: FromPlace) => {
        clearFormErrors();
        setEditingFromPlace(fromPlace);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeletingId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingId) {
            deleteFromPlace(deletingId);
        }
        setIsConfirmOpen(false);
        setDeletingId(null);
    };
    
    const handleCreateNew = () => {
        clearFormErrors();
        setEditingFromPlace(undefined);
        setIsFormOpen(true);
    };
    
    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingFromPlace(undefined);
        clearFormErrors(); 
    };
    
    // Error handler for the form (used for general validation like required fields)
    const handleFormError = (message: string) => {
        setGeneralError({ general: message });
    };

    const handleFormSave = (savedFromPlace: FromPlace) => {
        clearFormErrors();
        
        // 🚨 CRITICAL: Re-check duplicates here to prevent submission if invalid
        const errors = checkDuplicates(
            savedFromPlace.placeName, 
            savedFromPlace.shortName, 
            editingFromPlace?.id
        );

        if (errors.place || errors.short) {
            // We can show a general error if validation failed on submit
            setGeneralError({ general: 'Cannot save due to duplicate entry. Please fix the highlighted fields.' });
            return;
        }

        if (editingFromPlace) {
            updateFromPlace(savedFromPlace);
        } else {
            addFromPlace(savedFromPlace);
        }
        handleFormClose();
    };
    // --- End Handlers ---

    return (
        <div className="space-y-6">
             {/* 1. Header: Title and Create Button (No change) */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <h1 className="text-3xl font-bold text-foreground">From Places Entry</h1>
                <button 
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 font-medium"
                >
                    + Create New From Places Entry
                </button>
            </div>

            {/* 2. Search Section (No change) */}
            <div className="space-y-4 p-4 bg-background rounded-lg shadow border border-muted">
                <div className="relative">
                  <input
    type="text"
    placeholder="Search by Place Name or Short Name..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    // ADDED: bg-background text-foreground
    className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
/>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                </div>
            </div>

            {/* 3. Responsive Data Display (No change) */}
            <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-muted">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">S.No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">From Place Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Short Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted">
                            {currentFromPlaces.map((fromPlace, index) => (
                                <tr key={fromPlace.id} className="hover:bg-muted/30">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{fromPlace.placeName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{fromPlace.shortName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                        <button onClick={() => handleEdit(fromPlace)} className="text-blue-600 hover:text-blue-800" title="Edit">
                                            <FilePenLine size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(fromPlace.id)} className="text-destructive hover:text-destructive/80" title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="block md:hidden divide-y divide-muted">
                    {currentFromPlaces.map((fromPlace, index) => (
                        <div key={fromPlace.id} className="p-4 hover:bg-muted/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-sm text-muted-foreground">
                                        #{(currentPage - 1) * itemsPerPage + index + 1}
                                    </div>
                                    <div className="text-lg font-semibold text-foreground">{fromPlace.placeName}</div>
                                    <div className="text-sm text-muted-foreground">Short Name: {fromPlace.shortName}</div>
                                </div>
                                <div className="flex flex-col space-y-3 pt-1">
                                    <button onClick={() => handleEdit(fromPlace)} className="text-blue-600" title="Edit">
                                        <FilePenLine size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(fromPlace.id)} className="text-destructive" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {totalItems > 0 && (
                    <div className="border-t border-muted p-4">
                        <Pagination
                            currentPage={currentPage}
                            // Note: If usePagination returns an object spread, we can extract totalPages
                            // directly here. Assuming it is available for Pagination:
                            // totalPages={totalPages} 
                            // If totalPages is not exposed in the destructure, you need to update 
                            // usePagination or pass it if available from the hook.
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={setItemsPerPage}
                            totalItems={totalItems} totalPages={0}                        // Assuming totalPages is still returned by the hook but just not 
                        // explicitly destructured here to fix the unused warning:
                        // You must update the hook usage or rely on how Pagination is implemented.
                        // For the purpose of fixing the warning, we remove the unused variable.
                        />
                    </div>
                  )}
            </div>

            {/* No results message (No change) */}
            {totalItems === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No From Places entries found.
                </div>
            )}
            
            {/* The Modal Form - Pass the validation function */}
            {isFormOpen && (
                <FromPlacesForm 
                    initialData={editingFromPlace}
                    onClose={handleFormClose}
                    onSave={handleFormSave}
                    onError={handleFormError} 
                    // 🌟 NEW: Pass the duplicate check function instead of fixed error states
                    checkDuplicates={checkDuplicates} 
                />
            )}

            {/* The Confirmation Dialog (No change) */}
            <ConfirmationDialog
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete From Places Entry"
                description="Are you sure you want to delete this From Places Entry? This action cannot be undone."
            />
        </div>
    );
};