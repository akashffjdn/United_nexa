import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import {
  Truck,
  Users,
  Hash,
  FilePlus,
  Navigation,
  FileSymlink,
  FileText,
  Archive,
  MapPin,
  Package,
  ClipboardList,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<LucideProps>;
  gradient: string;
  trend?: string;
}

const StatCard = ({ title, value, icon: Icon, gradient, trend }: StatCardProps) => (
  // --- FIX: Replaced bg-white, border-gray, text-gray ---
  <div className="group relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
    <div className="relative p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
          <Icon className="text-white" size={26} strokeWidth={2.5} />
        </div>
        {trend && (
          // Kept green-600 as it's a semantic "good" color
          <div className="flex items-center space-x-1 text-green-600 text-sm font-semibold">
            <TrendingUp size={16} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{value}</p>
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-border to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  </div>
);

interface PrimaryActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<LucideProps>;
  gradient: string;
  onClick: () => void;
}

const PrimaryActionCard = ({ title, description, icon: Icon, gradient, onClick }: PrimaryActionCardProps) => (
  <button
    onClick={onClick}
    // --- FIX: Replaced bg-white, border-gray, text-gray, text-white ---
    className="group relative overflow-hidden rounded-2xl bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-left w-full"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-all duration-500`} />
    <div className="relative p-8">
      <div className="flex items-start space-x-5">
        <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
          <Icon size={32} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-foreground group-hover:text-white transition-colors duration-500 mb-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground group-hover:text-white/90 transition-colors duration-500">
            {description}
          </p>
        </div>
        <ArrowRight
          size={24}
          className="flex-shrink-0 text-muted-foreground/70 group-hover:text-white transform group-hover:translate-x-2 transition-all duration-500"
        />
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
  </button>
);

interface QuickLinkItemProps {
  title: string;
  icon: React.ComponentType<LucideProps>;
  onClick: () => void;
}

const QuickLinkItem = ({ title, icon: Icon, onClick }: QuickLinkItemProps) => (
  <button
    onClick={onClick}
    // --- FIX: Replaced gray colors with theme colors ---
    className="group w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-muted transition-all duration-300 border border-transparent hover:border-border/50"
  >
    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center group-hover:from-blue-500 group-hover:to-cyan-500 transition-all duration-300">
      <Icon size={20} className="text-muted-foreground group-hover:text-white transition-colors duration-300" strokeWidth={2.5} />
    </div>
    <span className="flex-1 text-left text-sm font-semibold text-foreground group-hover:text-foreground transition-colors duration-300">
      {title}
    </span>
    <ArrowRight
      size={18}
      className="text-muted-foreground/70 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300"
    />
  </button>
);

interface QuickLinkSectionProps {
  title: string;
  icon: React.ComponentType<LucideProps>;
  items: {
    title: string;
    icon: React.ComponentType<LucideProps>;
    onClick: () => void;
  }[];
}

const QuickLinkSection = ({ title, icon: TitleIcon, items }: QuickLinkSectionProps) => (
  // --- FIX: Replaced bg-white, border-gray, text-gray ---
  <div className="relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-500">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full -mr-16 -mt-16" />
    <div className="relative">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
            <TitleIcon size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
      </div>
      <div className="p-3 space-y-1">
        {items.map((item) => (
          <QuickLinkItem key={item.title} {...item} />
        ))}
      </div>
    </div>
  </div>
);

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { consignors, consignees, gcEntries } = useData();

  const stats = [
    {
      title: 'Total Consignors',
      value: consignors.length,
      icon: Truck,
      gradient: 'from-blue-500 to-blue-600',
      trend: '+12%'
    },
    {
      title: 'Total Consignees',
      value: consignees.length,
      icon: Users,
      gradient: 'from-emerald-500 to-teal-600',
      trend: '+8%'
    },
    {
      title: 'Total GC Entries',
      value: gcEntries.length,
      icon: Hash,
      gradient: 'from-violet-500 to-purple-600',
      trend: '+24%'
    },
  ];

  const coreActions = [
    {
      title: 'New GC Entry',
      description: 'Create a new Goods Consignment note with instant processing',
      icon: FilePlus,
      gradient: 'from-blue-500 to-cyan-500',
      onClick: () => navigate('/gc-entry/new')
    },
    {
      title: 'New Trip Sheet',
      description: 'Manage and create new trip sheets for route planning',
      icon: Navigation,
      gradient: 'from-emerald-500 to-teal-500',
      onClick: () => {}
    },
    {
      title: 'New Loading Sheet',
      description: 'Organize loading sheets for efficient delivery operations',
      icon: FileSymlink,
      gradient: 'from-violet-500 to-purple-500',
      onClick: () => {}
    },
  ];

  const managementLinks = [
    { title: 'GC Entry List', icon: FileText, onClick: () => navigate('/gc-entry') },
    { title: 'Pending Stock Report', icon: Archive, onClick: () => navigate('/pending-stock') },
    { title: 'Manage Consignors', icon: Truck, onClick: () => navigate('/consignors') },
    { title: 'Manage Consignees', icon: Users, onClick: () => navigate('/consignees') },
  ];

  const masterDataLinks = [
    { title: '"From" Places Entry', icon: MapPin, onClick: () => {} },
    { title: '"To" Places Entry', icon: MapPin, onClick: () => {} },
    { title: 'Packings Entry', icon: Package, onClick: () => {} },
    { title: 'Contents Entry', icon: ClipboardList, onClick: () => {} },
  ];

  return (
    <div className="space-y-12">
      <div className="relative">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
        <div className="relative">
          {/* --- FIX: Replaced gray colors with theme colors --- */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Live Dashboard</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent mb-3">
            Transport Operations Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Real-time insights and quick access to all your transport management tools
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center space-x-3">
           {/* --- FIX: Replaced blue color with primary --- */}
          <Activity className="text-primary" size={28} strokeWidth={2.5} />
          <h2 className="text-3xl font-bold text-foreground">
            Core Operations
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {coreActions.map((action) => (
            <PrimaryActionCard key={action.title} {...action} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickLinkSection
          title="Management & Reports"
          icon={FileText}
          items={managementLinks}
        />
        <QuickLinkSection
          title="Master Data Settings"
          icon={Package}
          items={masterDataLinks}
        />
      </div>

    </div>
  );
};