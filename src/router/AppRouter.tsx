import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { DataProvider } from '../contexts/DataContext'; 

// Import Features
import { LoginScreen } from '../features/auth/LoginScreen';
import { ConsignorList } from '../features/consignors/ConsignorList';
import { ConsigneeList } from '../features/consignees/ConsigneeList';
import { GcEntryList } from '../features/gc-entry/GcEntryList';
import { GcEntryForm } from '../features/gc-entry/GcEntryForm';
import { PendingStockHistory } from '../features/pending-stock/PendingStockHistory';
import { LoadingSheetEntry } from '../features/loading-sheet/LoadingSheetEntry';
import { FromPlaceList } from '../features/from-places-entry/FromPlacesList';
import { ToPlacesList } from '../features/to-places-entry/ToPlacesList';
import { PackingEntryList } from '../features/packing-entry/PackingUnitList';
import { ContentList } from '../features/content-entry/ContentList';
import { TripSheetList } from '../features/trip-sheet-entry/TripSheetList';
import { TripSheetForm } from '../features/trip-sheet-entry/TripSheetForm';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { MasterDashboardPage } from '../features/dashboard/MasterDashboardPage';
import { LoadingScreen } from '../components/shared/LoadingScreen';
import { UserList } from '../features/users/UserList';
import { VehicleList } from '../features/vehicle-details/VehicleList';
import { DriverList } from '../features/driver-details copy/DriverList';
// 🟢 NEW IMPORT
import { OfflinePage } from '../features/misc/OfflinePage';

// Note: TermsAccessPage has been removed as per requirement

// --- AUTH PROTECTION WRAPPER ---
const ProtectedRoute = ({ requireAdmin = false }: { requireAdmin?: boolean }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />; 
  }

  // Wrap authenticated routes in DataProvider and Layout
  return (
    <DataProvider>
      <Layout>
        <Outlet />
      </Layout>
    </DataProvider>
  );
};

// --- LOGIN ROUTE WRAPPER ---
const LoginRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <LoginScreen />;
};

// --- ROUTER DEFINITION ---
const AppRouter = () => {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES */}
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/logout" element={<Navigate to="/login" replace />} />
      
      {/* 🟢 NEW OFFLINE ROUTE */}
      <Route path="/offline" element={<OfflinePage />} />

      {/* 2. PROTECTED ROUTES (Wrapped in DataProvider via Outlet) */}
      <Route element={<ProtectedRoute />}>
        {/* Main Dashboard */}
        <Route path="/" element={<DashboardPage />} />

        {/* GC Entry */}
        <Route path="/gc-entry" element={<GcEntryList />} />
        <Route path="/gc-entry/new" element={<GcEntryForm />} />
        <Route path="/gc-entry/edit/:gcNo" element={<GcEntryForm />} />
        
        {/* Pending Stock */}
        <Route path="/pending-stock" element={<PendingStockHistory />} />

        {/* Loading Sheet */}
        <Route path="/loading-sheet" element={<LoadingSheetEntry />} />
        
        {/* Trip Sheet */}
        <Route path="/trip-sheet" element={<TripSheetList />} />
        <Route path="/tripsheet/new" element={<TripSheetForm />} />
        <Route path="/tripsheet/edit/:id" element={<TripSheetForm />} />

        {/* Master Dashboard */}
        <Route path="/master" element={<MasterDashboardPage />} />
        <Route path="/master/consignors" element={<ConsignorList />} />
        <Route path="/master/consignees" element={<ConsigneeList />} />
        <Route path="/master/from-places" element={<FromPlaceList />} />
        <Route path="/master/to-places" element={<ToPlacesList />} />
        <Route path="/master/packings" element={<PackingEntryList />} />
        <Route path="/master/contents" element={<ContentList />} />
        <Route path="/master/vehicles" element={<VehicleList />} />
        <Route path="/master/drivers" element={<DriverList />} />
      </Route>

      {/* 3. ADMIN ONLY ROUTES */}
      <Route element={<ProtectedRoute requireAdmin={true} />}>
        <Route path="/users" element={<UserList />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;