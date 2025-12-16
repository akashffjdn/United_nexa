import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  FilePlus, 
  FileSymlink, 
  Navigation, 
  Archive, 
  Calendar, 
  ArrowRight,
  Package,
  ClipboardList,
  Hash,
  Activity,
  TrendingUp
} from 'lucide-react';
import api from '../../../utils/api';

const StatCard = ({ title, value, icon: Icon, gradient, delay, onClick }: any) => (
  <div 
    onClick={onClick} 
    className={`stat-card group relative overflow-hidden rounded-2xl p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${gradient} ${delay} animate-in fade-in slide-in-from-bottom-4`}
  >
    {/* Decorative Elements */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
    
    {/* Shine Effect */}
    <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </div>
    
    {/* Icon */}
    <div className="relative z-10 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
      <Icon className="w-6 h-6" />
    </div>
    
    {/* Content */}
    <div className="relative z-10">
      <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
      <div className="flex items-end justify-between">
        <p className="text-4xl font-bold tracking-tight">{value}</p>
        <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
      </div>
    </div>
    
    {/* Bottom Glow Line */}
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/40 to-white/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
  </div>
);

const ActionCard = ({ title, subtitle, icon: Icon, gradient, delay, onClick }: any) => (
  <div 
    onClick={onClick} 
    className={`action-card group relative overflow-hidden bg-card border border-border hover:border-primary/30 rounded-xl p-4 transition-all duration-300 cursor-pointer hover:shadow-md ${delay} animate-in fade-in slide-in-from-right-4`}
  >
    {/* Hover Background Gradient */}
    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <div className="relative z-10 flex items-center gap-4">
      {/* Icon */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ${gradient}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      {/* Text */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      
      {/* Arrow */}
      <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary flex-shrink-0" />
    </div>
  </div>
);

const OverviewStat = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
  <div className="overview-stat group bg-card border border-border hover:border-primary/20 rounded-xl p-4 transition-all duration-300 hover:shadow-md relative overflow-hidden">
    {/* Hover Glow Effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">{value}</div>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
    </div>
  </div>
);

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayGc: 0,
    weekGc: 0,
    tripSheetsWeek: 0,
    activeTrips: 0,
    pendingStock: 0,
    totalRecords: 0,
    loadingSheetsWeek: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/operations/dashboard/stats', { skipLoader: true } as any);
        setStats(data);
      } catch (e) {
        console.error("Failed to fetch dashboard stats", e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-3 p-4 md:p-6 animate-in fade-in duration-500">
      <style>{`
        /* Staggered entrance animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        
        .stat-card {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        
        .action-card {
          animation: fadeInRight 0.5s ease-out forwards;
        }
        
        .action-card:nth-child(1) { animation-delay: 0.15s; }
        .action-card:nth-child(2) { animation-delay: 0.25s; }
        .action-card:nth-child(3) { animation-delay: 0.35s; }
        .action-card:nth-child(4) { animation-delay: 0.45s; }
        
        .overview-stat {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        
        .overview-stat:nth-child(1) { animation-delay: 0.2s; }
        .overview-stat:nth-child(2) { animation-delay: 0.3s; }
        .overview-stat:nth-child(3) { animation-delay: 0.4s; }
        .overview-stat:nth-child(4) { animation-delay: 0.5s; }
        
        .shine-effect > div {
          animation: shimmer 0.8s ease-out;
        }
        
        /* Live indicator pulse */
        @keyframes live-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
        
        .live-dot {
          animation: live-pulse 2s ease-in-out infinite;
        }
        
        /* Card hover lift */
        .card-hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .card-hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
        }
        
        /* Icon bounce on hover */
        @keyframes icon-bounce {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.15) rotate(6deg);
          }
        }
        
        .group:hover .icon-bounce {
          animation: icon-bounce 0.4s ease;
        }
      `}</style>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-500">
        {/* Welcome Message */}
        <div>
          <p className="text-muted-foreground">Welcome back,</p>
          <h1 className="text-2xl font-bold text-foreground">
            Here's your operations overview
          </h1>
        </div>
        
        {/* Date Badge */}
        <div className="inline-flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl shadow-sm card-hover-lift">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-sm font-semibold text-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid - Using items-stretch to make columns equal height */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-stretch">
        
        {/* Left Column - Stats & Overview */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Stat Cards - Colorful Gradients */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard 
              title="Today's GC Entries" 
              value={stats.todayGc} 
              icon={FilePlus} 
              gradient="bg-gradient-to-br from-blue-500 to-blue-600" 
              delay="duration-500" 
              onClick={() => navigate('/gc-entry')} 
            />
            <StatCard 
              title="Active Trips" 
              value={stats.activeTrips} 
              icon={Truck} 
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" 
              delay="duration-500 delay-75" 
              onClick={() => navigate('/tripsheet')} 
            />
            <StatCard 
              title="Pending Stock" 
              value={stats.pendingStock} 
              icon={Archive} 
              gradient="bg-gradient-to-br from-amber-500 to-orange-500" 
              delay="duration-500 delay-150" 
              onClick={() => navigate('/pending-stock')} 
            />
          </div>

          {/* Weekly Overview Card - flex-1 to fill remaining space */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 flex-1 flex flex-col card-hover-lift">
            {/* Card Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Weekly Overview</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Last 7 days activity summary</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full live-dot" />
                  Live
                </div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            {/* Stats Grid - flex-1 to fill remaining space */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 flex-1">
              <OverviewStat label="GC Entries" value={stats.weekGc} icon={Hash} color="bg-blue-500" />
              <OverviewStat label="Loading Sheets" value={stats.loadingSheetsWeek} icon={ClipboardList} color="bg-indigo-500" />
              <OverviewStat label="Trip Sheets" value={stats.tripSheetsWeek} icon={Truck} color="bg-emerald-500" />
              <OverviewStat label="Total Records" value={stats.totalRecords} icon={Package} color="bg-purple-500" />
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-card border border-border rounded-2xl shadow-sm flex-1 animate-in fade-in slide-in-from-right-4 duration-500 delay-150 overflow-hidden flex flex-col card-hover-lift">
            {/* Card Header */}
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
                  <p className="text-sm text-muted-foreground">Jump to common tasks</p>
                </div>
              </div>
            </div>
            
            {/* Action Items - flex-1 to fill remaining space */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-center">
              <ActionCard 
                title="New GC Entry" 
                subtitle="Create a goods consignment" 
                icon={FilePlus} 
                gradient="bg-gradient-to-br from-blue-500 to-blue-600" 
                delay="duration-300" 
                onClick={() => navigate('/gc-entry/new')} 
              />
              <ActionCard 
                title="Loading Sheet" 
                subtitle="Prepare loading manifest" 
                icon={FileSymlink} 
                gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" 
                delay="duration-300 delay-75" 
                onClick={() => navigate('/loading-sheet')} 
              />
              <ActionCard 
                title="New Trip Sheet" 
                subtitle="Schedule a delivery trip" 
                icon={Navigation} 
                gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" 
                delay="duration-300 delay-150" 
                onClick={() => navigate('/tripsheet/new')} 
              />
              <ActionCard 
                title="Pending Stock" 
                subtitle="View pending inventory" 
                icon={Archive} 
                gradient="bg-gradient-to-br from-amber-500 to-orange-500" 
                delay="duration-300 delay-200" 
                onClick={() => navigate('/pending-stock')} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};