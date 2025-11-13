import type { GcEntry, Consignor, Consignee } from '../../types';
import { numberToWordsInRupees } from '../../utils/toWords';
import Logo from '../../assets/company-logo.png'; // Make sure this path is correct

interface GcPrintCopyProps {
  gc: GcEntry;
  consignor: Consignor;
  consignee: Consignee;
  copyType: "CONSIGNOR COPY" | "CONSIGNEE COPY" | "LORRY COPY";
}

// Helper component for a single data field
const PrintField = ({ label, value, large = false }: { label: string, value: string | number | undefined, large?: boolean }) => (
  <div className="flex flex-col">
    <span className="text-xs font-semibold uppercase text-gray-600">{label}</span>
    <span className={`font-bold ${large ? 'text-lg' : 'text-sm'}`}>{value || '---'}</span>
  </div>
);

// Helper for bordered sections
const BorderedBox = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`border border-black p-2 ${className}`}>{children}</div>
);

export const GcPrintCopy = ({ gc, consignor, consignee, copyType }: GcPrintCopyProps) => {

  // --- Data Mapping Logic ---
  // 1. Bill Value from form -> "Balance To Pay" field on printout
  const printBalanceToPay = gc.billValue.toLocaleString('en-IN');
  // 2. Balance ToPay from form -> "To pay Rs." (in words)
  const printToPayWords = numberToWordsInRupees(gc.balanceToPay);
  
  // --- THIS IS THE FIX ---
  // The errors were because I was reading 'consignee.proof' which no longer exists.
  // The correct proof is saved in the 'gc' object.
  const consigneeProofDisplay = `${gc.consigneeProofType.toUpperCase()}: ${gc.consigneeProofValue}`;
  // --- END FIX ---

  return (
    <div className="print-page font-sans text-black">
      {/* Header */}
      <div className="grid grid-cols-3 gap-4 items-center border-b-2 border-black pb-2">
        <div className="col-span-1">
          <img src={Logo} alt="Company Logo" className="h-16" />
        </div>
        <div className="col-span-2 text-center">
          <h1 className="text-3xl font-bold">S.C. Transport</h1>
          <p className="text-sm">123 Main Road, Sivakasi, Tamil Nadu - 626123</p>
          <p className="text-sm font-semibold">GSTIN: 33ABCDE1234F1Z5</p>
        </div>
      </div>
      
      {/* Top Section */}
      <div className="flex justify-between items-center my-2">
        <h2 className="text-2xl font-bold">GC No: {gc.id}</h2>
        <span className="text-lg font-bold border border-black px-4 py-1">{copyType}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 border-y border-black py-2">
        <PrintField label="GC Date" value={gc.gcDate} />
        <PrintField label="From" value={gc.from} />
        <PrintField label="To (Destination)" value={gc.destination} />
        <PrintField label="Bill Date" value={gc.billDate} />
      </div>
      
      {/* Consignor/Consignee Section */}
      <div className="grid grid-cols-2 gap-px my-2 bg-black border border-black">
        <BorderedBox className="bg-white">
          <span className="text-xs font-semibold uppercase text-gray-600">Consignor</span>
          <p className="text-sm font-bold">{consignor.name}</p>
          <p className="text-xs">{consignor.address}</p>
          <p className="text-xs font-semibold mt-1">GSTIN: {consignor.gst}</p>
        </BorderedBox>
        <BorderedBox className="bg-white">
          <span className="text-xs font-semibold uppercase text-gray-600">Consignee</span>
          <p className="text-sm font-bold">{consignee.name}</p>
          <p className="text-xs">{consignee.address}</p>
          {/* This line is now fixed */}
          <p className="text-xs font-semibold mt-1">Proof: {consigneeProofDisplay}</p>
        </BorderedBox>
      </div>
      
      {/* Routing Section */}
      <div className="grid grid-cols-3 gap-px bg-black border border-black">
        <BorderedBox className="bg-white"><PrintField label="Delivery At" value={gc.deliveryAt} /></BorderedBox>
        <BorderedBox className="bg-white"><PrintField label="Freight Upto At" value={gc.freightUptoAt} /></BorderedBox>
        <BorderedBox className="bg-white"><PrintField label="Bill No" value={gc.billNo} /></BorderedBox>
      </div>

      {/* Contents Section */}
      <div className="grid grid-cols-5 gap-px my-2 bg-black border border-black">
        <BorderedBox className="bg-white"><PrintField label="Quantity" value={gc.quantity} /></BorderedBox>
        <BorderedBox className="bg-white"><PrintField label="Packing" value={gc.packing} /></BorderedBox>
        <BorderedBox className="bg-white col-span-2"><PrintField label="Contents" value={gc.contents} /></BorderedBox>
        <BorderedBox className="bg-white"><PrintField label="Net Qty" value={gc.netQty} /></BorderedBox>
        <BorderedBox className="bg-white col-span-5">
          <PrintField 
            label="Prefix / Marks" 
            value={`${gc.prefix} ${gc.fromNo} to ${(gc.fromNo > 0 && gc.quantity > 0) ? (gc.fromNo + gc.quantity) - 1 : ''}`} 
          />
        </BorderedBox>
      </div>
      
      {/* Billing Section */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-2">
          <BorderedBox>
            <span className="text-xs font-semibold uppercase text-gray-600">To pay Rs. (in words)</span>
            <p className="text-sm font-bold">{printToPayWords}</p>
          </BorderedBox>
          <BorderedBox>
            <p className="text-xs">Note: Goods are carried at owner's risk. No responsibility for leakage, breakage, or fire.</p>
          </BorderedBox>
        </div>
        <div className="col-span-1 space-y-px bg-black border border-black">
          <BorderedBox className="bg-white flex justify-between items-center"><span className="text-xs">Toll Fee</span> <span className="text-sm font-bold">{gc.tollFee}</span></BorderedBox>
          <BorderedBox className="bg-white flex justify-between items-center"><span className="text-xs">Freight</span> <span className="text-sm font-bold">{gc.freight}</span></BorderedBox>
          <BorderedBox className="bg-white flex justify-between items-center"><span className="text-xs">Godown Charge</span> <span className="text-sm font-bold">{gc.godownCharge}</span></BorderedBox>
          <BorderedBox className="bg-white flex justify-between items-center"><span className="text-xs">Statistic Charge</span> <span className="text-sm font-bold">{gc.statisticCharge}</span></BorderedBox>
          <BorderedBox className="bg-white flex justify-between items-center"><span className="text-xs">Advance None</span> <span className="text-sm font-bold">{gc.advanceNone}</span></BorderedBox>
          <BorderedBox className="bg-gray-100 flex justify-between items-center">
            <span className="text-sm font-bold">Balance To Pay</span>
            <span className="text-lg font-bold">₹{printBalanceToPay}</span>
          </BorderedBox>
          <BorderedBox className="bg-gray-100 flex justify-center items-center">
            <span className="text-lg font-bold">{gc.paidType}</span>
          </BorderedBox>
        </div>
      </div>
      
      {/* Footer */}
      <div className="grid grid-cols-2 gap-4 mt-20 pt-2 border-t border-dashed border-black">
        <div className="text-center">
          <p className="text-sm font-bold">(Signature)</p>
          <p className="text-xs">Consignor / Sender</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold">For S.C. Transport</p>
          <p className="text-xs">Authorised Signatory</p>
        </div>
      </div>
    </div>
  );
};