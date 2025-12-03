import { useState } from 'react';
import type { Consignee } from '../../types';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { X, Info } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { AutocompleteInput } from '../../components/shared/AutocompleteInput';
import { useToast } from '../../contexts/ToastContext';

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

interface ConsigneeFormProps {
  initialData?: Consignee;
  onClose: () => void;
  onSave: (consignee: Consignee) => void;
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

export const ConsigneeForm = ({ initialData, onClose, onSave }: ConsigneeFormProps) => {
  // 🟢 2. ACCESS PLACE DATA (using toPlaces as destination options)
  const { consignees, toPlaces } = useData();  
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
const toast = useToast();
  const [consignee, setConsignee] = useState({
    id: initialData?.id || '',
    name: initialData?.name || '',
    destination: initialData?.destination || '',
    filingDate: initialData?.filingDate || getTodayDate(),
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    gst: initialData?.gst || '',
    pan: initialData?.pan || '',
    aadhar: initialData?.aadhar || '',
  });

  // If ID exists, we are in Update Mode
  const isUpdateMode = !!consignee.id;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConsignee(prev => ({ ...prev, [name]: value }));
    if (duplicateMessage) setDuplicateMessage(null);
  };

  // 🟢 4. DEDICATED HANDLER for AutocompleteInput (for Destination)
  const handleDestinationChange = (value: string) => {
      setConsignee(prev => ({ ...prev, destination: value }));
      if (duplicateMessage) setDuplicateMessage(null);
  };

  const handleProofBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // STRICT RULE: Only run auto-fill during "Add New". 
    if (initialData?.id) return; 

    const { value } = e.target;
    if (!value.trim()) return;

    const existing = consignees.find(c => 
      (c.gst && c.gst.toLowerCase() === value.toLowerCase()) ||
      (c.pan && c.pan.toLowerCase() === value.toLowerCase()) ||
      (c.aadhar && c.aadhar.toLowerCase() === value.toLowerCase())
    );

    if (existing) {
      setConsignee({
        id: existing.id, // Switches form to Update Mode
        name: existing.name,
        destination: existing.destination,
        filingDate: getTodayDate(),
        address: existing.address,
        phone: existing.phone,
        gst: existing.gst || '',
        pan: existing.pan || '',
        aadhar: existing.aadhar || '',
      });
      setDuplicateMessage(`Consignee "${existing.name}" found! Switched to Update mode.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consignee.gst && !consignee.pan && !consignee.aadhar) {
      toast.error('Please provide at least one proof (GST, PAN, or Aadhar).');
      return;
    }
    
    const savedConsignee: Consignee = {
      ...initialData,
      id: consignee.id || `consignee-${Math.random()}`,
      consignorId: initialData?.consignorId,
      name: consignee.name,
      destination: consignee.destination,
      filingDate: consignee.filingDate,
      address: consignee.address,
      phone: consignee.phone,
      gst: consignee.gst || undefined,
      pan: consignee.pan || undefined,
      aadhar: consignee.aadhar || undefined,
    };
    
    onSave(savedConsignee);
  };

  // 🟢 OPTIONS MAPPING
  const destinationOptions = toPlaces.map(p => ({ value: p.placeName, label: p.placeName }));

  return (
    <div className="fixed -inset-6 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-xl font-semibold text-foreground">
            {isUpdateMode ? 'Update Consignee' : 'Create New Consignee'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {duplicateMessage && (
            <div className="flex items-center gap-2 p-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md animate-in fade-in slide-in-from-top-2">
              <Info size={18} className="flex-shrink-0" />
              <span>{duplicateMessage}</span>
            </div>
          )}
          
          {/* Identity Proof Fields First */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              label="GST Number" 
              id="gst" 
              name="gst" 
              value={consignee.gst} 
              onChange={handleChange} 
              onBlur={handleProofBlur}
              placeholder="Search GST..."
            />
            <Input 
              label="PAN Number" 
              id="pan" 
              name="pan" 
              value={consignee.pan} 
              onChange={handleChange} 
              onBlur={handleProofBlur}
              placeholder="Search PAN..."
            />
            <Input 
              label="Aadhar Number" 
              id="aadhar" 
              name="aadhar" 
              value={consignee.aadhar} 
              onChange={handleChange} 
              onBlur={handleProofBlur}
              placeholder="Search Aadhar..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Consignee Name" id="name" name="name" value={consignee.name} onChange={handleChange} required { ...getValidationProp(consignee.name)} />
            {/* 🟢 3. REPLACE Input WITH AutocompleteInput */}
            <AutocompleteInput 
                label="Destination" 
                placeholder="Select or type Destination"
                options={destinationOptions} // Use the mapped options
                value={consignee.destination} 
                onSelect={handleDestinationChange} // Use dedicated handler
                required 
                { ...getValidationProp(consignee.destination)} 
            />
            <Input label="Phone Number" id="phone" name="phone" value={consignee.phone} onChange={handleChange} required { ...getValidationProp(consignee.phone)} />
            <Input label="Filing Date" id="filingDate" name="filingDate" type="date" value={consignee.filingDate} onChange={handleChange} required { ...getValidationProp(consignee.filingDate)} />

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-muted-foreground">
                Address <span className="text-destructive">*</span>
              </label>
             <textarea 
                id="address" 
                name="address" 
                value={consignee.address} 
                onChange={handleChange} 
                rows={3} 
                className="w-full mt-1 px-3 py-2 bg-transparent text-foreground border border-muted-foreground/30 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                required 
              />
               </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-muted">
            <Button type="button" variant="secondary" onClick={onClose} className="w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-auto">
              {isUpdateMode ? 'Update Consignee' : 'Save Consignee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
