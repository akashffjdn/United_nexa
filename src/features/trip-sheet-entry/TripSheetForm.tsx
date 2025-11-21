import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {  Save, Trash2 } from "lucide-react";

import type { TripSheetEntry, TripSheetGCItem } from "../../types";
import { Button } from "../../components/shared/Button";
import { Input } from "../../components/shared/Input";
import { AutocompleteInput } from "../../components/shared/AutocompleteInput";
import { useData } from "../../hooks/useData";
import { getTodayDate } from "../../utils/dateHelpers";

const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export const TripSheetForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const {
    addTripSheet,
    updateTripSheet,
    tripSheets,
    consignors,
    consignees,
    gcEntries,
    fromPlaces,
    toPlaces,
    driverEntries,
    vehicleEntries,
  } = useData();

  const editing = tripSheets.find((t) => t.id === id || t.mfNo === id);

  const [mfNo, setMfNo] = useState<string | undefined>(editing?.mfNo);
  const [tsDate, setTsDate] = useState(editing?.tsDate ?? getTodayDate());

  const [carriers, setCarriers] = useState(editing?.carriers ?? "");
  const [fromPlace, setFromPlace] = useState(editing?.fromPlace ?? "Sivakasi");
  const [toPlace, setToPlace] = useState(editing?.toPlace ?? "");

  const [items, setItems] = useState<TripSheetGCItem[]>(editing?.items ?? []);

  const [gcNo, setGcNo] = useState("");
  const [qty, setQty] = useState(0);
  const [rate, setRate] = useState(0);
  const [packingDts, setPackingDts] = useState("");
  const [contentDts, setContentDts] = useState("");
  const [itemConsignor, setItemConsignor] = useState("");
  const [itemConsignee, setItemConsignee] = useState("");

  const loadGc = (selectedGcNo: string) => {
    const gc = gcEntries.find((g) => g.id === selectedGcNo);
    if (!gc) return null;

    return {
      qty: parseFloat(gc.quantity) || 0,
      rate: parseFloat(gc.freight) || 0,
      packingDts: gc.packing,
      contentDts: gc.contents,
      consignor: consignors.find((c) => c.id === gc.consignorId)?.name ?? "",
      consignee: consignees.find((c) => c.id === gc.consigneeId)?.name ?? "",
    };
  };

  const handleGcChange = (value: string) => {
    setGcNo(value);
    const g = loadGc(value);
    if (!g) return;
    setQty(g.qty);
    setRate(g.rate);
    setPackingDts(g.packingDts);
    setContentDts(g.contentDts);
    setItemConsignor(g.consignor);
    setItemConsignee(g.consignee);
  };

  const resetGC = () => {
    setGcNo("");
    setQty(0);
    setRate(0);
    setPackingDts("");
    setContentDts("");
    setItemConsignor("");
    setItemConsignee("");
  };

  const handleAddGC = () => {
    if (!gcNo) return alert("Please select a GC No");

    const row: TripSheetGCItem = {
      gcNo,
      qty,
      rate,
      packingDts,
      contentDts,
      consignor: itemConsignor,
      consignee: itemConsignee,
      amount: qty * rate,
    };

    setItems((p) => [...p, row]);
    resetGC();
  };

  const handleDeleteGC = (i: number) => {
    setItems((p) => p.filter((_, idx) => idx !== i));
  };

  const totalAmount = useMemo(
    () => items.reduce((s, it) => s + toNum(it.amount), 0),
    [items]
  );

  const [unloadPlace, setUnloadPlace] = useState(editing?.unloadPlace ?? "");
  useEffect(() => {
    if (!editing) setUnloadPlace(toPlace);
  }, [toPlace, editing]);

  // --------------------------------
  // DRIVER FIELDS
  // --------------------------------
  const [driverName, setDriverName] = useState(editing?.driverName ?? "");
  const [dlNo, setDlNo] = useState(editing?.dlNo ?? "");
  const [driverMobile, setDriverMobile] = useState(editing?.driverMobile ?? "");

  // Driver name lock rule (readonly when DL or Mobile selected)
  const driverNameReadonly = dlNo !== "" || driverMobile !== "";

  const driverDlOptions = driverEntries.map((d) => ({
    value: d.dlNo,
    label: d.dlNo,
  }));

  const driverNameOptions = driverEntries.map((d) => ({
    value: d.driverName,
    label: d.driverName,
  }));

  const driverMobileOptions = driverEntries.map((d) => ({
    value: d.mobile,
    label: d.mobile,
  }));

  const fillDriverFromDl = (dl: string) => {
    const d = driverEntries.find((x) => x.dlNo === dl);
    if (!d) return;
    setDriverName(d.driverName);
    setDriverMobile(d.mobile);
    setDlNo(d.dlNo);
  };

  const fillDriverFromMobile = (mobile: string) => {
    const d = driverEntries.find((x) => x.mobile === mobile);
    if (!d) return;
    setDriverName(d.driverName);
    setDriverMobile(d.mobile);
    setDlNo(d.dlNo);
  };

  // --------------------------------
  // VEHICLE FIELDS
  // --------------------------------

  const [lorryNo, setLorryNo] = useState(editing?.lorryNo ?? "");
  const [lorryName, setLorryName] = useState(editing?.lorryName ?? "");

  const vehicleNoOptions = vehicleEntries.map((v) => ({
    value: v.vehicleNo,
    label: v.vehicleNo,
  }));

  const vehicleNameOptions = vehicleEntries.map((v) => ({
    value: v.vehicleName,
    label: v.vehicleName,
  }));

  const fillVehicleFromNo = (no: string) => {
    const v = vehicleEntries.find((x) => x.vehicleNo === no);
    if (!v) return;
    setLorryNo(v.vehicleNo);
    setLorryName(v.vehicleName);
  };

  // OWNER
  const [ownerName, setOwnerName] = useState(editing?.ownerName ?? "");
  const [ownerMobile, setOwnerMobile] = useState(editing?.ownerMobile ?? "");

  // GC Options
  const usedGCs = useMemo(() => {
    const arr: string[] = [];
    const all = JSON.parse(localStorage.getItem("tripSheets") || "[]");
    all.forEach((ts: TripSheetEntry) =>
      ts.items?.forEach((it) => arr.push(it.gcNo))
    );
    return arr;
  }, []);

  const gcOptions = gcEntries
    .filter((g) => {
      const isInForm = items.some((i) => i.gcNo === g.id);
      const isUsedElsewhere = usedGCs.includes(g.id);

      if (editing && isInForm) return true;
      return !isInForm && !isUsedElsewhere;
    })
    .map((g) => ({ value: g.id, label: g.id }));

  const fromPlaceOptions = fromPlaces.map((p) => ({
    value: p.placeName,
    label: p.placeName,
  }));

  const toPlaceOptions = toPlaces.map((p) => ({
    value: p.placeName,
    label: p.placeName,
  }));

  const generateNextMfNo = () => {
    if (!tripSheets.length) return "1";
    const max = Math.max(...tripSheets.map((t) => Number(t.mfNo || 0)));
    return String(max + 1);
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!tsDate) return alert("Please enter TripSheet date");
    if (!toPlace) return alert("Please select To Place");
    if (!unloadPlace) return alert("Select Unload Place");
    if (items.length === 0) return alert("Add at least 1 GC entry");

    let finalMfNo = mfNo;
    if (!editing) {
      finalMfNo = generateNextMfNo();
      setMfNo(finalMfNo);
    }

    const payload: TripSheetEntry = {
      id: finalMfNo!,
      mfNo: finalMfNo!,
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

    if (editing) updateTripSheet(payload);
    else addTripSheet(payload);

    navigate("/trip-sheet");
  };

  return (
    <div className="space-y-4 p-4">
      
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-background rounded-lg shadow border border-muted p-4 md:p-6 space-y-8">
          {/* TRIP DETAILS */}
          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">
              Trip Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <AutocompleteInput
                label="From Place"
                placeholder="Select From Place"
                options={fromPlaceOptions}
                value={fromPlace}
                onSelect={setFromPlace}
              />

              <Input
                type="date"
                label="Trip Date"
                value={tsDate}
                onChange={(e) => setTsDate(e.target.value)}
              />

              <AutocompleteInput
                label="To Place"
                placeholder="Select To Place"
                options={toPlaceOptions}
                value={toPlace}
                onSelect={setToPlace}
              />

              <AutocompleteInput
                label="Unload Place"
                placeholder="Select Unload Place"
                options={toPlaceOptions}
                value={unloadPlace}
                onSelect={setUnloadPlace}
              />

              <Input
                label="Carriers"
                value={carriers}
                onChange={(e) => setCarriers(e.target.value)}
              />

                <Input label="Total Rs." value={String(totalAmount)} readOnly />

            </div>
          </section>

          {/* GC DETAILS */}
          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">
              GC Details
            </h2>

            <div className="border p-4 rounded-md space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end">
                <div className="md:col-span-4">
                  <AutocompleteInput
                    label="Select GC No"
                    placeholder="Search GC..."
                    options={gcOptions}
                    value={gcNo}
                    onSelect={handleGcChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="QTY RATE"
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value) || 0)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddGC}
                    className="w-full"
                  >
                    Add GC
                  </Button>
                </div>
              </div>

              {/* TABLE */}
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-muted/20">
                      <th className="border p-2">GCNO</th>
                      <th className="border p-2">QTY</th>
                      <th className="border p-2">RATE</th>
                      <th className="border p-2">PACKING</th>
                      <th className="border p-2">CONTENT</th>
                      <th className="border p-2">CONSIGNOR</th>
                      <th className="border p-2">CONSIGNEE</th>
                      <th className="border p-2">AMOUNT</th>
                      <th className="border p-2">DEL</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i}>
                        <td className="border p-2">{it.gcNo}</td>
                        <td className="border p-2">{it.qty}</td>
                        <td className="border p-2">{it.rate}</td>
                        <td className="border p-2">{it.packingDts}</td>
                        <td className="border p-2">{it.contentDts}</td>
                        <td className="border p-2">{it.consignor}</td>
                        <td className="border p-2">{it.consignee}</td>
                        <td className="border p-2">
                          ₹{it.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="border p-2 text-center">
                          <button
                            type="button"
                            className="text-red-600"
                            onClick={() => handleDeleteGC(i)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center p-3 text-muted-foreground"
                        >
                          No GC rows added.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              
              
            </div>
          </section>

          {/* DRIVER DETAILS */}
          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">
              Driver Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <AutocompleteInput
                label="DL No"
                placeholder="Select DL No"
                options={driverDlOptions}
                value={dlNo}
                onSelect={(v) => {
                  setDlNo(v);
                  fillDriverFromDl(v);
                }}
              />

              <AutocompleteInput
                label="Driver Mobile"
                placeholder="Select Driver Mobile"
                options={driverMobileOptions}
                value={driverMobile}
                onSelect={(v) => {
                  setDriverMobile(v);
                  fillDriverFromMobile(v);
                }}
              />

              <AutocompleteInput
                label="Driver Name"
                placeholder="Select Driver Name"
                options={driverNameOptions}
                value={driverName}
                onSelect={(v) => {
                  if (!driverNameReadonly) setDriverName(v);
                }}
                readOnly={driverNameReadonly}
                disabled={driverNameReadonly}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <AutocompleteInput
                label="Lorry No"
                placeholder="Select Lorry No"
                options={vehicleNoOptions}
                value={lorryNo}
                onSelect={(v) => {
                  setLorryNo(v);
                  fillVehicleFromNo(v);
                }}
              />

              <AutocompleteInput
                label="Lorry Name"
                placeholder="Select Lorry Name"
                options={vehicleNameOptions}
                value={lorryName}
                onSelect={setLorryName}
                readOnly={!!lorryNo}
                disabled={!!lorryNo}
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Owner Name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
              <Input
                label="Owner Mobile"
                value={ownerMobile}
                onChange={(e) => setOwnerMobile(e.target.value)}
              />
              {/* empty placeholder column on larger screens */}
              <div />
            </div>
          </section>

          {/* SAVE FOOTER INSIDE CARD FOR LARGE SCREENS */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 p-4 bg-background/90 backdrop-blur-sm sticky bottom-0 border-t border-muted rounded-b-lg">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/trip-sheet")}
            >
              Cancel
            </Button>

            <Button type="submit" variant="primary" onClick={handleSave}>
              <Save size={16} className="mr-2" />
              Save Trip Sheet
            </Button>
          </div>
        </div>

        {/* Sticky mobile footer (visible on small screens) */}
        <div className="flex md:hidden flex-col sm:flex-row justify-end gap-3 p-4 bg-background/90 backdrop-blur-sm sticky bottom-0 border-t border-muted rounded-b-lg">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => navigate("/trip-sheet")}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            onClick={handleSave}
          >
            <Save size={16} className="mr-2" />
            Save Trip Sheet
          </Button>
        </div>
      </form>
    </div>
  );
};
