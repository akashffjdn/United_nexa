import { useState } from 'react';
import type { Consignee } from '../../types';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { X } from 'lucide-react';

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

interface ConsigneeFormProps {
  initialData?: Consignee;
  onClose: () => void;
  onSave: (consignee: Consignee) => void;
}

export const ConsigneeForm = ({ initialData, onClose, onSave }: ConsigneeFormProps) => {
  const [consignee, setConsignee] = useState({
    name: initialData?.name || '',
    destination: initialData?.destination || '',
    filingDate: initialData?.filingDate || getTodayDate(),
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    // Use new proof fields
    gst: initialData?.gst || '',
    pan: initialData?.pan || '',
    aadhar: initialData?.aadhar || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConsignee(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation: at least one proof is required
    if (!consignee.gst && !consignee.pan && !consignee.aadhar) {
      alert('Please provide at least one proof (GST, PAN, or Aadhar).');
      return;
    }
    
    // --- THIS IS THE FIX ---
    // The savedConsignee object now correctly matches the Consignee type
    // (no 'proof' object, just optional gst, pan, aadhar)
    const savedConsignee: Consignee = {
      ...initialData,
      id: initialData?.id || `consignee-${Math.random()}`, // Mock ID
      consignorId: initialData?.consignorId, // Preserve ID if editing
      name: consignee.name,
      destination: consignee.destination,
      filingDate: consignee.filingDate,
      address: consignee.address,
      phone: consignee.phone,
      gst: consignee.gst || undefined, // Send undefined if empty
      pan: consignee.pan || undefined, // Send undefined if empty
      aadhar: consignee.aadhar || undefined, // Send undefined if empty
    };
    // --- END FIX ---
    
    onSave(savedConsignee);
  };

  return (
    // Modal Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Modal Panel */}
      <div className="relative w-full max-w-2xl bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-xl font-semibold text-foreground">
            {initialData ? 'Edit Consignee' : 'Create New Consignee'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <Input label="Consignee Name" id="name" name="name" value={consignee.name} onChange={handleChange} required />
            <Input label="Destination" id="destination" name="destination" value={consignee.destination} onChange={handleChange} required />
            <Input label="Phone Number" id="phone" name="phone" value={consignee.phone} onChange={handleChange} required />
            <Input label="Filing Date" id="filingDate" name="filingDate" type="date" value={consignee.filingDate} onChange={handleChange} required />

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-muted-foreground">
                Address <span className="text-destructive">*</span>
              </label>
              <textarea id="address" name="address" value={consignee.address} onChange={handleChange} rows={3} className="w-full mt-1 px-3 py-2 border border-muted-foreground/30 rounded-md shadow-sm" required />
            </div>
            
            <div className="md:col-span-2 pt-4 border-t border-muted">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Proof of Identity (At least one is required)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="GST Number" id="gst" name="gst" value={consignee.gst || ''} onChange={handleChange} />
                <Input label="PAN Number" id="pan" name="pan" value={consignee.pan || ''} onChange={handleChange} />
                <Input label="Aadhar Number" id="aadhar" name="aadhar" value={consignee.aadhar || ''} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Modal Footer (Actions) */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-muted">
            <Button type="button" variant="secondary" onClick={onClose} className="w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-auto">
              Save Consignee
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};