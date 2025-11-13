import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import type { GcEntry, Consignee } from '../../types';
import { getTodayDate } from '../../utils/dateHelpers';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { AutocompleteInput } from '../../components/shared/AutocompleteInput';
import { RadioGroup } from '../../components/shared/RadioGroup';
import { ArrowLeft, Printer, Save } from 'lucide-react';

// Type for the proof dropdown
type ProofType = 'gst' | 'pan' | 'aadhar';

export const GcEntryForm = () => {
  const { gcNo } = useParams<{ gcNo: string }>();
  const navigate = useNavigate();
  const { 
    consignors, 
    consignees, 
    getNextGcNo, 
    addGcEntry, 
    updateGcEntry, 
    getGcEntry,
    getUniqueDests,
    getPackingTypes,
    getContentsTypes,
  } = useData();
  
  const isEditMode = !!gcNo;
  const [loading, setLoading] = useState(isEditMode);
  
  // --- Form State ---
  // This holds all the data that will be saved to the GcEntry object
  const [form, setForm] = useState<Omit<GcEntry, 'id'>>({
    gcDate: getTodayDate(),
    from: 'Sivakasi',
    destination: '',
    consignorId: '',
    consigneeId: '',
    consigneeProofType: 'gst',
    consigneeProofValue: '',
    billDate: getTodayDate(),
    deliveryAt: '',
    freightUptoAt: '',
    billNo: '',
    billValue: 0,
    tollFee: 0,
    freight: 0,
    godownCharge: 0,
    statisticCharge: 0,
    advanceNone: 0,
    balanceToPay: 0,
    quantity: 0,
    packing: '',
    contents: '',
    prefix: '',
    fromNo: 1,
    netQty: 0,
    paidType: 'To Pay',
  });
  
  // --- Derived/Display State ---
  // This state is for display-only fields (like Consignor GST) or to track selections
  const [consignorGst, setConsignorGst] = useState('');
  const [selectedConsignee, setSelectedConsignee] = useState<Consignee | null>(null);
  
  // --- Effect to load data in Edit Mode (FIXED) ---
  useEffect(() => {
    if (isEditMode && gcNo) {
      const gc = getGcEntry(gcNo);
      if (gc) {
        setForm(gc); // Load all saved data into the form
        
        // Load related display data
        const consignor = consignors.find(c => c.id === gc.consignorId);
        if (consignor) setConsignorGst(consignor.gst);
        
        const consignee = consignees.find(c => c.id === gc.consigneeId);
        if (consignee) setSelectedConsignee(consignee);
        
      } else {
        alert('GC Entry not found.');
        navigate('/gc-entry');
      }
      setLoading(false);
    }
  }, [isEditMode, gcNo, getGcEntry, consignors, consignees, navigate]);
  
  // --- Memoized options for dropdowns ---
  const consignorOptions = useMemo(() => 
    consignors.map(c => ({ value: c.id, label: c.name })), [consignors]);
    
  const consigneeOptions = useMemo(() => 
    consignees.map(c => ({ value: c.id, label: c.name })), [consignees]);
    
  const destinationOptions = useMemo(getUniqueDests, [getUniqueDests]);
  const packingOptions = useMemo(getPackingTypes, [getPackingTypes]);
  const contentsOptions = useMemo(getContentsTypes, [getContentsTypes]);
  
  // --- Form Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };
  
  // Generic handler for most Autocomplete and Select
  const handleFormValueChange = (name: keyof typeof form, value: string | number) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // --- LOGIC 1: Destination Auto-fill ---
  const handleDestinationSelect = (dest: string) => {
    setForm(prev => ({
      ...prev,
      destination: dest,
      deliveryAt: dest,
      freightUptoAt: dest,
    }));
  };

  // --- LOGIC 2: Consignor Auto-fill ---
  const handleConsignorSelect = (id: string) => {
    const consignor = consignors.find(c => c.id === id);
    if (consignor) {
      setForm(prev => ({ ...prev, consignorId: id, from: consignor.from }));
      setConsignorGst(consignor.gst);
    } else {
      setForm(prev => ({ ...prev, consignorId: '', from: 'Sivakasi' }));
      setConsignorGst('');
    }
  };
  
  // --- LOGIC 3: Consignee Auto-fill ---
  const handleConsigneeSelect = (id: string) => {
    const consignee = consignees.find(c => c.id === id);
    setSelectedConsignee(consignee || null);
    
    if (consignee) {
      // Auto-fill destination and related fields
      const dest = consignee.destination;
      
      // Find first available proof
      let proofType: ProofType = 'gst';
      let proofValue = consignee.gst || '';
      if (!proofValue) {
        proofType = 'pan';
        proofValue = consignee.pan || '';
      }
      if (!proofValue) {
        proofType = 'aadhar';
        proofValue = consignee.aadhar || '';
      }
      
      setForm(prev => ({ 
        ...prev, 
        consigneeId: id,
        destination: dest,
        deliveryAt: dest,
        freightUptoAt: dest,
        consigneeProofType: proofType,
        consigneeProofValue: proofValue,
      }));
    } else {
      // Clear fields if consignee is cleared
      setForm(prev => ({
        ...prev,
        consigneeId: '',
        consigneeProofType: 'gst',
        consigneeProofValue: '',
      }));
    }
  };
  
  // --- LOGIC 3b: Handle Proof Type Change ---
  const handleProofTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProofType = e.target.value as ProofType;
    let newProofValue = '';
    
    if (selectedConsignee) {
      newProofValue = selectedConsignee[newProofType] || '';
    }
    
    setForm(prev => ({
      ...prev,
      consigneeProofType: newProofType,
      consigneeProofValue: newProofValue,
    }));
  };
  
  // --- Auto-calculated values ---
  const toNo = (form.fromNo > 0 && form.quantity > 0) ? (form.fromNo + form.quantity) - 1 : 0;
  const finalGcNo = isEditMode ? gcNo! : getNextGcNo();
  
  // --- Save/Print Handlers ---
  const handleSave = (andPrint = false) => {
    if (!form.consignorId || !form.consigneeId) {
      alert('Please select a Consignor and Consignee.');
      return;
    }
    
    const gcData: GcEntry = {
      ...form,
      id: finalGcNo,
    };
    
    if (isEditMode) {
      updateGcEntry(gcData);
    } else {
      addGcEntry(gcData);
    }
    
    if (andPrint) {
      window.open(`/gc-entry/print?ids=${finalGcNo}`, '_blank');
    }
    
    navigate('/gc-entry');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading GC Data...</div>;
  }
  
  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {/* 1. Header: Title and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            type="button" 
            variant="secondary" 
            className="w-auto px-3"
            onClick={() => navigate('/gc-entry')}
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {isEditMode ? `Edit GC No: ${gcNo}` : 'Add New GC Entry'}
          </h1>
        </div>
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="secondary" 
            className="w-auto"
            onClick={() => handleSave(true)}
          >
            <Printer size={16} className="mr-2" />
            Save & Print
          </Button>
          <Button 
            type="button" 
            variant="primary" 
            className="w-auto"
            onClick={() => handleSave(false)}
          >
            <Save size={16} className="mr-2" />
            {isEditMode ? 'Save Changes' : 'Save GC'}
          </Button>
        </div>
      </div>
      
      {/* NEW REDESIGNED FORM: 
        Using a single card with responsive grid layout 
      */}
      <div className="bg-background rounded-lg shadow border border-muted p-4 md:p-8">
        <div className="space-y-8">

          {/* --- GC Details --- */}
          <div>
            <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">GC Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Input label="GC No" id="gcNo" name="gcNo" value={finalGcNo} disabled />
              <Input label="GC Date" id="gcDate" name="gcDate" type="date" value={form.gcDate} onChange={handleChange} required />
              <Input label="From" id="from" name="from" value={form.from} onChange={handleChange} required />
              <AutocompleteInput
                label="Destination"
                options={destinationOptions}
                value={form.destination} // Use form.destination for the value
                onSelect={handleDestinationSelect} // Use special handler
                placeholder="Type to search destination..."
                required
              />
            </div>
          </div>

          {/* --- Parties --- */}
          <div>
            <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">Parties</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <AutocompleteInput
                  label="Consignor Name"
                  options={consignorOptions}
                  value={form.consignorId}
                  onSelect={handleConsignorSelect} // Special handler
                  placeholder="Type to search consignor..."
                  required
                />
              </div>
              <Input label="Consignor GSTIN" id="consignorGst" name="consignorGst" value={consignorGst} disabled />
              
              <div className="md:col-span-2">
                <AutocompleteInput
                  label="Consignee Name"
                  options={consigneeOptions}
                  value={form.consigneeId}
                  onSelect={handleConsigneeSelect} // Special handler
                  placeholder="Type to search consignee..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Consignee Proof Type</label>
                <select 
                  name="consigneeProofType"
                  value={form.consigneeProofType}
                  onChange={handleProofTypeChange} // Special handler
                  className="w-full mt-1 px-3 py-2 border border-muted-foreground/30 rounded-md shadow-sm bg-background"
                >
                  <option value="gst">GST</option>
                  <option value="pan">PAN</option>
                  <option value="aadhar">Aadhar</option>
                </select>
              </div>
              <Input 
                label="Consignee Proof Value" 
                id="consigneeProofValue" 
                name="consigneeProofValue" 
                value={form.consigneeProofValue} 
                onChange={handleChange} // Allow manual override
                required 
              />
            </div>
          </div>
          
          {/* --- Routing & Dates --- */}
          <div>
            <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">Routing & Dates</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Input label="Bill Date" id="billDate" name="billDate" type="date" value={form.billDate} onChange={handleChange} required />
              <Input label="Delivery At" id="deliveryAt" name="deliveryAt" value={form.deliveryAt} onChange={handleChange} required />
              <Input label="Freight Upto At" id="freightUptoAt" name="freightUptoAt" value={form.freightUptoAt} onChange={handleChange} required />
            </div>
          </div>

          {/* --- Contents --- */}
          <div>
            <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">Contents</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Input label="Quantity" id="quantity" name="quantity" type="number" value={form.quantity} onChange={handleChange} required />
              <AutocompleteInput
                label="Packing"
                options={packingOptions}
                value={form.packing}
                onSelect={(value) => handleFormValueChange('packing', value)}
                placeholder="Type to search packing..."
              />
              <div className="md:col-span-2">
                <AutocompleteInput
                  label="Contents"
                  options={contentsOptions}
                  value={form.contents}
                  onSelect={(value) => handleFormValueChange('contents', value)}
                  placeholder="Type to search contents..."
                />
              </div>
              <Input label="Prefix" id="prefix" name="prefix" value={form.prefix} onChange={handleChange} />
              <Input label="From No" id="fromNo" name="fromNo" type="number" value={form.fromNo} onChange={handleChange} />
              <Input label="To No" id="toNo" name="toNo" value={toNo > 0 ? toNo : ''} disabled />
              <Input label="Net Qty" id="netQty" name="netQty" type="number" value={form.netQty} onChange={handleChange} required />
            </div>
          </div>
          
          {/* --- Billing & Payment --- */}
          <div>
            <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">Billing & Payment</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Input label="Bill No" id="billNo" name="billNo" value={form.billNo} onChange={handleChange} />
              <Input label="Bill Value" id="billValue" name="billValue" type="number" value={form.billValue} onChange={handleChange} />
              <Input label="Toll Fee" id="tollFee" name="tollFee" type="number" value={form.tollFee} onChange={handleChange} />
              <Input label="Freight" id="freight" name="freight" type="number" value={form.freight} onChange={handleChange} />
              <Input label="Godown Charge" id="godownCharge" name="godownCharge" type="number" value={form.godownCharge} onChange={handleChange} />
              <Input label="Statistic Charge" id="statisticCharge" name="statisticCharge" type="number" value={form.statisticCharge} onChange={handleChange} />
              <Input label="Advance None" id="advanceNone" name="advanceNone" type="number" value={form.advanceNone} onChange={handleChange} />
              <Input label="Balance ToPay" id="balanceToPay" name="balanceToPay" type="number" value={form.balanceToPay} onChange={handleChange} />
              
              <div className="md:col-span-4">
                <RadioGroup
                  label="Paid Type"
                  options={[ { value: 'To Pay', label: 'To Pay' }, { value: 'Paid', label: 'Paid' } ]}
                  value={form.paidType}
                  onChange={(value) => handleFormValueChange('paidType', value)}
                  required
                />
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* --- Sticky Footer Actions --- */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 p-4 bg-background/90 backdrop-blur-sm sticky bottom-0 border-t border-muted rounded-b-lg">
        <Button 
          type="button" 
          variant="secondary" 
          className="w-full sm:w-auto"
          onClick={() => navigate('/gc-entry')}
        >
          Cancel
        </Button>
        <Button 
          type="button" 
          variant="secondary" 
          className="w-full sm:w-auto"
          onClick={() => handleSave(true)}
        >
          <Printer size={16} className="mr-2" />
          Save & Print GC
        </Button>
        <Button 
          type="button" 
          variant="primary" 
          className="w-full sm:w-auto"
          onClick={() => handleSave(false)}
        >
          <Save size={16} className="mr-2" />
          {isEditMode ? 'Save Changes' : 'Save GC'}
        </Button>
      </div>
    </form>
  );
};