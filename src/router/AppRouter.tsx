import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

// Import features directly
import { LoginScreen } from '../features/auth/LoginScreen';
import { ConsignorList } from '../features/consignors/ConsignorList';
import { ConsigneeList } from '../features/consignees/ConsigneeList';
import { GcEntryList } from '../features/gc-entry/GcEntryList';
import { GcEntryForm } from '../features/gc-entry/GcEntryForm';
import { PendingStockHistory } from '../features/pending-stock/PendingStockHistory';
import { DashboardPage } from '../features/dashboard/DashboardPage';

// --- NEW LOADING SCREEN IMPORT ---
import { LoadingScreen } from '../components/shared/LoadingScreen';
// --- END NEW IMPORT ---


// This component will protect your admin routes
const ProtectedRoute = ({
  children,
  noLayout = false,
}: {
  children: React.ReactNode;
  noLayout?: boolean;
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    // --- THIS IS THE FIX ---
    return <LoadingScreen />;
    // --- END FIX ---
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ⭐ If noLayout = true → DO NOT wrap with Layout
  if (noLayout) {
    return <>{children}</>;
  }

  return <Layout>{children}</Layout>;
};

// This component handles the /login route
const LoginRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // --- THIS IS THE FIX ---
    return <LoadingScreen />;
    // --- END FIX ---
  }

  if (user) {
    // If user is already logged in, redirect to dashboard
    return <Navigate to="/" replace />;
  }

  return <LoginScreen />;
};

// This component handles the logout logic
const LogoutRoute = () => {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  // --- THIS IS THE FIX ---
  // Show loading screen while logging out
  return <LoadingScreen />;
  // --- END FIX ---
}

const AppRouter = () => {
  return (
    <Routes>
      {/* Login route doesn't have the main Layout */}
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/logout" element={<LogoutRoute />} />

      {/* Protected Admin Routes (wrapped in Layout) */}
      
      {/* '/' now points to the new DashboardPage */}
      <Route 
        path="/" 
        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} 
      />

      <Route 
        path="/consignors" 
        element={<ProtectedRoute><ConsignorList /></ProtectedRoute>} 
      />
      <Route 
        path="/consignees" 
        element={<ProtectedRoute><ConsigneeList /></ProtectedRoute>} 
      />
      
      {/* --- GC ENTRY ROUTES --- */}
      <Route 
        path="/gc-entry" 
        element={<ProtectedRoute><GcEntryList /></ProtectedRoute>} 
      />
      <Route 
        path="/gc-entry/new" 
        element={<ProtectedRoute><GcEntryForm /></ProtectedRoute>} 
      />
      <Route 
        path="/gc-entry/edit/:gcNo" 
        element={<ProtectedRoute><GcEntryForm /></ProtectedRoute>} 
      />

      {/* --- PENDING STOCK ROUTE --- */}
      <Route 
        path="/pending-stock" 
        element={<ProtectedRoute><PendingStockHistory /></ProtectedRoute>} 
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;