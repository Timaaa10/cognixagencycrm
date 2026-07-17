
import React, { useState, useEffect } from 'react';
import { View, UserProfile } from '../types';
import Logo from './Logo';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  profile?: UserProfile | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, profile }) => {
  const [isCrmExpanded, setIsCrmExpanded] = useState(true);

  // Keep CRM expanded if any of its children are active
  useEffect(() => {
    if (['database', 'leads', 'deals', 'clients'].includes(currentView)) {
      setIsCrmExpanded(true);
    }
  }, [currentView]);

  const isAdmin = profile?.role === 'Admin';

  const crmItems = [
    { id: 'database' as View, label: 'Database', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
    { id: 'leads' as View, label: 'Leads', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'deals' as View, label: 'Deals', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012-2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'clients' as View, label: 'Clients', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-950 min-h-screen flex flex-col border-r border-slate-100 dark:border-slate-900/50 shrink-0 transition-colors duration-300">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10 text-slate-900 dark:text-white hover:opacity-80 transition-opacity cursor-pointer" onClick={() => setView(isAdmin ? 'dashboard' : 'database')}>
          <Logo className="w-10 h-10 shrink-0" />
          <span className="font-black text-slate-900 dark:text-white text-lg tracking-tighter leading-tight">Cognix Agency CRM</span>
        </div>
        
        <nav className="space-y-2">
          {/* Dashboard Item - Admin Only */}
          {isAdmin && (
            <button
              onClick={() => setView('dashboard')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[13px] font-bold transition-all mb-4 ${
                currentView === 'dashboard' 
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-xl shadow-slate-200 dark:shadow-none' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className={`w-5 h-5 ${currentView === 'dashboard' ? 'text-blue-400 dark:text-blue-600' : 'text-slate-400 dark:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </button>
          )}

          {/* CRM Matrix Category Header */}
          <div className="space-y-1">
            <button
              onClick={() => setIsCrmExpanded(!isCrmExpanded)}
              className="w-full group flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800/50 hover:border-slate-200 dark:hover:border-slate-800 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isCrmExpanded ? 'bg-blue-600 scale-110 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                <span className="text-[10px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-[0.2em] group-hover:tracking-[0.25em] transition-all">CRM Matrix</span>
              </div>
              <div className="p-1 rounded-lg bg-white/80 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-transform group-hover:scale-110">
                <svg 
                  className={`w-3 h-3 text-slate-400 dark:text-slate-500 transition-transform duration-500 ${isCrmExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Sub-items */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isCrmExpanded ? 'max-h-[500px] opacity-100 py-2' : 'max-h-0 opacity-0'}`}>
              <div className="pl-4 space-y-1 relative">
                <div className="absolute left-2 top-0 bottom-4 w-px bg-slate-100 dark:bg-slate-900"></div>
                
                {crmItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`w-full flex items-center gap-3 px-6 py-3 rounded-xl text-[12px] font-bold transition-all relative group ${
                        isActive 
                        ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-100/30 dark:border-blue-900/40' 
                        : 'text-slate-500 dark:text-slate-500 hover:bg-slate-50/80 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className={`absolute left-[-11px] w-2 h-2 rounded-full border bg-white dark:bg-slate-950 transition-all duration-300 ${isActive ? 'border-blue-500 scale-125' : 'border-slate-200 dark:border-slate-800 scale-100 group-hover:border-slate-300 dark:group-hover:border-slate-700'}`}></div>
                      
                      <svg className={`w-4 h-4 shrink-0 transition-colors duration-300 ${isActive ? 'text-blue-600 dark:text-blue-500' : 'text-slate-300 dark:text-slate-700 group-hover:text-slate-500 dark:group-hover:text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} />
                      </svg>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-4"></div>

          {/* Financials - Admin Only */}
          {isAdmin && (
            <button
              onClick={() => setView('financials')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[13px] font-bold transition-all mb-2 ${
                currentView === 'financials' 
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-xl shadow-slate-200 dark:shadow-none' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className={`w-5 h-5 ${currentView === 'financials' ? 'text-blue-400 dark:text-blue-600' : 'text-slate-400 dark:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Financials
            </button>
          )}

          <button
            onClick={() => setView('settings')}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[13px] font-bold transition-all ${
              currentView === 'settings' 
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-xl shadow-slate-200 dark:shadow-none' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <svg className={`w-5 h-5 ${currentView === 'settings' ? 'text-blue-400 dark:text-blue-600' : 'text-slate-400 dark:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-50 dark:border-slate-900/50 transition-colors duration-300">
        <div className="bg-slate-50/80 dark:bg-slate-900 rounded-[1.25rem] p-4 border border-slate-100/50 dark:border-slate-800 transition-colors duration-300">
          {profile ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-950 text-[10px] font-black shrink-0 shadow-sm transition-colors duration-300">
                {profile.name?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-900 dark:text-slate-200 truncate tracking-tight">{profile.name}</p>
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{profile.role}</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Core System</p>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 transition-colors duration-300">
                <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                <span className="text-[10px] font-black uppercase tracking-tight">AI Active</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;