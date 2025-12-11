import React from 'react';
import { Truck } from 'lucide-react';

// Props interface with enhanced options
interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  variant?: 'default' | 'fullscreen' | 'minimal';
  showProgress?: boolean;
  progress?: number;
}

export const LoadingScreen = ({ 
  message = "Processing Request...",
  submessage = "Please wait...",
  variant = 'default',
  showProgress = false,
  progress = 0
}: LoadingScreenProps) => {
  
  // Modern animated loader with truck icon
  const Spinner = () => (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32">
      {/* Outer ring - track */}
      <div className="absolute inset-0 rounded-full border-[3px] sm:border-4 border-border"></div>
      
      {/* Primary spinning ring */}
      <div 
        className="absolute inset-0 rounded-full border-[3px] sm:border-4 border-primary border-t-transparent animate-spin"
        style={{ animationDuration: '1s' }}
      ></div>
      
      {/* Secondary spinning ring (reverse) */}
      <div 
        className="absolute inset-1.5 sm:inset-2 rounded-full border-[3px] sm:border-4 border-primary/40 border-b-transparent animate-spin"
        style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
      ></div>
      
      {/* Center icon container */}
      <div className="absolute inset-3 sm:inset-4 md:inset-5 rounded-full bg-primary/10 flex items-center justify-center">
        <Truck className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 text-primary animate-pulse" />
      </div>
    </div>
  );

  // Minimal spinner for minimal variant
  const MinimalSpinner = () => (
    <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16">
      <div className="absolute inset-0 rounded-full border-[3px] sm:border-4 border-border"></div>
      <div 
        className="absolute inset-0 rounded-full border-[3px] sm:border-4 border-primary border-t-transparent animate-spin"
        style={{ animationDuration: '0.8s' }}
      ></div>
    </div>
  );

  // Progress bar component
  const ProgressBar = () => (
    <div className="w-48 sm:w-56 md:w-64 mt-5 sm:mt-6">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Progress</span>
        <span className="text-[10px] sm:text-xs text-primary font-semibold">{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      </div>
    </div>
  );

  // Bouncing dots
  const BouncingDots = () => (
    <div className="flex items-center gap-1 sm:gap-1.5 mt-4 sm:mt-5">
      {[0, 150, 300].map((delay, index) => (
        <span 
          key={index}
          className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        ></span>
      ))}
    </div>
  );

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-5 sm:p-6 md:p-8 flex flex-col items-center max-w-[90vw] sm:max-w-xs animate-in fade-in zoom-in-95 duration-200">
          <MinimalSpinner />
          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-foreground font-medium text-center">
            {message}
          </p>
          {submessage && (
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground text-center">
              {submessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default / Fullscreen variant
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-background/95 backdrop-blur-sm transition-all duration-300">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl"></div>
      </div>
      
      {/* Content container */}
      <div className="relative flex flex-col items-center p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md">
        
        {/* Animated Spinner */}
        <div className="flex items-center justify-center">
          <Spinner />
        </div>

        {/* Dynamic Message */}
        <h2 className="mt-5 sm:mt-6 md:mt-8 text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight text-center">
          {message}
        </h2>
        
        {/* Submessage */}
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1.5 sm:mt-2 font-medium text-center">
          {submessage}
        </p>

        {/* Optional Progress Bar */}
        {showProgress && <ProgressBar />}

        {/* Animated Dots */}
        <BouncingDots />
      </div>

      {/* Footer branding */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 flex items-center gap-2 text-muted-foreground/50">
        <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="text-[10px] sm:text-xs font-medium">United Transport</span>
      </div>
    </div>
  );
};

// Demo component showing different variants with theme support
export default function LoadingScreenDemo() {
  const [variant, setVariant] = React.useState<'default' | 'minimal'>('default');
  const [progress, setProgress] = React.useState(0);
  const [showLoading, setShowLoading] = React.useState(false);

  React.useEffect(() => {
    if (!showLoading) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setShowLoading(false);
          return 0;
        }
        return prev + 10;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [showLoading]);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Loading Screen Variants</h1>
        
        {/* Controls Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Controls</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setVariant('default')}
              className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                variant === 'default' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setVariant('minimal')}
              className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                variant === 'minimal' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Minimal
            </button>
            <button
              onClick={() => {
                setProgress(0);
                setShowLoading(true);
              }}
              className="px-4 sm:px-6 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Preview
            </button>
          </div>
        </div>

        {/* Usage Examples Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Usage Examples</h2>
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
            <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border border-border overflow-x-auto">
              <code className="text-primary whitespace-pre">
                {`<LoadingScreen message="Loading data..." />`}
              </code>
            </div>
            <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border border-border overflow-x-auto">
              <code className="text-primary whitespace-pre">
{`<LoadingScreen 
  message="Uploading files..." 
  submessage="This may take a moment"
  variant="minimal"
/>`}
              </code>
            </div>
            <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border border-border overflow-x-auto">
              <code className="text-primary whitespace-pre">
{`<LoadingScreen 
  message="Processing..." 
  showProgress={true}
  progress={progress}
/>`}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Loading Screen */}
      {showLoading && (
        <LoadingScreen 
          message="Processing Your Request..." 
          submessage="Analyzing logistics data"
          variant={variant}
          showProgress={variant === 'default'}
          progress={progress}
        />
      )}
    </div>
  );
}