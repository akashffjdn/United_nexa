import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

// Import features directly
import { LoginScreen } from '../features/auth/LoginScreen';
import { ConsignorList } from '../features/consignors/ConsignorList';
import { ConsigneeList } from '../features/consignees/ConsigneeList';
// --- NEW GC IMPORTS ---
import { GcEntryList } from '../features/gc-entry/GcEntryList';
import { GcEntryForm } from '../features/gc-entry/GcEntryForm';
import { GcPrintView } from '../features/gc-entry/GcPrintView';
// --- END NEW GC IMPORTS ---


// This component will protect your admin routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    // You can replace this with a proper loading spinner component
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  // Wrap the protected component in the main Layout
  return <Layout>{children}</Layout>;
};

// This component handles the /login route
const LoginRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
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

  // Will be redirected to /login by the logout function
  return <div className="flex items-center justify-center h-screen">Logging out...</div>;
}

const AppRouter = () => {
  return (
    <Routes>
      {/* Login route doesn't have the main Layout */}
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/logout" element={<LogoutRoute />} />

      {/* --- NEW GC PRINT ROUTE --- */}
      {/* This route has no Layout, it's for printing only */}
      <Route 
        path="/gc-entry/print" 
        element={<ProtectedRoute><GcPrintView /></ProtectedRoute>} 
      />

      {/* Protected Admin Routes (wrapped in Layout) */}
      <Route 
        path="/" 
        element={<ProtectedRoute><ConsignorList /></ProtectedRoute>} 
      />
      <Route 
        path="/consignors" 
        element={<ProtectedRoute><ConsignorList /></ProtectedRoute>} 
      />
      <Route 
        path="/consignees" 
        element={<ProtectedRoute><ConsigneeList /></ProtectedRoute>} 
      />
      
      {/* --- NEW GC ENTRY ROUTES --- */}
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
      {/* --- END NEW GC ROUTES --- */}


      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;