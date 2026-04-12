import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { 
    LogOut, User, LayoutDashboard, FileText, Briefcase, 
    Plus, Sparkles, Menu, X, BarChart3, Settings, Bell 
} from 'lucide-react';
import { NotificationBell } from './layout/NotificationBell';

/**
 * RESPONSIVE LAYOUT
 * - Mobile: Bottom navigation for core tabs
 * - Desktop: Sticky top navbar
 * - Tablet: Hamburger menu for secondary links
 */
export function Layout({ children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // ── Navigation Links Configuration ───────────────────────────────
  const seekerLinks = [
    { label: 'Matches', path: '/matches', icon: Sparkles, color: 'text-indigo-400' },
    { label: 'Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Tracker', path: '/tracker', icon: Briefcase },
    { label: 'Resumes', path: '/resumes', icon: FileText, special: true },
  ];

  const recruiterLinks = [
    { label: 'Dashboard', path: '/recruiter/dashboard', icon: LayoutDashboard },
    { label: 'Analytics', path: '/recruiter/analytics', icon: BarChart3 },
    { label: 'Post Job', path: '/recruiter/jobs/new', icon: Plus, special: true },
  ];

  // If user needs to assign a role, don't show any links yet
  const currentLinks = user?.needsRoleAssignment 
    ? [] 
    : (user?.role === 'recruiter' ? recruiterLinks : seekerLinks);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      
      {/* ── DESKTOP NAVBAR ─────────────────────────────────────────── */}
      <nav className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-white/5 bg-slate-950/20 backdrop-blur-md sticky top-0 z-50">
        <Link to={isAuthenticated ? (user?.role === 'recruiter' ? '/recruiter/dashboard' : '/dashboard') : '/'} className="flex items-center gap-2 group">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:rotate-12 transition-transform">
              <FileText className="text-slate-950" size={20} />
           </div>
           <span className="font-bold tracking-tighter text-2xl hidden sm:inline">ResumeMatch <span className="text-cyan-400">AI</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {isAuthenticated && currentLinks.map(link => (
                <Link 
                    key={link.path}
                    to={link.path} 
                    className={`flex items-center gap-2 transition-all duration-300 px-3 py-2 rounded-xl
                        ${link.special ? 'text-cyan-400 bg-cyan-400/5 border border-cyan-400/20 hover:bg-cyan-400/10' : 
                          isActive(link.path) ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white'}`}
                >
                    <link.icon size={16} className={link.color || ''} />
                    {link.label}
                </Link>
            ))}

            {isAuthenticated ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/5">
                <Link to="/profile" className="flex items-center gap-3 pr-2 group/user cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-cyan-500/20 group-hover/user:scale-110 transition-transform">
                    {user?.name?.charAt(0).toUpperCase() || <User size={16} />}
                  </div>
                  <span className="text-sm font-semibold text-slate-200 group-hover/user:text-cyan-400 transition-colors">
                    {user?.name}
                  </span>
                </Link>
                <NotificationBell />
                <button 
                  onClick={handleLogout}
                  className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link to="/login" className="text-slate-400 hover:text-white transition-colors">Sign In</Link>
                <Link to="/register" className="px-6 py-2.5 bg-white text-slate-950 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-xl">Start Free</Link>
              </div>
            )}
        </div>

        {/* Mobile Toggle */}
        {!isAuthenticated && (
            <div className="lg:hidden flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-slate-400">Login</Link>
                <Link to="/register" className="px-4 py-2 bg-white text-slate-950 rounded-lg font-bold text-sm">Join</Link>
            </div>
        )}
        
        {isAuthenticated && (
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
                {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
        )}
      </nav>

      {/* ── MOBILE MENU (Slide Down) ─────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lg:hidden fixed top-20 left-0 right-0 p-6 bg-slate-900 border-b border-white/10 z-40 shadow-2xl"
            >
                <div className="grid grid-cols-2 gap-4">
                    {currentLinks.map(link => (
                        <Link 
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-800/50 border border-white/5 text-slate-300"
                        >
                            <link.icon size={20} className="mb-2" />
                            <span className="text-xs font-bold">{link.label}</span>
                        </Link>
                    ))}
                    <button 
                        onClick={handleLogout}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400"
                    >
                        <LogOut size={20} className="mb-2" />
                        <span className="text-xs font-bold">Logout</span>
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <main className="flex-grow pb-24 lg:pb-0">
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────────────── */}
      {isAuthenticated && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-50">
            {currentLinks.slice(0, 4).map(link => (
                <Link 
                    key={link.path}
                    to={link.path}
                    className={`flex flex-col items-center gap-1 transition-colors
                        ${isActive(link.path) ? 'text-cyan-400' : 'text-slate-500'}`}
                >
                    <link.icon size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{link.label}</span>
                </Link>
            ))}
        </div>
      )}

      {/* Footer (Desktop Only) */}
      <footer className="hidden lg:block py-10 border-t border-white/5 text-center text-slate-500 text-sm">
         © 2026 ResumeMatch AI. Built with ❤️ for your career.
      </footer>
    </div>
  );
}
