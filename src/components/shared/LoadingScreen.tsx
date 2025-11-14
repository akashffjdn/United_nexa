import { Truck } from 'lucide-react';

export const LoadingScreen = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-background">
      {/* Background Aurora Effect (matches LoginScreen) */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl opacity-50 animate-pulse delay-1000" />
      
      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center space-y-4">
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-full">
          {/* Pulsing Truck Icon */}
          <Truck size={40} className="text-primary animate-pulse" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground">
          United Transport
        </h1>
        
        {/* Pulsing Loading Text */}
        <p className="text-muted-foreground animate-pulse delay-500">
          Loading...
        </p>
      </div>
    </div>
  );
};