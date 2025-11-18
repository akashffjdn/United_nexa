// src/modules/toPlaces/ToPlacesList.tsx

import { useState, useMemo, useCallback } from 'react'; // Added useCallback
import type { ToPlace } from '../../types';
import { FilePenLine, Trash2, Search } from 'lucide-react'; // Added X for error icon
import { ToPlacesForm } from './ToPlacesForm';
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

export const ToPlacesList = () => {
    // Use global state and functions from context
    const { toPlaces, addToPlace, updateToPlace, deleteToPlace } = useData();

    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingToPlace, setEditingToPlace] = useState<ToPlace | undefined>(undefined);
    
    // 🌟 NEW: Error state for general form issues/duplicate check failure on submit
    const [, setGeneralError] = useState<FormErrorState>({ general: null }); 

    // State for Delete Confirmation
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // --- Filtering (Memoized) ---
    const filteredToPlaces = useMemo(() => {
        return toPlaces.filter(
            tp => 
              tp.placeName.toLowerCase().includes(search.toLowerCase()) ||
              tp.shortName.toLowerCase().includes(search.toLowerCase())
        );
    }, [toPlaces, search]);

    // --- Pagination Integration ---
    const {
        paginatedData: currentToPlaces,
        currentPage,
        setCurrentPage,
        totalPages,
        itemsPerPage,
        setItemsPerPage,
        totalItems,
    } = usePagination({ data: filteredToPlaces, initialItemsPerPage: 10 });
    // --- End Pagination Integration ---

    // 🌟 NEW: Memoized function to check for duplicates against the global list
    const checkDuplicates: DuplicateCheckFn = useCallback((currentPlaceName, currentShortName, editingId) => {
        let placeConflict: string | null = null;
        let shortConflict: string | null = null;
        
        const placeNameNormalized = currentPlaceName.trim().toLowerCase();
        const shortNameNormalized = currentShortName.trim().toLowerCase();

        toPlaces.forEach(tp => {
            // Skip the current item if we are editing
            if (editingId && tp.id === editingId) {
                return;
            }

            // Check for duplicate Place Name
            if (tp.placeName.toLowerCase() === placeNameNormalized && placeNameNormalized !== '') {
                placeConflict = 'Place Name Already Exists';
            }
            
            // Check for duplicate Short Name
            if (tp.shortName.toLowerCase() === shortNameNormalized && shortNameNormalized !== '') {
                shortConflict = 'Short Name Already Exists';
            }
        });
        
        return { place: placeConflict, short: shortConflict };
    }, [toPlaces]); // Dependency on toPlaces to ensure fresh data

    // Function to clear all errors
    const clearFormErrors = () => setGeneralError({ general: null });

    // --- Handlers ---
    const handleEdit = (toPlace: ToPlace) => {
        clearFormErrors(); // Clear general error on opening
        setEditingToPlace(toPlace);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeletingId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingId) {
            deleteToPlace(deletingId);
        }
        setIsConfirmOpen(false);
        setDeletingId(null);
    };
    
    const handleCreateNew = () => {
        clearFormErrors(); // Clear general error on opening
        setEditingToPlace(undefined);
        setIsFormOpen(true);
    };
    
    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingToPlace(undefined);
        clearFormErrors(); 
    };
    
    // 🌟 NEW: Error handler for the form (used for required fields/submission failure)
    const handleFormError = (message: string) => {
        setGeneralError({ general: message });
    };

    const handleFormSave = (savedToPlace: ToPlace) => {
        clearFormErrors();
        
        // 🚨 CRITICAL: Re-check duplicates here to prevent submission if invalid
        const errors = checkDuplicates(
            savedToPlace.placeName, 
            savedToPlace.shortName, 
            editingToPlace?.id
        );

        if (errors.place || errors.short) {
            // Show a general error if validation failed on submit
            setGeneralError({ general: 'Cannot save due to duplicate entry. Please fix the highlighted fields.' });
            return;
        }

        if (editingToPlace) {
            updateToPlace(savedToPlace);
        } else {
            addToPlace(savedToPlace);
        }
        handleFormClose();
    };
    // --- End Handlers ---

    return (
        <div className="space-y-6">
            {/* 1. Header: Title and Create Button (No change) */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <h1 className="text-3xl font-bold text-foreground">To Places Entry</h1>
                <button 
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 font-medium"
                >
                    + Create New To Places Entry
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

            {/* 3. Responsive Data Display (Table/Cards remain the same) */}
            <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
                {/* ... (Table content mapping over currentToPlaces remains the same) ... */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-muted">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">S.No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">To Place Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Short Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted">
                            {currentToPlaces.map((toPlace, index) => (
                                <tr key={toPlace.id} className="hover:bg-muted/30">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{toPlace.placeName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{toPlace.shortName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                        <button onClick={() => handleEdit(toPlace)} className="text-blue-600 hover:text-blue-800" title="Edit">
                                            <FilePenLine size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(toPlace.id)} className="text-destructive hover:text-destructive/80" title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="block md:hidden divide-y divide-muted">
                    {currentToPlaces.map((toPlace, index) => (
                        <div key={toPlace.id} className="p-4 hover:bg-muted/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-sm text-muted-foreground">
                                        #{(currentPage - 1) * itemsPerPage + index + 1}
                                    </div>
                                    <div className="text-lg font-semibold text-foreground">{toPlace.placeName}</div>
                                    <div className="text-sm text-muted-foreground">Short Name: {toPlace.shortName}</div>
                                </div>
                                <div className="flex flex-col space-y-3 pt-1">
                                    <button onClick={() => handleEdit(toPlace)} className="text-blue-600" title="Edit">
                                        <FilePenLine size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(toPlace.id)} className="text-destructive" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* --- PAGINATION FOOTER --- (No change) */}
                {totalItems > 0 && (
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
                )}
            </div>

            {/* No results message */}
            {totalItems === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No To Places entries found.
                </div>
            )}

            {/* The Modal Form - Pass the validation function and error handlers */}
            {isFormOpen && (
                <ToPlacesForm 
                    initialData={editingToPlace}
                    onClose={handleFormClose}
                    onSave={handleFormSave}
                    // 🌟 NEW: Pass error handler
                    onError={handleFormError}
                    // 🌟 NEW: Pass the duplicate check function
                    checkDuplicates={checkDuplicates} 
                />
            )}

            {/* --- The Confirmation Dialog --- (No change) */}
            <ConfirmationDialog
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete To Places Entry"
                description="Are you sure you want to delete this To Places Entry? This action cannot be undone."
            />
        </div>
    );
};