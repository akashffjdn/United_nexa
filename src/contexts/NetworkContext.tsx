import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NetworkContextType {
  isOnline: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Store the last valid route before going offline
  const lastRouteRef = useRef<string | null>(null);

  // Function to ping Cloudflare
  const checkInternetConnection = async () => {
    try {
      // Pinging Cloudflare's trace endpoint
      // mode: 'no-cors' is CRITICAL here. It allows us to ping a public domain 
      // without getting a CORS error. We won't see the response body, 
      // but if it doesn't throw an error, the network is alive.
      await fetch('https://www.cloudflare.com/cdn-cgi/trace', { 
        method: 'HEAD',
        mode: 'no-cors', 
        cache: 'no-store' 
      });
      return true;
    } catch (error) {
      // If fetch throws, it means the network request failed entirely
      return false;
    }
  };

  useEffect(() => {
    const handleStatusChange = async () => {
      // 1. Initial check using browser API
      const browserOnline = navigator.onLine;
      
      if (browserOnline) {
        // 2. Deep check using Cloudflare Ping
        const cloudflareReachable = await checkInternetConnection();
        updateNetworkState(cloudflareReachable);
      } else {
        updateNetworkState(false);
      }
    };

    const updateNetworkState = (status: boolean) => {
      setIsOnline((prevStatus) => {
        if (prevStatus === status) return status; // Prevent unnecessary updates

        if (!status) {
          // --- GOING OFFLINE ---
          // Save current path if it's not already the offline page
          if (location.pathname !== '/offline') {
            lastRouteRef.current = location.pathname + location.search;
          }
          navigate('/offline');
        } else {
          // --- COMING ONLINE ---
          // Restore the saved path
          if (location.pathname === '/offline') {
            const target = lastRouteRef.current || '/'; // Default to dashboard if no history
            navigate(target, { replace: true });
          }
        }
        return status;
      });
    };

    // Listeners for instant reaction (e.g., unplugging cable)
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    // Polling interval for "silent" failures (every 5 seconds)
    const intervalId = setInterval(handleStatusChange, 5000);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      clearInterval(intervalId);
    };
  }, [navigate, location.pathname, location.search]);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};