import { useState } from 'react';
import type { FromPlace } from '../../types';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { X } from 'lucide-react';
import type { DuplicateCheckFn } from './FromPlacesList';

interface FormErrors {
    place: string | null;
    short: string | null;
    // general: string | null; // For required field error
}

// Helper function to check for non-empty or non-zero value
const isValueValid = (value: any): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    // Check if it's a number and non-zero, or any other truthy value
    return !!value; 
};

// Utility function to generate the prop used to hide the required marker
const getValidationProp = (value: any) => ({
    // This prop tells the Input component to hide the visual marker
    hideRequiredIndicator: isValueValid(value)
});

interface FromPlacesFormProps {
    initialData?: FromPlace;
    onClose: () => void;
    onSave: (fromPlace: FromPlace) => void;
    onError: (message: string) => void; 
    // 🌟 NEW: Validation function passed from parent
    checkDuplicates: DuplicateCheckFn;
}

export const FromPlacesForm = ({ initialData, onClose, onSave, onError, checkDuplicates }: FromPlacesFormProps) => {
    const [fromPlace, setFromPlace] = useState({
        placeName: initialData?.placeName || '',
        shortName: initialData?.shortName || '',
    });
    
    // 🌟 NEW: Internal state to manage field-level errors dynamically
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({
        place: null,
        short: null,
        // general: null,
    });

    // 🌟 NEW: Validation function to run on change and submit
    const validateFields = (currentPlace: string, currentShort: string): boolean => {
        // 1. Check for required fields (simple form validation)
        const isPlaceNameValid = currentPlace.trim().length > 0;
        const isShortNameValid = currentShort.trim().length > 0;
        
        let newErrors: FormErrors = { place: null, short: null, 
            // general: null 
        };
        
        // if (!isPlaceNameValid || !isShortNameValid) {
        //     newErrors.general = 'Place Name and Short Name are required.';
        // }

        // 2. Check for duplicates using the parent's function
        const duplicateErrors = checkDuplicates(
            currentPlace, 
            currentShort, 
            initialData?.id
        );

        newErrors = {
            ...newErrors,
            ...duplicateErrors,
        };

        setFieldErrors(newErrors);
        
        // Return true if all checks pass for submission purposes
        return isPlaceNameValid && isShortNameValid && !duplicateErrors.place && !duplicateErrors.short;
    };
    
    // 🌟 NEW: Dynamic handleChange handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        // Update state first
        setFromPlace(prev => {
            const newPlace = { ...prev, [name]: value };
            
            // Validate immediately after state update (using the new values)
            validateFields(newPlace.placeName, newPlace.shortName);
            
            return newPlace;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // 🚨 Final Validation Check on Submit
        const isValid = validateFields(fromPlace.placeName, fromPlace.shortName);

        if (!isValid) {
            // Trigger the parent's general error handler (which might display the 'required' message)
            // if (fieldErrors.general) {
            //      onError(fieldErrors.general);
            // } else
                 if (fieldErrors.place || fieldErrors.short) {
                 onError('Cannot save due to duplicate entry.');
            }
            return;
        }

        const savedFromPlace: FromPlace = {
            id: initialData?.id || `fp-${Math.random().toString(36).substring(2, 9)}`, 
            placeName: fromPlace.placeName.trim(),
            shortName: fromPlace.shortName.trim(),
        };
        
        onSave(savedFromPlace);
    };

    return (
        // Modal Backdrop
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            {/* Modal Panel */}
            <div className="relative w-96 max-w-lg bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-muted">
                    <h2 className="text-xl font-semibold text-foreground">
                        {initialData ? 'Edit From Places Entry' : 'Create New From Places Entry'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Display the general form error (e.g., Required fields are missing) */}
                {/* {fieldErrors.general && (
                    <div className="p-4 bg-red-100 text-red-700 border-b border-red-300">
                        <p className="flex items-center font-medium">
                            <X size={16} className="mr-2 inline"/>
                            {fieldErrors.general}
                        </p>
                    </div>
                )} */}
                
                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        
                        {/* ⚠️ Place Name Input and Error ⚠️ */}
                        <div>
                            <Input 
                                label="Place Name" 
                                id="placeName" 
                                name="placeName" 
                                value={fromPlace.placeName} 
                                onChange={handleChange} 
                                required 
                                { ...getValidationProp(fromPlace.placeName)}
                            />
                            {fieldErrors.place && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    {fieldErrors.place}
                                </p>
                            )}
                        </div>
                        
                        {/* ⚠️ Short Name Input and Error ⚠️ */}
                        <div>
                            <Input 
                                label="Short Name" 
                                id="shortName" 
                                name="shortName" 
                                value={fromPlace.shortName} 
                                onChange={handleChange} 
                                required 
                                { ...getValidationProp(fromPlace.shortName)}
                            />
                            {fieldErrors.short && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    {fieldErrors.short}
                                </p>
                            )}
                        </div>
                        
                    </div>

                    {/* Modal Footer (Actions) */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-muted">
                        <Button type="button" variant="secondary" onClick={onClose} className="w-auto">
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            variant="primary" 
                            className="w-auto"
                            // Optionally disable button if any field error exists
                            disabled={!!fieldErrors.place || !!fieldErrors.short} 
                        >
                            Save
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
