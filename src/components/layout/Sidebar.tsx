import { NavLink } from 'react-router-dom';
// Make sure your logo is at src/assets/company-logo.png
import Logo from '../../assets/company-logo.png'; 
import { Truck, Users, X, FileText } from 'lucide-react'; // Added FileText icon

const navLinks = [
  { name: 'Consignors', href: '/consignors', icon: Truck },
  { name: 'Consignees', href: '/consignees', icon: Users },
  { name: 'GC Entry', href: '/gc-entry', icon: FileText }, // New GC Entry link
];

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) => {
  
  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  return (
    <>
      {/* Mobile Sidebar (Overlay) */}
      <div 
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar Content */}
      <aside 
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 bg-background shadow-lg transform transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-muted">
            <div className="flex items-center">
              <img className="h-8 w-auto" src={Logo} alt="Sivakasi Transport" />
              <span className="ml-3 text-lg font-bold text-foreground">
                S.C.T. Admin
              </span>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {navLinks.map((item) => (
              <NavLink 
                key={item.name} 
                to={item.href} 
                className={getLinkClass}
                onClick={() => setIsSidebarOpen(false)} // Close on mobile nav click
              >
                <item.icon className="mr-3" size={18} />
                {item.name}
              </NavLink>
            ))}
          </nav>
          
          {/* Sidebar Footer (Optional) */}
          <div className="p-4 border-t border-muted">
            <div className="text-sm text-muted-foreground">© 2025 S.C. Transport</div>
          </div>
        </div>
      </aside>
    </>
  );
};