import React, { createContext, useState, useMemo, useCallback } from 'react';
import type { 
  Consignor, Consignee, GcEntry, FromPlace, ToPlace, PackingEntry, 
  ContentEntry, TripSheetEntry, VehicleEntry, DriverEntry 
} from '../types';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ToastContext';

interface DataContextType {
  // --- Existing State Arrays ---
  consignors: Consignor[];
  consignees: Consignee[];
  gcEntries: GcEntry[]; 
  tripSheets: TripSheetEntry[]; 
  fromPlaces: FromPlace[];
  toPlaces: ToPlace[];
  packingEntries: PackingEntry[];
  contentEntries: ContentEntry[];
  vehicleEntries: VehicleEntry[];
  driverEntries: DriverEntry[];
  
  // --- Existing CRUD Actions ---
  addConsignor: (consignor: Consignor) => Promise<void>;
  updateConsignor: (consignor: Consignor) => Promise<void>;
  deleteConsignor: (id: string) => Promise<void>;
  addConsignee: (consignee: Consignee) => Promise<void>;
  updateConsignee: (consignee: Consignee) => Promise<void>;
  deleteConsignee: (id: string) => Promise<void>;
  getNextGcNo: () => Promise<string>;
  fetchGcById: (id: string) => Promise<GcEntry | null>;
  fetchTripSheetById: (id: string) => Promise<TripSheetEntry | null>;
  addGcEntry: (gcEntry: GcEntry) => Promise<any>;
  updateGcEntry: (gcEntry: GcEntry) => Promise<any>;
  deleteGcEntry: (identifier: string) => Promise<void>;
  saveLoadingProgress: (gcId: string, selectedQuantities: number[]) => Promise<void>;
  fetchGcPrintData: (gcNos: string[], selectAll?: boolean, filters?: any) => Promise<any[]>;
  fetchLoadingSheetPrintData: (gcNos: string[], selectAll?: boolean, filters?: any) => Promise<any[]>;
  fetchTripSheetPrintData: (mfNos: string[], selectAll?: boolean, filters?: any) => Promise<TripSheetEntry[]>;
  fetchPendingStockReport: (filters: any) => Promise<any[]>;
  fetchTripSheetReport: (filters: any) => Promise<any[]>;
  fetchGcDetailsForTripSheet: (gcNo: string) => Promise<any>;
  addFromPlace: (fromPlace: FromPlace) => Promise<void>;
  updateFromPlace: (fromPlace: FromPlace) => Promise<void>;
  deleteFromPlace: (id: string) => Promise<void>;
  addToPlace: (toPlace: ToPlace) => Promise<void>;
  updateToPlace: (toPlace: ToPlace) => Promise<void>;
  deleteToPlace: (id: string) => Promise<void>;
  addPackingEntry: (entry: PackingEntry) => Promise<void>;
  updatePackingEntry: (entry: PackingEntry) => Promise<void>;
  deletePackingEntry: (id: string) => Promise<void>;
  addContentEntry: (entry: ContentEntry) => Promise<void>;
  updateContentEntry: (entry: ContentEntry) => Promise<void>;
  deleteContentEntry: (id: string) => Promise<void>;
  addTripSheet: (sheet: TripSheetEntry) => Promise<void>;
  updateTripSheet: (sheet: TripSheetEntry) => Promise<void>;
  deleteTripSheet: (id: string) => Promise<void>;
  addVehicleEntry: (entry: VehicleEntry) => Promise<void>;
  updateVehicleEntry: (entry: VehicleEntry) => Promise<void>;
  deleteVehicleEntry: (id: string) => Promise<void>;
  addDriverEntry: (entry: DriverEntry) => Promise<void>;
  updateDriverEntry: (entry: DriverEntry) => Promise<void>;
  deleteDriverEntry: (id: string) => Promise<void>;
  getUniqueDests: () => { value: string, label: string }[];
  getPackingTypes: () => { value: string, label: string }[];
  getContentsTypes: () => { value: string, label: string }[];
  
  // --- Individual Fetchers for Screen-Wise Loading ---
  fetchConsignors: () => Promise<void>;
  fetchConsignees: () => Promise<void>;
  fetchFromPlaces: () => Promise<void>;
  fetchToPlaces: () => Promise<void>;
  fetchPackingEntries: () => Promise<void>;
  fetchContentEntries: () => Promise<void>;
  fetchVehicleEntries: () => Promise<void>;
  fetchDriverEntries: () => Promise<void>;
  refreshData: () => Promise<void>; // Keeps legacy compatibility

  // --- Server-Side Search Functions (Async Dropdowns) ---
  searchConsignors: (search: string, page: number) => Promise<any>;
  searchConsignees: (search: string, page: number) => Promise<any>;
  searchVehicles: (search: string, page: number) => Promise<any>;
  searchDrivers: (search: string, page: number) => Promise<any>;
  searchFromPlaces: (search: string, page: number) => Promise<any>;
  searchToPlaces: (search: string, page: number) => Promise<any>;
  searchPackings: (search: string, page: number) => Promise<any>;
  searchContents: (search: string, page: number) => Promise<any>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [consignors, setConsignors] = useState<Consignor[]>([]);
  const [consignees, setConsignees] = useState<Consignee[]>([]);
  const [fromPlaces, setFromPlaces] = useState<FromPlace[]>([]);
  const [toPlaces, setToPlaces] = useState<ToPlace[]>([]);
  const [packingEntries, setPackingEntries] = useState<PackingEntry[]>([]);
  const [contentEntries, setContentEntries] = useState<ContentEntry[]>([]);
  const [vehicleEntries, setVehicleEntries] = useState<VehicleEntry[]>([]);
  const [driverEntries, setDriverEntries] = useState<DriverEntry[]>([]);

  // --- Helper to handle API errors globally within DataContext ---
  const handleError = (error: any, defaultMsg: string) => {
    const msg = error.response?.data?.message || defaultMsg;
    toast.error(msg);
    // console.error(error); // Optional logging
  };

  // --- INDIVIDUAL FETCH FUNCTIONS (Screen-Wise) ---

  const fetchConsignors = useCallback(async () => {
    try {
      const { data } = await api.get('/master/consignors');
      setConsignors(data);
    } catch (e) { console.error("Error fetching consignors", e); }
  }, []);

  const fetchConsignees = useCallback(async () => {
    try {
      const { data } = await api.get('/master/consignees');
      setConsignees(data);
    } catch (e) { console.error("Error fetching consignees", e); }
  }, []);

  const fetchFromPlaces = useCallback(async () => {
    try {
      const { data } = await api.get('/master/from-places');
      setFromPlaces(data);
    } catch (e) { console.error("Error fetching from places", e); }
  }, []);

  const fetchToPlaces = useCallback(async () => {
    try {
      const { data } = await api.get('/master/to-places');
      setToPlaces(data);
    } catch (e) { console.error("Error fetching to places", e); }
  }, []);

  const fetchPackingEntries = useCallback(async () => {
    try {
      const { data } = await api.get('/master/packings');
      setPackingEntries(data);
    } catch (e) { console.error("Error fetching packings", e); }
  }, []);

  const fetchContentEntries = useCallback(async () => {
    try {
      const { data } = await api.get('/master/contents');
      setContentEntries(data);
    } catch (e) { console.error("Error fetching contents", e); }
  }, []);

  const fetchVehicleEntries = useCallback(async () => {
    try {
      const { data } = await api.get('/master/vehicles');
      setVehicleEntries(data);
    } catch (e) { console.error("Error fetching vehicles", e); }
  }, []);

  const fetchDriverEntries = useCallback(async () => {
    try {
      const { data } = await api.get('/master/drivers');
      setDriverEntries(data);
    } catch (e) { console.error("Error fetching drivers", e); }
  }, []);

  // --- Combined Fetch (Optional / Legacy Refresh) ---
  const fetchAllData = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      fetchConsignors(),
      fetchConsignees(),
      fetchFromPlaces(),
      fetchToPlaces(),
      fetchPackingEntries(),
      fetchContentEntries(),
      fetchVehicleEntries(),
      fetchDriverEntries()
    ]);
  }, [user, fetchConsignors, fetchConsignees, fetchFromPlaces, fetchToPlaces, fetchPackingEntries, fetchContentEntries, fetchVehicleEntries, fetchDriverEntries]);

  // =================================================================
  // Server-Side Search Implementations
  // =================================================================

  const searchConsignors = async (search: string, page: number) => {
    try { const { data } = await api.get('/master/consignors', { params: { search, page } }); return data; } 
    catch (e) { console.error(e); return { data: [], hasMore: false }; }
  };
  const searchConsignees = async (search: string, page: number) => {
    try { const { data } = await api.get('/master/consignees', { params: { search, page } }); return data; } 
    catch (e) { console.error(e); return { data: [], hasMore: false }; }
  };
  const searchVehicles = async (search: string, page: number) => {
    try { const { data } = await api.get('/master/vehicles', { params: { search, page } }); return data; } 
    catch (e) { console.error(e); return { data: [], hasMore: false }; }
  };
  const searchDrivers = async (search: string, page: number) => {
    try { const { data } = await api.get('/master/drivers', { params: { search, page } }); return data; } 
    catch (e) { console.error(e); return { data: [], hasMore: false }; }
  };
  const searchFromPlaces = async (search: string, page: number) => {
    try { const { data } = await api.get('/master/from-places', { params: { search, page } }); return data; } 
    catch (e) { console.error(e); return { data: [], hasMore: false }; }
  };
  const searchToPlaces = async (search: string, page: number) => {
    try { const { data } = await api.get('/master/to-places', { params: { search, page } }); return data; } 
    catch (e) { console.error(e); return { data: [], hasMore: false }; }
  };
  const searchPackings = async (search: string, page: number) => {
    try { const { data } = await api.get('/master/packings', { params: { search, page } }); return data; } 
    catch (e) { console.error(e); return { data: [], hasMore: false }; }
  };
  const searchContents = async (search: string, page: number) => {
    try { const { data } = await api.get('/master/contents', { params: { search, page } }); return data; } 
    catch (e) { console.error(e); return { data: [], hasMore: false }; }
  };

  // --- GC ACTIONS ---
  const getNextGcNo = async () => {
    try { const { data } = await api.get('/operations/gc/next-no'); return data.nextGcNo; } 
    catch (e) { return "Error"; }
  };
  
  const fetchGcById = async (id: string) => {
    try { const { data } = await api.get(`/operations/gc/${id}`); return data; }
    catch (e) { console.error(e); return null; }
  };

  const fetchGcDetailsForTripSheet = async (gcNo: string) => {
    try {
      const { data } = await api.get(`/operations/gc/details/${gcNo}`);
      return data;
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Error fetching GC details");
      return null;
    }
  };

  const fetchGcPrintData = async (gcNos: string[], selectAll?: boolean, filters?: any) => {
    try {
      const { data } = await api.post('/operations/gc/print-data', { gcNos, selectAll, filters });
      return data;
    } catch (e) { handleError(e, "Error fetching bulk print data"); return []; }
  };

  const fetchLoadingSheetPrintData = async (gcNos: string[], selectAll?: boolean, filters?: any) => {
    try {
      const { data } = await api.post('/operations/loading-sheet/print-data', { gcNos, selectAll, filters });
      return data;
    } catch (e) { handleError(e, "Error fetching loading sheet print data"); return []; }
  };

  const fetchTripSheetPrintData = async (mfNos: string[], selectAll?: boolean, filters?: any) => {
    try {
      const { data } = await api.post('/operations/tripsheet/print-data', { mfNos, selectAll, filters });
      return data;
    } catch (e) { handleError(e, "Error fetching trip sheet print data"); return []; }
  };

  const fetchPendingStockReport = async (filters: any) => {
    try {
      const { data } = await api.get('/operations/pending-stock/report', { params: filters });
      return data;
    } catch (e) { handleError(e, "Error fetching report"); return []; }
  };

  const fetchTripSheetReport = async (filters: any) => {
    try {
      const { data } = await api.get('/operations/tripsheet/report', { params: filters });
      return data;
    } catch (e) { handleError(e, "Error fetching report"); return []; }
  };

  const addGcEntry = async (data: GcEntry) => { 
    try {
      const response = await api.post('/operations/gc', data); 
      toast.success("GC Entry created successfully");
      return response.data;
    } catch (e) { handleError(e, "Failed to create GC"); }
  };
  
  const updateGcEntry = async (data: GcEntry) => { 
    try {
      const response = await api.put(`/operations/gc/${data.gcNo}`, data); 
      toast.success("GC Entry updated successfully");
      return response.data;
    } catch (e) { handleError(e, "Failed to update GC"); }
  };
  
  const deleteGcEntry = async (identifier: string) => { 
    try {
      await api.delete(`/operations/gc/${identifier}`);
      toast.success("GC Entry deleted successfully");
    } catch (e) { handleError(e, "Failed to delete GC"); }
  };
  
  const saveLoadingProgress = async (gcId: string, selectedQuantities: number[]) => {
    try {
      await api.put('/operations/loading/save', { gcId, selectedQuantities });
      toast.success("Loading progress saved");
    } catch (e) { handleError(e, "Failed to save loading progress"); }
  };

  const fetchTripSheetById = async (id: string) => {
    try { const { data } = await api.get(`/operations/tripsheet/${id}`); return data; }
    catch (e) { console.error(e); return null; }
  };

  const addTripSheet = async (data: TripSheetEntry) => { 
    try {
      await api.post('/operations/tripsheet', data); 
      toast.success("Trip Sheet created successfully");
    } catch (e) { handleError(e, "Failed to create Trip Sheet"); }
  };

  const updateTripSheet = async (data: TripSheetEntry) => { 
    try {
      await api.put(`/operations/tripsheet/${data.mfNo}`, data); 
      toast.success("Trip Sheet updated successfully");
    } catch (e) { handleError(e, "Failed to update Trip Sheet"); }
  };

  const deleteTripSheet = async (id: string) => { 
    try {
      await api.delete(`/operations/tripsheet/${id}`); 
      toast.success("Trip Sheet deleted successfully");
    } catch (e) { handleError(e, "Failed to delete Trip Sheet"); }
  };

  // --- MASTERS (Consignors, Consignees, etc.) ---

  const addConsignor = async (data: Consignor) => {
    try {
      const res = await api.post('/master/consignors', data);
      setConsignors(prev => [res.data, ...prev]);
      toast.success("Consignor added");
    } catch (e) { handleError(e, "Failed to add consignor"); }
  };

  const updateConsignor = async (data: Consignor) => {
    try {
      const res = await api.put(`/master/consignors/${data.id}`, data);
      setConsignors(prev => prev.map(item => item.id === data.id ? res.data : item));
      toast.success("Consignor updated");
    } catch (e) { handleError(e, "Failed to update consignor"); }
  };

  const deleteConsignor = async (id: string) => {
    try {
      await api.delete(`/master/consignors/${id}`);
      setConsignors(prev => prev.filter(item => item.id !== id));
      toast.success("Consignor deleted");
    } catch (e) { handleError(e, "Failed to delete consignor"); }
  };

  const addConsignee = async (data: Consignee) => {
    try {
      const res = await api.post('/master/consignees', data);
      setConsignees(prev => [res.data, ...prev]);
      toast.success("Consignee added");
    } catch (e) { handleError(e, "Failed to add consignee"); }
  };

  const updateConsignee = async (data: Consignee) => {
    try {
      const res = await api.put(`/master/consignees/${data.id}`, data);
      setConsignees(prev => prev.map(item => item.id === data.id ? res.data : item));
      toast.success("Consignee updated");
    } catch (e) { handleError(e, "Failed to update consignee"); }
  };

  const deleteConsignee = async (id: string) => {
    try {
      await api.delete(`/master/consignees/${id}`);
      setConsignees(prev => prev.filter(item => item.id !== id));
      toast.success("Consignee deleted");
    } catch (e) { handleError(e, "Failed to delete consignee"); }
  };

  const addFromPlace = async (data: FromPlace) => {
    try {
      const res = await api.post('/master/from-places', data);
      setFromPlaces(prev => [res.data, ...prev]);
      toast.success("From Place added");
    } catch (e) { handleError(e, "Failed to add From Place"); }
  };

  const updateFromPlace = async (data: FromPlace) => {
    try {
      const res = await api.put(`/master/from-places/${data.id}`, data);
      setFromPlaces(prev => prev.map(x => x.id === data.id ? res.data : x));
      toast.success("From Place updated");
    } catch (e) { handleError(e, "Failed to update From Place"); }
  };

  const deleteFromPlace = async (id: string) => {
    try {
      await api.delete(`/master/from-places/${id}`);
      setFromPlaces(prev => prev.filter(x => x.id !== id));
      toast.success("From Place deleted");
    } catch (e) { handleError(e, "Failed to delete From Place"); }
  };

  const addToPlace = async (data: ToPlace) => {
    try {
      const res = await api.post('/master/to-places', data);
      setToPlaces(prev => [res.data, ...prev]);
      toast.success("To Place added");
    } catch (e) { handleError(e, "Failed to add To Place"); }
  };

  const updateToPlace = async (data: ToPlace) => {
    try {
      const res = await api.put(`/master/to-places/${data.id}`, data);
      setToPlaces(prev => prev.map(x => x.id === data.id ? res.data : x));
      toast.success("To Place updated");
    } catch (e) { handleError(e, "Failed to update To Place"); }
  };

  const deleteToPlace = async (id: string) => {
    try {
      await api.delete(`/master/to-places/${id}`);
      setToPlaces(prev => prev.filter(x => x.id !== id));
      toast.success("To Place deleted");
    } catch (e) { handleError(e, "Failed to delete To Place"); }
  };

  const addPackingEntry = async (data: PackingEntry) => {
    try {
      const res = await api.post('/master/packings', data);
      setPackingEntries(prev => [res.data, ...prev]);
      toast.success("Packing added");
    } catch (e) { handleError(e, "Failed to add Packing"); }
  };

  const updatePackingEntry = async (data: PackingEntry) => {
    try {
      const res = await api.put(`/master/packings/${data.id}`, data);
      setPackingEntries(prev => prev.map(x => x.id === data.id ? res.data : x));
      toast.success("Packing updated");
    } catch (e) { handleError(e, "Failed to update Packing"); }
  };

  const deletePackingEntry = async (id: string) => {
    try {
      await api.delete(`/master/packings/${id}`);
      setPackingEntries(prev => prev.filter(x => x.id !== id));
      toast.success("Packing deleted");
    } catch (e) { handleError(e, "Failed to delete Packing"); }
  };

  const addContentEntry = async (data: ContentEntry) => {
    try {
      const res = await api.post('/master/contents', data);
      setContentEntries(prev => [res.data, ...prev]);
      toast.success("Content added");
    } catch (e) { handleError(e, "Failed to add Content"); }
  };

  const updateContentEntry = async (data: ContentEntry) => {
    try {
      const res = await api.put(`/master/contents/${data.id}`, data);
      setContentEntries(prev => prev.map(x => x.id === data.id ? res.data : x));
      toast.success("Content updated");
    } catch (e) { handleError(e, "Failed to update Content"); }
  };

  const deleteContentEntry = async (id: string) => {
    try {
      await api.delete(`/master/contents/${id}`);
      setContentEntries(prev => prev.filter(x => x.id !== id));
      toast.success("Content deleted");
    } catch (e) { handleError(e, "Failed to delete Content"); }
  };

  const addVehicleEntry = async (data: VehicleEntry) => {
    try {
      const res = await api.post('/master/vehicles', data);
      setVehicleEntries(prev => [res.data, ...prev]);
      toast.success("Vehicle added");
    } catch (e) { handleError(e, "Failed to add Vehicle"); }
  };

  const updateVehicleEntry = async (data: VehicleEntry) => {
    try {
      const res = await api.put(`/master/vehicles/${data.id}`, data);
      setVehicleEntries(prev => prev.map(x => x.id === data.id ? res.data : x));
      toast.success("Vehicle updated");
    } catch (e) { handleError(e, "Failed to update Vehicle"); }
  };

  const deleteVehicleEntry = async (id: string) => {
    try {
      await api.delete(`/master/vehicles/${id}`);
      setVehicleEntries(prev => prev.filter(x => x.id !== id));
      toast.success("Vehicle deleted");
    } catch (e) { handleError(e, "Failed to delete Vehicle"); }
  };

  const addDriverEntry = async (data: DriverEntry) => {
    try {
      const res = await api.post('/master/drivers', data);
      setDriverEntries(prev => [res.data, ...prev]);
      toast.success("Driver added");
    } catch (e) { handleError(e, "Failed to add Driver"); }
  };

  const updateDriverEntry = async (data: DriverEntry) => {
    try {
      const res = await api.put(`/master/drivers/${data.id}`, data);
      setDriverEntries(prev => prev.map(x => x.id === data.id ? res.data : x));
      toast.success("Driver updated");
    } catch (e) { handleError(e, "Failed to update Driver"); }
  };

  const deleteDriverEntry = async (id: string) => {
    try {
      await api.delete(`/master/drivers/${id}`);
      setDriverEntries(prev => prev.filter(x => x.id !== id));
      toast.success("Driver deleted");
    } catch (e) { handleError(e, "Failed to delete Driver"); }
  };

  const getUniqueDests = useCallback(() => {
    const dests = new Set([...toPlaces.map(tp => tp.placeName), ...consignees.map(c => c.destination)]);
    return Array.from(dests).map(d => ({ value: d, label: d }));
  }, [toPlaces, consignees]);
  
  const getPackingTypes = useCallback(() => packingEntries.map(p => ({ value: p.packingName, label: p.packingName })), [packingEntries]);
  const getContentsTypes = useCallback(() => contentEntries.map(c => ({ value: c.contentName, label: c.contentName })), [contentEntries]);

  const value = useMemo(() => ({
    consignors, consignees, gcEntries: [], tripSheets: [], 
    fromPlaces, toPlaces, packingEntries, contentEntries, vehicleEntries, driverEntries,
    addConsignor, updateConsignor, deleteConsignor,
    addConsignee, updateConsignee, deleteConsignee,
    getNextGcNo, fetchGcById, fetchTripSheetById, addGcEntry, updateGcEntry, deleteGcEntry, saveLoadingProgress,
    fetchGcPrintData, fetchLoadingSheetPrintData, fetchTripSheetPrintData,
    fetchPendingStockReport, fetchTripSheetReport, fetchGcDetailsForTripSheet,
    addFromPlace, updateFromPlace, deleteFromPlace,
    addToPlace, updateToPlace, deleteToPlace,
    addPackingEntry, updatePackingEntry, deletePackingEntry,
    addContentEntry, updateContentEntry, deleteContentEntry,
    addTripSheet, updateTripSheet, deleteTripSheet,
    addVehicleEntry, updateVehicleEntry, deleteVehicleEntry,
    addDriverEntry, updateDriverEntry, deleteDriverEntry,
    getUniqueDests, getPackingTypes, getContentsTypes,
    refreshData: fetchAllData,
    
    // --- EXPORTED FETCH FUNCTIONS ---
    fetchConsignors, fetchConsignees, fetchFromPlaces, fetchToPlaces,
    fetchPackingEntries, fetchContentEntries, fetchVehicleEntries, fetchDriverEntries,

    // --- Search Functions ---
    searchConsignors, searchConsignees, searchVehicles, searchDrivers,
    searchFromPlaces, searchToPlaces, searchPackings, searchContents
  }), [
    consignors, consignees, fromPlaces, toPlaces, packingEntries, contentEntries, vehicleEntries, driverEntries, 
    fetchAllData,
    fetchConsignors, fetchConsignees, fetchFromPlaces, fetchToPlaces, fetchPackingEntries, fetchContentEntries, fetchVehicleEntries, fetchDriverEntries
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};