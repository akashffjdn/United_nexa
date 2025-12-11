import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Truck,
  Store,
  Users, 
  X, 
  FileText, 
  Archive, 
  LayoutDashboard, 
  MapPin, 
  Package, 
  ClipboardList, 
  ShieldCheck,
  ChevronDown,
  Database,
  Car, 
  UserCircle, 
  Settings,
  History,
  LogOut
} from 'lucide-react'; 
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const { user, logout } = useAuth(); 
  
  const [isDataMgmtOpen, setIsDataMgmtOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/master') || location.pathname === '/users' || location.pathname === '/settings' || location.pathname === '/audit-logs') {
      setIsDataMgmtOpen(true);
    }
  }, [location.pathname]);

  // --- MENU DEFINITIONS ---
  
  const operationLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'GC Entry', href: '/gc-entry', icon: FileText },
    { name: 'Loading Sheet', href: '/loading-sheet', icon: ClipboardList },
    { name: 'Trip Sheet', href: '/trip-sheet', icon: Truck },
    { name: 'Pending Stock', href: '/pending-stock', icon: Archive },
  ];

  const dataManagementLinks = [
    { name: 'Consignors', href: '/master/consignors', icon: Store },
    { name: 'Consignees', href: '/master/consignees', icon: Users },
    { name: 'Vehicles', href: '/master/vehicles', icon: Car },
    { name: 'Drivers', href: '/master/drivers', icon: UserCircle },
    { name: 'From Places', href: '/master/from-places', icon: MapPin },
    { name: 'To Places', href: '/master/to-places', icon: MapPin },
    { name: 'Packings', href: '/master/packings', icon: Package },
    { name: 'Contents', href: '/master/contents', icon: FileText },
  ];

  if (user?.role === 'admin') {
    dataManagementLinks.unshift({ 
      name: 'Print Settings', 
      href: '/settings', 
      icon: Settings 
    });

    dataManagementLinks.push({ 
      name: 'Audit Logs', 
      href: '/audit-logs', 
      icon: History 
    });

    dataManagementLinks.push({ 
      name: 'User Management', 
      href: '/users', 
      icon: ShieldCheck 
    });
  }

  const isDataMgmtActive = location.pathname.startsWith('/master') || location.pathname === '/users' || location.pathname === '/settings' || location.pathname === '/audit-logs';

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-all duration-300 md:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Content */}
      <aside 
        // CHANGED: Reduced width from w-72 to w-64
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          
          {/* Header */}
          {/* CHANGED: Reduced padding from px-5 to px-4 to fit narrower width */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div className="leading-none">
                <span className="text-sm font-bold text-foreground">United</span>
                <span className="text-sm font-bold text-primary ml-1">Transport</span>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            
            {/* --- OPERATIONS SECTION --- */}
            <div className="px-3 mb-2">
              <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
                Operations
              </span>
            </div>
            
            {operationLinks.map((item) => (
              <NavLink 
                key={item.name} 
                to={item.href} 
                end={item.href === '/'} 
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
                onClick={() => setIsSidebarOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                      isActive 
                        ? 'bg-primary-foreground/20' 
                        : 'bg-muted group-hover:bg-secondary'
                    }`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}

            {/* --- SETTINGS SECTION --- */}
            <div className="pt-4 pb-2 px-3">
              <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
                Settings
              </span>
            </div>

            {/* Collapsible Data Management */}
            <button
              onClick={() => setIsDataMgmtOpen(!isDataMgmtOpen)}
              className={`w-full group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDataMgmtActive && !isDataMgmtOpen
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-7 h-7 shrink-0 rounded flex items-center justify-center transition-colors ${
                  isDataMgmtActive 
                    ? 'bg-primary/10' 
                    : 'bg-muted group-hover:bg-secondary'
                }`}>
                  <Database className="w-4 h-4" />
                </div>
                <span className="truncate">Data Management</span>
              </div>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isDataMgmtOpen ? 'rotate-0' : '-rotate-90'}`} />
            </button>

            {/* Sub-menu items */}
            <div className={`overflow-hidden transition-all duration-300 ease-out ${
              isDataMgmtOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}>
              {/* CHANGED: Adjusted left margin/padding for the sub-menu to save space */}
              <div className="ml-3.5 pl-3 border-l-2 border-border space-y-1 py-1">
                {dataManagementLinks.map((item) => (
                  <NavLink 
                    key={item.name} 
                    to={item.href}
                    end={item.href === '/master'} 
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? 'text-primary font-medium bg-primary/5'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="w-4 h-4 opacity-70 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>

          </nav>
          
          {/* Footer - User Profile */}
          <div className="p-3 border-t border-border">
            <div className="p-2.5 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2.5">
                {/* Avatar */}
                <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                  user?.role === 'admin' 
                    ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                    : 'bg-gradient-to-br from-primary to-primary/80'
                }`}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">
                    {user?.name || 'User'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      user?.role === 'admin' ? 'bg-purple-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {user?.role || 'Role'}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-1.5 shrink-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};