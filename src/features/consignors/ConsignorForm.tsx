import { useState } from 'react';
import type { Consignor, Consignee } from '../../types';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { X } from 'lucide-react';

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

interface ConsignorFormProps {
  initialData?: Consignor;
  onClose: () => void;
  onSave: (consignor: Consignor, firstConsignee?: any) => void;
}

export const ConsignorForm = ({ initialData, onClose, onSave }: ConsignorFormProps) => {
  const [consignor, setConsignor] = useState({
    name: initialData?.name || '',
    from: initialData?.from || '',
    filingDate: initialData?.filingDate || getTodayDate(),
    gst: initialData?.gst || '',
    pan: initialData?.pan || '',
    aadhar: initialData?.aadhar || '',
    mobile: initialData?.mobile || '',
    address: initialData?.address || '',
  });

  const [addFirstConsignee, setAddFirstConsignee] = useState(false);
  const [consignee, setConsignee] = useState({
    name: '',
    proofType: 'gst',
    proofValue: '',
    address: '',
    phone: '',
    destination: '',
  });

  const handleConsignorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConsignor(prev => ({ ...prev, [name]: value }));
  };
  
  const handleConsigneeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConsignee(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const savedConsignor: Consignor = {
      ...initialData,
      ...consignor,
      id: initialData?.id || `consignor-${Math.random()}`, // Mock ID
    };

    let savedConsignee: Consignee | undefined = undefined;
    if (addFirstConsignee) {
      // Validation for optional consignee
      if (!consignee.name || !consignee.phone || !consignee.destination || !consignee.address || !consignee.proofValue) {
        alert("Please fill all required fields for the first consignee.");
        return;
      }

      // --- THIS IS THE FIX ---
      // The 'savedConsignee' object is now created to match the new Consignee type
      // (with optional gst, pan, aadhar fields, NOT a 'proof' object)
      savedConsignee = {
        id: `consignee-${Math.random()}`,
        consignorId: savedConsignor.id,
        name: consignee.name,
        phone: consignee.phone,
        destination: consignee.destination,
        address: consignee.address,
        filingDate: getTodayDate(),
        
        // Map the old form state (proofType, proofValue) to the new structure
        gst: consignee.proofType === 'gst' ? consignee.proofValue : undefined,
        pan: consignee.proofType === 'pan' ? consignee.proofValue : undefined,
        aadhar: consignee.proofType === 'aadhar' ? consignee.proofValue : undefined,
      };
      // --- END FIX ---
    }
    
    onSave(savedConsignor, savedConsignee);
  };

  const isCreateMode = !initialData;

  return (
    // Modal Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Modal Panel */}
      <div className="relative w-full max-w-2xl bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-xl font-semibold text-foreground">
            {isCreateMode ? 'Create New Consignor' : 'Edit Consignor'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Consignor Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Consignor Name" id="name" name="name" value={consignor.name} onChange={handleConsignorChange} required />
            <Input label="From (Place)" id="from" name="from" value={consignor.from} onChange={handleConsignorChange} required />
            <Input label="GST Number" id="gst" name="gst" value={consignor.gst} onChange={handleConsignorChange} required />
            <Input label="Filing Date" id="filingDate" name="filingDate" type="date" value={consignor.filingDate} onChange={handleConsignorChange} required />
            <Input label="PAN Number (Optional)" id="pan" name="pan" value={consignor.pan} onChange={handleConsignorChange} />
            <Input label="Aadhar Number (Optional)" id="aadhar" name="aadhar" value={consignor.aadhar} onChange={handleConsignorChange} />
            <Input label="Mobile Number (Optional)" id="mobile" name="mobile" value={consignor.mobile} onChange={handleConsignorChange} />
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-muted-foreground">
                Address <span className="text-destructive">*</span>
              </label>
              <textarea id="address" name="address" value={consignor.address} onChange={handleConsignorChange} rows={3} className="w-full mt-1 px-3 py-2 border border-muted-foreground/30 rounded-md shadow-sm" required />
            </div>
          </div>

          {/* Optional Consignee Section (Only on Create) */}
          {isCreateMode && (
            <div className="space-y-4 pt-4 border-t border-muted">
              <div className="flex items-center">
                <input
                  id="addFirstConsignee"
                  name="addFirstConsignee"
                  type="checkbox"
                  checked={addFirstConsignee}
                  onChange={(e) => setAddFirstConsignee(e.target.checked)}
                  className="h-4 w-4 text-primary border-muted-foreground/30 rounded focus:ring-primary"
                />
                <label htmlFor="addFirstConsignee" className="ml-2 block text-sm font-medium text-foreground">
                  Add first consignee for this consignor
                </label>
              </div>

              {addFirstConsignee && (
                <div className="p-4 border border-dashed border-muted-foreground/30 rounded-md space-y-4">
                  <h3 className="font-medium text-foreground">First Consignee Details</h3>
                  <Input label="Consignee Name" id="c-name" name="name" value={consignee.name} onChange={handleConsigneeChange} required={addFirstConsignee} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label htmlFor="c-proofType" className="block text-sm font-medium text-muted-foreground">Proof Type</label>
                      <select id="c-proofType" name="proofType" value={consignee.proofType} onChange={handleConsigneeChange} className="w-full mt-1 px-3 py-2 border border-muted-foreground/30 rounded-md shadow-sm">
                        <option value="gst">GST</option>
                        <option value="pan">PAN</option>
                        <option value="aadhar">Aadhar</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Input label="Proof Number" id="c-proofValue" name="proofValue" value={consignee.proofValue} onChange={handleConsigneeChange} required={addFirstConsignee} />
                    </div>
                  </div>
                  <Input label="Phone Number" id="c-phone" name="phone" value={consignee.phone} onChange={handleConsigneeChange} required={addFirstConsignee} />
                  <Input label="Destination" id="c-destination" name="destination" value={consignee.destination} onChange={handleConsigneeChange} required={addFirstConsignee} />
                  <div>
                    <label htmlFor="c-address" className="block text-sm font-medium text-muted-foreground">
                      Address {addFirstConsignee && <span className="text-destructive">*</span>}
                    </label>
                    <textarea id="c-address" name="address" value={consignee.address} onChange={handleConsigneeChange} rows={2} className="w-full mt-1 px-3 py-2 border border-muted-foreground/30 rounded-md shadow-sm" required={addFirstConsignee} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer (Actions) */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-muted">
            <Button type="button" variant="secondary" onClick={onClose} className="w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-auto">
              Save Consignor
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};