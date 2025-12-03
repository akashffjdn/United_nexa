import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Trash2, X } from "lucide-react";

import type { TripSheetEntry, TripSheetGCItem } from "../../types";
import { Button } from "../../components/shared/Button";
import { Input } from "../../components/shared/Input";
import { AsyncAutocomplete } from "../../components/shared/AsyncAutocomplete"; // 🟢 Updated Import
import { useData } from "../../hooks/useData";
import { getTodayDate } from "../../utils/dateHelpers";
import api from "../../utils/api";
import { useToast } from "../../contexts/ToastContext";

const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// Helper function to check for non-empty or non-zero value
const isValueValid = (value: any): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return !!value; 
};

const getValidationProp = (value: any) => ({
    hideRequiredIndicator: isValueValid(value)
});

export const TripSheetForm = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>(); 

  const {
    addTripSheet,
    updateTripSheet,
    fetchTripSheetById, 
    fetchGcDetailsForTripSheet, 
    // 🟢 Search functions from DataContext
    searchFromPlaces,
    searchToPlaces,
    searchDrivers,
    searchVehicles
  } = useData();

  const isEditMode = !!id;
  
  // --- STATE INITIALIZATION ---
  const [mfNo, setMfNo] = useState<string>("");
  const [tsDate, setTsDate] = useState<string>(getTodayDate());
  const [carriers, setCarriers] = useState<string>("");
  const [fromPlace, setFromPlace] = useState<string>("Sivakasi");
  const [toPlace, setToPlace] = useState<string>("");
  const [items, setItems] = useState<TripSheetGCItem[]>([]);
  const [unloadPlace, setUnloadPlace] = useState<string>("");
  const [driverName, setDriverName] = useState<string>("");
  const [dlNo, setDlNo] = useState<string>("");
  const [driverMobile, setDriverMobile] = useState<string>("");
  const [lorryNo, setLorryNo] = useState<string>("");
  const [lorryName, setLorryName] = useState<string>("");
  const [ownerName, setOwnerName] = useState<string>("");
  const [ownerMobile, setOwnerMobile] = useState<string>("");

  // 🟢 Option States for AsyncDropdowns (to show labels correctly)
  const [fromPlaceOption, setFromPlaceOption] = useState<any>({ label: 'Sivakasi', value: 'Sivakasi' });
  const [toPlaceOption, setToPlaceOption] = useState<any>(null);
  const [gcOption, setGcOption] = useState<any>(null);
  const [driverDlOption, setDriverDlOption] = useState<any>(null);
  const [driverNameOption, setDriverNameOption] = useState<any>(null);
  const [driverMobileOption, setDriverMobileOption] = useState<any>(null);
  const [lorryNoOption, setLorryNoOption] = useState<any>(null);
  const [lorryNameOption, setLorryNameOption] = useState<any>(null);

  const [loading, setLoading] = useState(isEditMode);

  // --- LOAD DATA (Edit Mode) ---
  useEffect(() => {
    if (isEditMode && id) {
      const loadData = async () => {
        const sheet = await fetchTripSheetById(id);
        
        if (sheet) {
            setMfNo(sheet.mfNo);
            setTsDate(sheet.tsDate);
            setCarriers(sheet.carriers ?? "");
            setFromPlace(sheet.fromPlace);
            setToPlace(sheet.toPlace);
            
            // Initialize Option States for Display
            setFromPlaceOption({ label: sheet.fromPlace, value: sheet.fromPlace });
            setToPlaceOption({ label: sheet.toPlace, value: sheet.toPlace });

            const mappedItems = (sheet.items ?? []).map(item => ({
                ...item,
                rate: item.rate ?? (item as any).freight ?? 0,
            }));
            setItems(mappedItems);

            setUnloadPlace(sheet.unloadPlace ?? "");
            setDriverName(sheet.driverName ?? "");
            setDlNo(sheet.dlNo ?? "");
            setDriverMobile(sheet.driverMobile ?? "");
            setLorryNo(sheet.lorryNo ?? "");
            setLorryName(sheet.lorryName ?? "");
            setOwnerName(sheet.ownerName ?? "");
            setOwnerMobile(sheet.ownerMobile ?? "");
            
            // Set Driver/Lorry Options
            if(sheet.driverName) setDriverNameOption({ label: sheet.driverName, value: sheet.driverName });
            if(sheet.dlNo) setDriverDlOption({ label: sheet.dlNo, value: sheet.dlNo });
            if(sheet.driverMobile) setDriverMobileOption({ label: sheet.driverMobile, value: sheet.driverMobile });
            if(sheet.lorryNo) setLorryNoOption({ label: sheet.lorryNo, value: sheet.lorryNo });
            if(sheet.lorryName) setLorryNameOption({ label: sheet.lorryName, value: sheet.lorryName });

            setLoading(false);
        } else {
            toast.error("Trip Sheet not found.");
            navigate("/trip-sheet");
        }
      };
      loadData();
    } else {
        setLoading(false);
    }
  }, [isEditMode, id, fetchTripSheetById, navigate]);

  // --- ASYNC LOADERS ---

  // 1. GC Search (Direct API call)
  const loadGcOptions = async (search: string, _prev: any, { page }: any) => {
      try {
          const { data } = await api.get('/operations/gc', {
              params: {
                  search,
                  page,
                  limit: 20,
                  availableForTripSheet: 'true' // Filter backend-side
              }
          });
          return {
              options: data.data.map((g: any) => ({ 
                  value: g.gcNo, 
                  label: g.gcNo,
                  freight: g.freight // Carry extra data
              })),
              hasMore: data.page < data.pages,
              additional: { page: page + 1 }
          };
      } catch (e) {
          return { options: [], hasMore: false, additional: { page: 1 } };
      }
  };

  // 2. Place Search
  const loadFromPlaceOptions = async (search: string, _prev: any, { page }: any) => {
      const res = await searchFromPlaces(search, page);
      return {
          options: res.data.map((p: any) => ({ value: p.placeName, label: p.placeName })),
          hasMore: res.hasMore,
          additional: { page: page + 1 }
      };
  };

  const loadToPlaceOptions = async (search: string, _prev: any, { page }: any) => {
      const res = await searchToPlaces(search, page);
      return {
          options: res.data.map((p: any) => ({ value: p.placeName, label: p.placeName })),
          hasMore: res.hasMore,
          additional: { page: page + 1 }
      };
  };

  // 3. Driver Search (Generic)
  const loadDriverOptions = async (search: string, _prev: any, { page }: any) => {
      const res = await searchDrivers(search, page);
      return {
          options: res.data.map((d: any) => ({ 
              value: d.id, // Using ID as unique key
              label: d.driverName, // Default label (overridden in render if needed)
              ...d // Carry all driver data
          })),
          hasMore: res.hasMore,
          additional: { page: page + 1 }
      };
  };

  // 4. Vehicle Search
  const loadVehicleOptions = async (search: string, _prev: any, { page }: any) => {
      const res = await searchVehicles(search, page);
      return {
          options: res.data.map((v: any) => ({ 
              value: v.id, 
              label: v.vehicleNo,
              ...v
          })),
          hasMore: res.hasMore,
          additional: { page: page + 1 }
      };
  };


  // --- FORM LOGIC ---

  const [gcNo, setGcNo] = useState<string>("");
  const [qty, setQty] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  
  // Handler for GC Select
  const handleGcSelect = (option: any) => {
    setGcOption(option);
    if (option) {
        setGcNo(option.value);
        // Auto-fill Freight/Rate from option data
        setRate(parseFloat(option.freight) || 0);
    } else {
        setGcNo("");
        setRate(0);
    }
  };

  const resetGC = () => {
    setGcNo("");
    setGcOption(null);
    setQty(0);
    setRate(0);
  };

  // Async Add GC
  const handleAddGC = async () => {
    if (!gcNo) {
      toast.error("Please select a GC No before adding.");
      return;
    }
    if (!rate) { toast.error("Please select QTY RATE."); return; }

    // Check if already added
    if (items.some(i => i.gcNo === gcNo)) {
        toast.error("This GC is already added to the list.");
        return;
    }

    try {
        const details = await fetchGcDetailsForTripSheet(gcNo);
        
        if (!details) {
            toast.error("Failed to fetch details for this GC.");
            return;
        }

        const finalQty = qty > 0 ? qty : (details.quantity || 0);

        const row: TripSheetGCItem = {
          gcNo,
          qty: finalQty,
          rate, 
          packingDts: details.packing || "",
          contentDts: details.contents || "",
          consignor: details.consignor?.name || "",
          consignee: details.consignee?.name || "",
          amount: finalQty * rate,
        };

        setItems((p) => [...p, row]);
        resetGC();

    } catch (err) {
        console.error("Error adding GC row", err);
        toast.error("Error adding GC. Please try again.");
    }
  };

  const handleDeleteGC = (i: number) => {
    setItems((p) => p.filter((_, idx) => idx !== i));
  };

  const totalAmount = useMemo(
    () => items.reduce((s, it) => s + toNum(it.amount), 0),
    [items]
  );

  useEffect(() => {
    if (!isEditMode) setUnloadPlace(toPlace);
  }, [toPlace, isEditMode]);

  // --- Driver Selection Handlers ---
  const handleDriverSelect = (option: any) => {
      if (!option) return;
      setDriverName(option.driverName.toUpperCase());
      setDlNo(option.dlNo);
      setDriverMobile(option.mobile);

      // Update all dropdowns to match selection
      setDriverNameOption({ value: option.id, label: option.driverName.toUpperCase() });
      setDriverDlOption({ value: option.id, label: option.dlNo });
      setDriverMobileOption({ value: option.id, label: option.mobile });
  };

  // --- Vehicle Selection Handlers ---
  const handleVehicleSelect = (option: any) => {
      if (!option) return;
      setLorryNo(option.vehicleNo);
      setLorryName(option.vehicleName.toUpperCase());
      setOwnerName(option.ownerName ? option.ownerName.toUpperCase() : "");
      setOwnerMobile(option.ownerMobile ?? "");
      
      // Update dropdowns
      setLorryNoOption({ value: option.id, label: option.vehicleNo });
      setLorryNameOption({ value: option.id, label: option.vehicleName.toUpperCase() });
  };

  const onOwnerNameChange = (v: string) => setOwnerName(v.toUpperCase());

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isEditMode && !id) return;

    let finalMfNo = mfNo;
    if (!isEditMode) finalMfNo = ""; 

    const payload: TripSheetEntry = {
      id: id || "", 
      mfNo: finalMfNo,
      tsDate,
      carriers,
      fromPlace,
      toPlace,
      items, 
      unloadPlace,
      totalAmount,
      driverName,
      dlNo,
      driverMobile,
      ownerName,
      ownerMobile,
      lorryNo,
      lorryName,
    };

    if (isEditMode) await updateTripSheet(payload);
    else await addTripSheet(payload);

    navigate("/trip-sheet");
  };

  if (loading && isEditMode) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-5.5rem)]">
            <div className="animate-pulse text-primary font-semibold">Loading Trip Sheet Data...</div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)]"> 
      <div className="flex-1 overflow-y-auto p-1">
        <form onSubmit={handleSave} className="bg-background rounded-xl shadow-sm border border-muted p-6 space-y-6 text-sm">
          
          <div>
           <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">Trip Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4">
              <div className="col-span-1 lg:col-span-2">
                <Input
                  type="date"
                  label="Trip Date"
                  value={tsDate}
                  onChange={(e) => setTsDate(e.target.value)}
                  required
                  {...getValidationProp(tsDate)}
                />
              </div>
              <div className="col-span-1 lg:col-span-2">
                <AsyncAutocomplete
                  label="From Place"
                  placeholder="Select From Place"
                  loadOptions={loadFromPlaceOptions}
                  value={fromPlaceOption}
                  onChange={(v: any) => {
                      setFromPlaceOption(v);
                      setFromPlace(v?.value || '');
                  }}
                  required
                  defaultOptions
                  {...getValidationProp(fromPlace)}
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                <AsyncAutocomplete
                  label="To Place"
                  placeholder="Select To Place"
                  loadOptions={loadToPlaceOptions}
                  value={toPlaceOption}
                  onChange={(v: any) => { 
                      setToPlaceOption(v);
                      const val = v?.value || '';
                      setToPlace(val); 
                      if(!isEditMode) setUnloadPlace(val); 
                  }}
                  required
                  defaultOptions
                  {...getValidationProp(toPlace)}
                />
              </div>

              <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                <Input
                  label="Carriers"
                  value={carriers}
                  onChange={(e) => setCarriers(e.target.value)}
                  required
                  {...getValidationProp(carriers)}
                />
              </div>
            </div>
          </div>

          <section>
            <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">
              GC Details
            </h3>

            <div className="border border-muted rounded-md p-4 space-y-4 bg-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4 items-end">
                <div className="col-span-1 sm:col-span-1 lg:col-span-4">
                  <AsyncAutocomplete
                    label="Select GC No"
                    placeholder="Search Pending GC..."
                    loadOptions={loadGcOptions}
                    value={gcOption}
                    onChange={(v: any) => handleGcSelect(v)}
                    required
                    defaultOptions
                    {...getValidationProp(gcNo)}
                  />
                </div>

                <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                  <Input
                    label="QTY RATE"
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value) || 0)}
                    required
                    {...getValidationProp(rate)}
                  />
                </div>

                <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                  <Button type="button" variant="primary" className="w-full" onClick={handleAddGC}>
                    Add GC
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-muted text-sm">
                  <thead>
                    <tr className="bg-muted/20">
                      <th className="border border-muted p-2">GCNO</th>
                      <th className="border border-muted p-2">QTY</th>
                      <th className="border border-muted p-2">RATE</th>
                      <th className="border border-muted p-2">PACKING</th>
                      <th className="border border-muted p-2">CONTENT</th>
                      <th className="border border-muted p-2">CONSIGNOR</th>
                      <th className="border border-muted p-2">CONSIGNEE</th>
                      <th className="border border-muted p-2">AMOUNT</th>
                      <th className="border border-muted p-2">DEL</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i}>
                        <td className="border border-muted p-2">{it.gcNo}</td>
                        <td className="border border-muted p-2">{it.qty}</td>
                        <td className="border border-muted p-2">{it.rate}</td>
                        <td className="border border-muted p-2">{it.packingDts}</td>
                        <td className="border border-muted p-2">{it.contentDts}</td>
                        <td className="border border-muted p-2">{it.consignor}</td>
                        <td className="border border-muted p-2">{it.consignee}</td>
                        <td className="border border-muted p-2">₹{it.amount.toLocaleString("en-IN")}</td>
                        <td className="border border-muted p-2 text-center">
                          <button type="button" className="text-red-600" onClick={() => handleDeleteGC(i)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center p-3 text-muted-foreground">
                          No GC rows added.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

            <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">
              Driver Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-4">
              <div className="col-span-1 lg:col-span-2">
                {/* DL No Filter - Adapts generic driver loader to show DL as label */}
                <AsyncAutocomplete
                  label="DL No"
                  placeholder="Select DL No"
                  loadOptions={async (s, p, a) => {
                      const res = await loadDriverOptions(s, p, a);
                      res.options = res.options.map((o: any) => ({ ...o, label: o.dlNo }));
                      return res;
                  }}
                  value={driverDlOption}
                  onChange={(v: any) => handleDriverSelect(v)}
                  required
                  defaultOptions
                  {...getValidationProp(dlNo)}
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                {/* Mobile Filter */}
                <AsyncAutocomplete
                  label="Driver Mobile"
                  placeholder="Select Mobile"
                  loadOptions={async (s, p, a) => {
                      const res = await loadDriverOptions(s, p, a);
                      res.options = res.options.map((o: any) => ({ ...o, label: o.mobile }));
                      return res;
                  }}
                  value={driverMobileOption}
                  onChange={(v: any) => handleDriverSelect(v)}
                  required
                  defaultOptions
                  {...getValidationProp(driverMobile)}
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                 {/* Name Filter */}
                <AsyncAutocomplete
                  label="Driver Name"
                  placeholder="Select Driver Name"
                  loadOptions={loadDriverOptions}
                  value={driverNameOption}
                  onChange={(v: any) => handleDriverSelect(v)}
                  required
                  defaultOptions
                  {...getValidationProp(driverName)}
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                {/* Lorry No Filter */}
                <AsyncAutocomplete
                  label="Lorry No"
                  placeholder="Select Lorry No"
                  loadOptions={loadVehicleOptions}
                  value={lorryNoOption}
                  onChange={(v: any) => handleVehicleSelect(v)}
                  required
                  defaultOptions
                  {...getValidationProp(lorryNo)}
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                {/* Lorry Name Filter */}
                <AsyncAutocomplete
                  label="Lorry Name"
                  placeholder="Select Lorry Name"
                  loadOptions={async (s, p, a) => {
                      const res = await loadVehicleOptions(s, p, a);
                      res.options = res.options.map((o: any) => ({ ...o, label: o.vehicleName }));
                      return res;
                  }}
                  value={lorryNameOption}
                  onChange={(v: any) => handleVehicleSelect(v)}
                  required
                  defaultOptions
                  {...getValidationProp(lorryName)}
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                <Input
                  label="Owner Name"
                  value={ownerName}
                  onChange={(e) => onOwnerNameChange(e.target.value)}
                  readOnly={!!lorryNo}
                  required
                  {...getValidationProp(ownerName)}
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                <Input
                  label="Owner Mobile"
                  value={ownerMobile}
                  onChange={(e) => setOwnerMobile(e.target.value)}
                  required
                  {...getValidationProp(ownerMobile)}
                />
              </div>

              <div className="col-span-1 lg:col-span-4">
                <Input
                  label="Unload Place"
                  placeholder="Select Unload Place"
                  value={unloadPlace}
                  onChange={(e) => setUnloadPlace(e.target.value)}
                  required
                  {...getValidationProp(unloadPlace)}
                />
              </div>

              <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                <Input label="Total Rs." value={String(totalAmount)} readOnly />
              </div>
            </div>
        </form>
      </div>

      <div className="p-4 border-t border-muted bg-background flex flex-col sm:flex-row justify-end gap-3 mt-auto shadow-md z-10">
        <Button type="button" variant="secondary" onClick={() => navigate("/trip-sheet")}>
          <X size={16} className="mr-2" />
          Cancel
        </Button>

        <Button type="submit" variant="primary" onClick={handleSave}>
          <Save size={16} className="mr-2" />
          Save Trip Sheet
        </Button>
      </div>
    </div>
  );
};