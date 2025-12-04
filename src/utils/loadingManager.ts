
// src/utils/loadingManager.ts

// Define the shape of our loading state
type LoadingState = {
  isLoading: boolean;
  message: string;
};

type Listener = (state: LoadingState) => void;

let activeRequests = 0;
// Default message
let currentMessage = "Loading...";
let listeners: Listener[] = [];

export const loadingManager = {
  show: (message: string = "Processing...") => {
    if (activeRequests === 0) {
      currentMessage = message;
      notifyListeners(true, currentMessage);
    }
    activeRequests++;
  },

  hide: () => {
    activeRequests--;
    if (activeRequests < 0) activeRequests = 0;
    
    if (activeRequests === 0) {
      notifyListeners(false, "");
    }
  },

  // 🟢 NEW: Forcefully reset loader to OFF (Used when going offline)
  reset: () => {
    activeRequests = 0;
    notifyListeners(false, "");
  },

  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};

const notifyListeners = (isLoading: boolean, message: string) => {
  listeners.forEach((listener) => listener({ isLoading, message }));
};
