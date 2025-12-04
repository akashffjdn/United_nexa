import { z } from 'zod';

// --- Helper: Coerce inputs to numbers, defaulting to 0 if missing/invalid ---
// This handles strings from HTML inputs ("100", "", etc.) automatically.
const optionalNumericString = z.coerce.number().default(0);

// --- 1. Auth Schemas ---
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mobile: z.string().length(10, "Mobile number must be 10 digits").regex(/^\d+$/, "Mobile must be numeric"),
  role: z.enum(['admin', 'user']).optional(),
});

// --- 2. Master Data Schemas ---
export const consignorSchema = z.object({
  name: z.string().min(1, "Consignor Name is required"),
  gst: z.string().min(1, "GST Number is required"),
  address: z.string().min(1, "Address is required"),
  mobile: z.string().optional(),
  from: z.string().default('Sivakasi'),
});

// 🟢 UPDATED: Consignee Schema with "At least one proof" validation
export const consigneeSchema = z.object({
  name: z.string().min(1, "Consignee Name is required"),
  destination: z.string().min(1, "Destination is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone/Mobile is required"),
  gst: z.string().optional(),
  pan: z.string().optional(),
  aadhar: z.string().optional(),
}).refine((data) => {
  const hasGst = data.gst && data.gst.trim().length > 0;
  const hasPan = data.pan && data.pan.trim().length > 0;
  const hasAadhar = data.aadhar && data.aadhar.trim().length > 0;
  return hasGst || hasPan || hasAadhar;
}, {
  message: "At least one proof (GST, PAN, or Aadhar) is required",
  path: ["gst"], // Attach error to GST field so it shows up in the form
});

export const vehicleSchema = z.object({
  vehicleNo: z.string().min(1, "Vehicle Number is required"),
  vehicleName: z.string().min(1, "Vehicle Name is required"),
  ownerName: z.string().optional(),
  ownerMobile: z.string().optional(),
});

export const driverSchema = z.object({
  driverName: z.string().min(1, "Driver Name is required"),
  dlNo: z.string().min(1, "License Number (DL) is required"),
  mobile: z.string().min(1, "Mobile Number is required"),
});

export const placeSchema = z.object({
  placeName: z.string().min(1, "Place Name is required"),
  shortName: z.string().min(1, "Short Name is required"),
});

export const packingSchema = z.object({
  packingName: z.string().min(1, "Packing Name is required"),
  shortName: z.string().min(1, "Short Name is required"),
});

export const contentSchema = z.object({
  contentName: z.string().min(1, "Content Name is required"),
  shortName: z.string().min(1, "Short Name is required"),
});

// --- 3. Operations Schemas ---

export const gcEntrySchema = z.object({
  gcDate: z.string().min(1, "GC Date is required"),
  from: z.string().min(1, "From Place is required"),
  destination: z.string().min(1, "Destination is required"),
  consignorId: z.string().min(1, "Consignor is required"),
  consigneeId: z.string().min(1, "Consignee is required"),
  
  // Numeric Fields (Coerced)
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  netQty: z.coerce.number().min(1, "Net Quantity is required"),
  fromNo: z.coerce.number().min(1, "From No is required"),
  
  packing: z.string().min(1, "Packing type is required"),
  contents: z.string().min(1, "Contents description is required"),
  
  deliveryAt: z.string().min(1, "Delivery At is required"),
  freightUptoAt: z.string().min(1, "Freight Upto is required"),
  paymentType: z.enum(['Paid', 'To Pay']),

  billNo: z.string().min(1, "Bill No is required"),
  billDate: z.string().min(1, "Bill Date is required"),
  billValue: optionalNumericString, 

  // Charges (Optional/Default 0)
  tollFee: optionalNumericString,
  freight: optionalNumericString,
  godownCharge: optionalNumericString,
  statisticCharge: optionalNumericString,
  advanceNone: optionalNumericString,
  balanceToPay: optionalNumericString,
});

export const tripSheetSchema = z.object({
  tsDate: z.string().min(1, "Trip Sheet Date is required"),
  fromPlace: z.string().min(1, "From Place is required"),
  toPlace: z.string().min(1, "To Place is required"),
  carriers: z.string().min(1, "Carriers is required"),
  unloadPlace: z.string().min(1, "Unload Place is required"),
  
  lorryNo: z.string().min(1, "Lorry No is required"),
  lorryName: z.string().min(1, "Lorry Name is required"),
  driverName: z.string().min(1, "Driver Name is required"),
  driverMobile: z.string().min(1, "Driver Mobile is required"),
  dlNo: z.string().min(1, "DL No is required"),
  ownerName: z.string().min(1, "Owner Name is required"),
  ownerMobile: z.string().min(1, "Owner Mobile is required"),

  items: z.array(z.any()).min(1, "At least one GC entry must be added to the Trip Sheet"),
});