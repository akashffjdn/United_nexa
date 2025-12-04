import { useState } from 'react';
import type { ToPlace } from '../../types'; 
import { Input } from '../../components/shared/Input'; 
import { Button } from '../../components/shared/Button'; 
import { X } from 'lucide-react';
import type { DuplicateCheckFn } from './ToPlacesList';
// 🟢 NEW: Imports
import { placeSchema } from '../../schemas';

interface ToPlacesFormProps {
    initialData?: ToPlace;
    onClose: () => void;
    onSave: (toPlace: ToPlace) => void;
    onError: (message: string) => void; 
    checkDuplicates: DuplicateCheckFn;
}

const isValueValid = (value: any): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return !!value; 
};

const getValidationProp = (value: any) => ({
    hideRequiredIndicator: isValueValid(value)
});

export const ToPlacesForm = ({ initialData, onClose, onSave, onError, checkDuplicates }: ToPlacesFormProps) => {
    const [toPlace, setToPlace] = useState({
        placeName: initialData?.placeName || '',
        shortName: initialData?.shortName || '',
    });

    // 🟢 NEW: Validation State
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setToPlace(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});
        
        // 🟢 1. Validate against Zod Schema
        const validationResult = placeSchema.safeParse(toPlace);

        if (!validationResult.success) {
            const newErrors: Record<string, string> = {};
            validationResult.error.issues.forEach((err: any) => {
                if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
            });
            setFormErrors(newErrors);
            return;
        }

        // 🟢 2. Check for duplicates
        const duplicateErrors = checkDuplicates(
            toPlace.placeName, 
            toPlace.shortName, 
            initialData?.id
        );

        if (duplicateErrors.place || duplicateErrors.short) {
            setFormErrors(prev => ({
                 ...prev,
                 placeName: duplicateErrors.place || prev.placeName,
                 shortName: duplicateErrors.short || prev.shortName
             }));
            onError('Cannot save due to duplicate entry.');
            return;
        }

        const savedToPlace: ToPlace = {
            id: initialData?.id || `tp-${Math.random().toString(36).substring(2, 9)}`, 
            placeName: toPlace.placeName.trim(),
            shortName: toPlace.shortName.trim(),
        };
        
        onSave(savedToPlace);
    };

    return (
        <div className="fixed -top-6 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-96 max-w-lg bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-muted">
                    <h2 className="text-xl font-semibold text-foreground">
                        {initialData ? 'Edit To Places Entry' : 'Create New To Places Entry'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        
                        <div>
                            <Input 
                                label="Place Name (To)" 
                                id="placeName" 
                                name="placeName" 
                                value={toPlace.placeName} 
                                onChange={handleChange} 
                                required 
                                { ...getValidationProp(toPlace.placeName)}
                            />
                            {formErrors.placeName && (
                                <p className="mt-1 text-sm text-red-600">{formErrors.placeName}</p>
                            )}
                        </div>
                        
                        <div>
                            <Input 
                                label="Short Name (To)" 
                                id="shortName" 
                                name="shortName" 
                                value={toPlace.shortName} 
                                onChange={handleChange} 
                                required 
                                { ...getValidationProp(toPlace.shortName)}
                            />
                            {formErrors.shortName && (
                                <p className="mt-1 text-sm text-red-600">{formErrors.shortName}</p>
                            )}
                        </div>
                        
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-muted">
                        <Button type="button" variant="secondary" onClick={onClose} className="w-auto">
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            variant="primary" 
                            className="w-auto"
                        >
                            Save
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};