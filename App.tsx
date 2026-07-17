
import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from '@firebase/auth';
import { auth } from './firebase';
import { crmService } from './services/crmService';
import { Lead, View, LeadStatus, UserProfile, Expense, Transaction, Theme } from './types';

// Components
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Settings from './pages/Settings';
import Financials from './pages/Financials';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>((localStorage.getItem('cognix-theme') as Theme) || 'system');
  
  const lastSyncRef = useRef<number>(0);

  // Derived Access Control
  // Fix: Moved isAdmin to component scope to fix "Cannot find name 'isAdmin'" error on line 206
  const isAdmin = profile?.role === 'Admin';

  // Theme Logic
  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (t: Theme) => {
      if (t === 'dark') {
        root.classList.add('dark');
      } else if (t === 'light') {
        root.classList.remove('dark');
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', isDark);
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('cognix-theme', newTheme);
  };

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userProfile = await crmService.getUserProfile(currentUser.uid);
          setProfile(userProfile);
        } catch (err) {
          console.error("Failed to fetch profile:", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const unsubscribeLeads = crmService.subscribeToLeads((data) => {
      setLeads(data);
    });

    const unsubscribeTransactions = crmService.subscribeToTransactions((data) => {
      setTransactions(data);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeLeads();
      unsubscribeTransactions();
    };
  }, []); // Run once on mount

  // Handle role-based redirects separately when currentView or profile changes
  useEffect(() => {
    if (profile && profile.role !== 'Admin' && (currentView === 'dashboard' || currentView === 'financials')) {
      setCurrentView('database');
    }
  }, [profile, currentView]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-[3px] border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Initializing CRM</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const renderContent = () => {
    const expenses: Expense[] = transactions
      .filter(tx => tx.type === 'expense')
      .map(tx => ({
        id: tx.id,
        amount: tx.amount,
        category: tx.category as any,
        description: tx.description,
        date: tx.date
      }));

    switch (currentView) {
      case 'dashboard': 
        return isAdmin ? <Dashboard leads={leads} onNavigate={setCurrentView} /> : <Leads leads={leads} viewMode="database" profile={profile} />;
      case 'database':
        return <Leads leads={leads} viewMode="database" profile={profile} />;
      case 'leads': 
        return <Leads leads={leads.filter(l => l.status === LeadStatus.LEAD)} viewMode="leads" profile={profile} />;
      case 'deals': 
        return <Leads leads={leads.filter(l => l.status === LeadStatus.DEAL)} viewMode="deals" profile={profile} />;
      case 'clients':
        return <Leads leads={leads.filter(l => l.status === LeadStatus.CLIENT)} viewMode="clients" profile={profile} />;
      case 'financials':
        return isAdmin ? <Financials leads={leads} expenses={expenses} /> : <Leads leads={leads} viewMode="database" profile={profile} />;
      case 'settings':
        return <Settings onProfileUpdate={setProfile} theme={theme} onThemeChange={handleThemeChange} userProfile={profile} />;
      default: 
        return <Dashboard leads={leads} onNavigate={setCurrentView} />;
    }
  };

  const displayName = profile?.name || user.email?.split('@')[0] || "User";
  const displayRole = profile?.role || "Agency Admin";

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Sidebar currentView={currentView} setView={setCurrentView} profile={profile} />
      
      <div className="flex-1 flex flex-col min-h-screen border-l border-slate-100 dark:border-slate-900/50 overflow-hidden">
        <header className="h-20 bg-white dark:bg-slate-950/80 backdrop-blur-md px-10 flex items-center justify-between sticky top-0 z-40 border-b border-slate-50 dark:border-slate-900 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">
              {currentView === 'database' ? 'Main Database' : currentView}
            </div>
          </div>
          
          <div className="relative">
            {isMenuOpen && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsMenuOpen(false)}
              ></div>
            )}
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center gap-3 pl-4 py-1.5 pr-1.5 rounded-2xl transition-all duration-200 z-50 relative group ${isMenuOpen ? 'bg-slate-50 dark:bg-slate-900' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1 capitalize">{displayName}</p>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">{displayRole}</p>
              </div>
              <div className="w-9 h-9 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center text-white font-bold text-xs border border-slate-800 dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <svg 
                className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-200 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 mb-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Identity</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.email}</p>
                </div>
                
                <div className="h-px bg-slate-50 dark:bg-slate-800 mx-2 my-1"></div>
                
                <button 
                  onClick={() => { setCurrentView('settings'); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </button>
                
                {isAdmin && (
                  <button 
                    onClick={() => { setCurrentView('settings'); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Agency Settings
                  </button>
                )}

                <div className="h-px bg-slate-50 dark:bg-slate-800 mx-2 my-1"></div>

                <button 
                  onClick={() => signOut(auth)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-10 max-w-7xl w-full mx-auto overflow-y-auto custom-scrollbar">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;