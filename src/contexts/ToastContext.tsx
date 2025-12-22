import React, { createContext, useContext } from 'react';
import toast, { Toaster, type ToastOptions } from 'react-hot-toast';

interface ToastContextType {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  loading: (message: string, options?: ToastOptions) => string;
  // 🟢 NEW: Info method added to match usage in WarehouseManagementPage
  info: (message: string, options?: ToastOptions) => void; 
  dismiss: (toastId?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  
  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      ...options,
    });
  };

  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      ...options,
    });
  };

  const loading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...options,
    });
  };

  // 🟢 NEW: Implementation for info toast
  const info = (message: string, options?: ToastOptions) => {
    toast(message, {
      icon: 'ℹ️', // Simple icon to distinguish info messages
      style: {
        border: '1px solid hsl(var(--primary))',
        ...options?.style,
      },
      ...options,
    });
  };

  const dismiss = (toastId?: string) => {
    toast.dismiss(toastId);
  };

  return (
    <ToastContext.Provider value={{ success, error, loading, info, dismiss }}>
      {/* Global Toaster Configuration */}
      <Toaster 
        position="top-center"
        toastOptions={{
          // Base Styles (Applied to all toasts)
          style: {
            // Using CSS Variables from index.css for dynamic theming
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'calc(var(--radius) + 4px)', // Slightly rounder than standard elements
            padding: '16px 24px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontWeight: '500',
            fontSize: '0.875rem',
          },
          
          // Success Toast Specifics
          success: {
            iconTheme: {
              primary: 'hsl(var(--primary))',
              secondary: 'hsl(var(--primary-foreground))',
            },
          },

          // Error Toast Specifics
          error: {
            style: {
              // Add a destructive border for errors to distinguish them clearly
              border: '1px solid hsl(var(--destructive))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
            },
            iconTheme: {
              primary: 'hsl(var(--destructive))',
              secondary: 'hsl(var(--destructive-foreground))',
            },
          },

          // Loading Toast Specifics
          loading: {
            iconTheme: {
              primary: 'hsl(var(--primary))',
              secondary: 'hsl(var(--primary-foreground))',
            },
          },
        }} 
      />
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};