import { useState }  from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-muted/50">
      {/* Sidebar Component */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header (Top Bar) Component */}
        <Header setIsSidebarOpen={setIsSidebarOpen} />

        {/* Page Content */}
        {/* CHANGE: Reduced padding from 'p-4 md:p-8' to 'p-2' to minimize gaps */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
          {/* CHANGE: Use max-w-full to let content stretch closer to edges if needed */}
          <div className="max-w-full mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};