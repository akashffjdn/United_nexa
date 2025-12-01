export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string; 
  mobile: string;
  role: 'admin' | 'user';
  createdBy?: string;
  updatedBy?: string;
}

export interface Consignor {
  id: string;
  name: string;
  from: string;
  filingDate: string;
  gst: string;
  pan?: string;
  aadhar?: string;
  mobile?: string;
  address: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Consignee {
  id: string;
  consignorId?: string;
  name: string;
  
  gst?: string;
  pan?: string;
  aadhar?: string;

  filingDate: string;
  address: string;
  phone: string;
  destination: string;
  mobile?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface GcEntry {
  // Optional legacy fields
  date?: string;
  invoiceDate?: string;
  invoiceNo?: string;
  pkgDesc?: string;
  marks?: any;
  
  gcNo: string; 
  id: string;
  gcDate: string;
  from: string;
  destination: string;

  consignorId: string;
  consigneeId: string;

  consigneeProofType: 'gst' | 'pan' | 'aadhar';
  consigneeProofValue: string;

  billDate: string;
  deliveryAt: string;
  freightUptoAt: string;
  godown: string;

  billNo: string;
  billValue: string;
  tollFee: string;
  freight: string;
  godownCharge: string;
  statisticCharge: string;
  advanceNone: string;
  balanceToPay: string;

  quantity: string;
  packing: string;
  contents: string;
  prefix: string;
  fromNo: string;
  netQty: string;

  paymentType: 'To Pay' | 'Paid'; 

  // Trip Sheet & Loading Fields
  tripSheetId?: string | null;
  isLoaded?: boolean;
  loadingStatus?: 'Pending' | 'Partially Loaded' | 'Loaded';
  
  loadedPackages?: number[]; 

  // Audit Fields
  createdBy?: string;
  updatedBy?: string;
}

export interface FromPlace {
    id: string;
    placeName: string;
    shortName: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface ToPlace {
    id: string;
    placeName: string;
    shortName: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface PackingEntry {
  id: string;
  packingName: string;
  shortName: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ContentEntry {
  id: string;
  contentName: string;
  shortName: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface VehicleEntry {
  id: string;
  vehicleNo: string;
  vehicleName: string;
  ownerName?: string;
  ownerMobile?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface DriverEntry {
  id: string;
  driverName: string;
  dlNo: string;
  mobile: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface TripSheetGCItem {
  gcNo: string;
  qty: number;
  rate: number;
  qtyDts?: string;
  packingDts?: string;
  contentDts?: string;
  consignor?: string;
  consignee?: string;
  amount: number;
}

export interface TripSheetEntry {
  id: string;
  mfNo: string;
  tsDate: string;
  carriers?: string;
  fromPlace: string;
  toPlace: string;
  items: TripSheetGCItem[];
  unloadPlace?: string;
  totalAmount: number;
  driverName?: string;
  dlNo?: string;
  driverMobile?: string;
  ownerName?: string;
  ownerMobile?: string;
  lorryNo?: string;
  lorryName?: string;
  consignorid?: string; 
  consigneeid?: string;
  createdBy?: string;
  updatedBy?: string;
}