import { WifiOff, Activity } from 'lucide-react';

export const OfflinePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center animate-in fade-in zoom-in duration-300">
      <div className="bg-destructive/10 p-6 rounded-full mb-6 relative">
        <WifiOff size={64} className="text-destructive" />
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
        </span>
      </div>
      
      <h1 className="text-3xl font-bold text-foreground mb-2">Connection Lost</h1>
      
      {/* 🟢 UPDATED CONTENT BELOW */}
      <p className="text-muted-foreground max-w-md mb-8">
        Connection to United Transport operations interrupted. We are checking the network status 
        and will restore your active session automatically once you are back online.
      </p>

      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
        <Activity size={16} className="animate-pulse text-primary" />
        <span>Reconnecting to server...</span>
      </div>
    </div>
  );
};