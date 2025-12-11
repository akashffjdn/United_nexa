import { WifiOff, Activity } from 'lucide-react';

export const OfflinePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
      {/* Content Card */}
      <div className="flex flex-col items-center max-w-md">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-destructive" />
          </div>
          {/* Pulsing Dot */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive" />
          </span>
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Connection Lost
        </h1>
        
        {/* Description */}
        <p className="text-muted-foreground mb-6">
          Unable to connect to United Transport servers. We'll automatically reconnect when your connection is restored.
        </p>

        {/* Status */}
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Waiting for connection...</span>
        </div>
      </div>
    </div>
  );
};