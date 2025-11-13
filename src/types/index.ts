export interface Consignor {
  id: string;
  name: string;
  from: string; // This is used for the GC Form
  filingDate: string; // ISO date string (e.g., "2025-11-12")
  gst: string;
  pan?: string;
  aadhar?: string;
  mobile?: string;
  address: string;
}

export interface Consignee {
  id: string;
  consignorId?: string; // To link to a consignor (now optional)
  name: string;
  
  // --- THIS IS THE FIX ---
  // The 'proof' object is removed
  // We now use optional, separate fields for each proof
  gst?: string;
  pan?: string;
  aadhar?: string;
  // --- END FIX ---

  filingDate: string; // ISO date string
  address: string;
  phone: string;
  destination: string;
}

// This interface holds all the data for a single GC Entry
export interface GcEntry {
  id: string; // This will be the GC No
  gcDate: string; // ISO date string
  from: string;
  destination: string;

  consignorId: string;
  consigneeId: string;

  // Stores which proof was selected *for this specific GC*
  consigneeProofType: 'gst' | 'pan' | 'aadhar';
  consigneeProofValue: string;

  // Editable location fields
  billDate: string; // ISO date string
  deliveryAt: string;
  freightUptoAt: string;

  // Billing & Charges
  billNo: string;
  billValue: number;
  tollFee: number;
  freight: number;
  godownCharge: number;
  statisticCharge: number;
  advanceNone: number;
  balanceToPay: number;

  // Quantity & Contents
  quantity: number;
  packing: string; // e.g., "BOXES"
  contents: string; // e.g., "FW"
  prefix: string; // e.g., "Case No."
  fromNo: number;
  // toNo is calculated: (fromNo + quantity) - 1
  netQty: number;

  // Payment Type
  paidType: 'To Pay' | 'Paid';
}