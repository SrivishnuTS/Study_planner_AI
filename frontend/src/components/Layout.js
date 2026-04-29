import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, BrainCircuit, LineChart, History, CalendarDays, Sun, Moon, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children, theme, toggleTheme }) {
  const loc = useLocation().pathname;
  const nav = useNavigate();
  
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey) {
        if (e.key === '1') nav('/');
        if (e.key === '2') nav('/predict');
        if (e.key === '3') nav('/analytics');
        if (e.key === '4') nav('/history');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nav]);

  const navs = [
    { path: '/', icon: Activity, label: 'Dashboard', shortcut: 'Ctrl+1' },
    { path: '/predict', icon: BrainCircuit, label: 'Simulator', shortcut: 'Ctrl+2' },
    { path: '/analytics', icon: LineChart, label: 'Analytics', shortcut: 'Ctrl+3' },
    { path: '/history', icon: History, label: 'History', shortcut: 'Ctrl+4' },
    { path: '/weekly', icon: CalendarDays, label: 'Weekly AI', shortcut: 'Ctrl+5' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 bg-card border-r border-border flex flex-col justify-between p-6 hidden lg:flex z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-8 flex items-center gap-2">
            <BrainCircuit size={26}/> StudyAI Pro
          </h1>
          <nav className="flex flex-col gap-2">
            {navs.map(n => {
              const isActive = loc === n.path;
              return (
                <Link key={n.path} to={n.path} className={`flex items-center justify-between p-2.5 rounded-md transition-colors ${isActive ? 'bg-[#E8EEF9] dark:bg-[#1E3A8A33] text-primary font-semibold' : 'hover:bg-muted text-text-secondary'}`}>
                  <div className="flex items-center gap-3"><n.icon size={18} /> <span className="tracking-wide text-sm">{n.label}</span></div>
                  <span className="text-[10px] text-text-secondary opacity-50">{n.shortcut}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <button onClick={toggleTheme} className="flex items-center gap-3 p-2.5 text-text-secondary hover:bg-muted rounded-md transition-colors text-sm font-medium">
          {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative z-0 scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div key={loc} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <div className="fixed bottom-6 right-6 z-50 group">
        <div className="absolute bottom-full right-0 mb-3 w-64 bg-card text-text-secondary border border-border p-4 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <p className="text-sm font-medium">I'm your AI assistant! Try the simulator (Ctrl+2) to optimize your next study session.</p>
        </div>
        <button className="bg-primary hover:opacity-90 text-white p-3 rounded-full shadow-md transition-transform hover:scale-105">
          <MessageSquare size={22} />
        </button>
      </div>
      
      {/* Top right floating Auth corner for mobile/desktop optional */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        {localStorage.getItem('study_ai_user') ? (
          <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-full border border-border shadow-sm">
            <span className="text-sm font-semibold text-text">
              {JSON.parse(localStorage.getItem('study_ai_user')).username}
            </span>
            <button 
              onClick={() => {
                localStorage.removeItem('study_ai_token');
                localStorage.removeItem('study_ai_user');
                nav('/login');
              }}
              className="text-xs text-red-500 hover:text-red-600 font-medium ml-2"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-primary text-sm px-5 py-2">
            Log In
          </Link>
        )}
      </div>

    </div>
  );
}
