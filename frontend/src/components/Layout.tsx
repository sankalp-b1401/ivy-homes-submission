import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  KeyRound, 
  Bookmark, 
  BarChart3, 
  LogOut, 
  User as UserIcon, 
  MapPin, 
  Sparkles,
  Menu,
  X,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Buy', path: '/', icon: Home, desc: 'Verified Homes' },
    { name: 'Rent', path: '/rentals', icon: KeyRound, desc: 'Premium Rentals' },
    { name: 'Projects', path: '/projects', icon: Building2, desc: 'New Launches' },
    { name: 'Saved', path: '/saved', icon: Bookmark, desc: 'Favorites' },
    { name: 'Insights', path: '/insights', icon: BarChart3, desc: 'Market Trends' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-stone-200/70 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex flex-col group py-0.5">
              <span className="font-serif font-bold text-2xl sm:text-[26px] tracking-tight text-stone-900 group-hover:text-[#0D3B2E] transition-colors leading-tight">
                Ivy Homes
              </span>
              <span className="text-xs uppercase tracking-[0.22em] text-stone-500 font-semibold group-hover:text-stone-700 transition-colors">
                Curated Living
              </span>
            </Link>

            {/* Location Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-stone-100/80 border border-stone-200/60 rounded-full text-xs text-stone-600 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#0D3B2E]" />
              <span>Bengaluru, KA</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#0D3B2E] text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-950 hover:bg-stone-200/50"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-emerald-300" : "text-stone-400")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile / Auth Area */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200/80 text-xs font-medium text-stone-700">
                  <div className="w-6 h-6 rounded-full bg-[#0D3B2E]/10 text-[#0D3B2E] flex items-center justify-center font-bold text-xs">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[130px] truncate">{user.email}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 hover:text-red-700 hover:bg-red-50/80 transition-colors border border-transparent hover:border-red-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0D3B2E] hover:bg-[#124b3b] shadow-sm transition-all"
              >
                Sign in
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-stone-700 hover:bg-stone-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-stone-200/80 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1 pb-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#0D3B2E] text-white"
                        : "text-stone-700 hover:bg-stone-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <div>
                        <div>{item.name}</div>
                        <div className={cn("text-xs font-normal", isActive ? "text-emerald-200" : "text-stone-400")}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {user && (
              <div className="mt-3 pt-3 border-t border-stone-200 flex items-center justify-between px-4">
                <div className="text-xs text-stone-600 truncate">{user.email}</div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto bg-stone-900 text-stone-300 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex flex-col">
              <span className="font-serif font-bold text-2xl text-white tracking-tight leading-tight">
                Ivy Homes
              </span>
              <span className="text-xs uppercase tracking-[0.22em] text-stone-400 font-semibold">
                Curated Living
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Curated property marketplace connecting verified home seekers with institutional-grade residences in Bangalore.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>100% RERA & Legal Verification</span>
            </div>
          </div>

          {/* Quick Discover Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-4">
              Explore Cities
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li><Link to="/?locality=koramangala" className="hover:text-white transition-colors">Koramangala</Link></li>
              <li><Link to="/?locality=indiranagar" className="hover:text-white transition-colors">Indiranagar</Link></li>
              <li><Link to="/?locality=whitefield" className="hover:text-white transition-colors">Whitefield</Link></li>
              <li><Link to="/?locality=hsr+layout" className="hover:text-white transition-colors">HSR Layout</Link></li>
              <li><Link to="/?locality=bellandur" className="hover:text-white transition-colors">Bellandur Tech Corridor</Link></li>
            </ul>
          </div>

          {/* Property Types */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-4">
              Residences
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li><Link to="/?property_type=apartment" className="hover:text-white transition-colors">Gated Apartments</Link></li>
              <li><Link to="/?property_type=villa" className="hover:text-white transition-colors">Private Villas</Link></li>
              <li><Link to="/?property_type=plot" className="hover:text-white transition-colors">Residential Plots</Link></li>
              <li><Link to="/rentals" className="hover:text-white transition-colors">Executive Rentals</Link></li>
              <li><Link to="/projects" className="hover:text-white transition-colors">Pre-Launch & New Projects</Link></li>
              <li><Link to="/insights" className="hover:text-white transition-colors">Market Analytics Report</Link></li>
            </ul>
          </div>

          {/* Concierge & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-4">
              Private Concierge
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Speak with a certified property advisor for personalized walkthroughs and valuation guidance.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-800 text-stone-200 text-xs font-medium">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>+91 80 4710 9200</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            © {new Date().getFullYear()} Ivy Homes Portal. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>RERA Reg: PRM/KA/RERA/1251/310/AG/180611/000982</span>
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col selection:bg-[#0D3B2E]/10 selection:text-[#0D3B2E]">
      <Navbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
