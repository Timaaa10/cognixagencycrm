
import React, { useState, useEffect } from 'react';
import { UserProfile, AgencySettings, Theme } from '../types';
import { crmService } from '../services/crmService';
import { auth } from '../firebase';
import ConfirmationModal from '../components/ConfirmationModal';

interface SettingsProps {
  onProfileUpdate?: (profile: UserProfile) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  userProfile?: UserProfile | null;
}

const Settings: React.FC<SettingsProps> = ({ onProfileUpdate, theme, onThemeChange, userProfile }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile>({
    uid: '',
    name: '',
    role: 'Admin',
    email: ''
  });

  const [agency, setAgency] = useState<AgencySettings>({
    agencyName: 'Cognix Agency',
    currency: 'USD',
    monthlyGoal: 50000,
    yearlyGoal: 500000
  });

  // New Employee Form State
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    password: '',
    position: '',
    role: 'Manager' as 'Manager' | 'Setter'
  });

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const isAdmin = userProfile?.role === 'Admin';

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const p = await crmService.getUserProfile(user.uid);
        const a = await crmService.getAgencySettings();
        
        if (p) setProfile(p);
        else setProfile(prev => ({ ...prev, uid: user.uid, email: user.email || '' }));
        
        if (a) setAgency({
          agencyName: a.agencyName || 'Cognix Agency',
          currency: a.currency || 'USD',
          monthlyGoal: a.monthlyGoal || 0,
          yearlyGoal: a.yearlyGoal || 0
        });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await crmService.saveUserProfile(profile);
      if (isAdmin) {
        await crmService.saveAgencySettings(agency);
      }
      if (onProfileUpdate) onProfileUpdate(profile);
      setModalConfig({
        isOpen: true,
        title: 'Configurations Sync',
        message: 'Global parameters and administrative identity updated successfully across the matrix.'
      });
    } catch (err) {
      console.error(err);
      setModalConfig({
        isOpen: true,
        title: 'Operation Failed',
        message: 'System was unable to synchronize settings. Ensure you have a stable network connection.',
        isDanger: true
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setCreatingUser(true);
    try {
      // Logic for creating an employee via a secure service call
      await crmService.createEmployeeAccount(newEmployee);
      setModalConfig({
        isOpen: true,
        title: 'Account Initialized',
        message: `System successfully registered ${newEmployee.name} as a ${newEmployee.role}. Auth credentials are active.`
      });
      setNewEmployee({ name: '', email: '', password: '', position: '', role: 'Manager' });
    } catch (err: any) {
      console.error(err);
      setModalConfig({
        isOpen: true,
        title: 'Deployment Error',
        message: err.message || 'The neural node was unable to initialize the requested identity.',
        isDanger: true
      });
    } finally {
      setCreatingUser(false);
    }
  };

  if (loading) return (
    <div className="p-10 text-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-400 dark:text-slate-600 font-bold text-xs uppercase tracking-widest">Loading System Matrix...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Control Center</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage agency parameters, administrative identities, and interface preferences.</p>
      </div>

      <div className="grid gap-8">
        {/* User Identity */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-black text-slate-900 dark:text-slate-300 text-[10px] uppercase tracking-[0.2em]">Profile Configuration</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2">Display Name</label>
              <input 
                type="text" 
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 dark:focus:border-blue-500/30 text-slate-900 dark:text-slate-100 transition-all font-bold"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2">Email Identity</label>
              <input readOnly type="email" className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-600 outline-none cursor-not-allowed font-medium" value={profile.email} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2">Matrix Role</label>
              <input readOnly type="text" className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-600 outline-none cursor-not-allowed font-medium" value={profile.role} />
            </div>
          </div>
        </section>

        {/* Global Agency Params - Admin Only */}
        {isAdmin && (
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-black text-slate-900 dark:text-slate-300 text-[10px] uppercase tracking-[0.2em]">Global Parameters</h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2">Agency Name</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 dark:focus:border-blue-500/30 text-slate-900 dark:text-slate-100 font-bold"
                  value={agency.agencyName}
                  onChange={(e) => setAgency({ ...agency, agencyName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2">Currency</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-slate-100 font-bold"
                  value={agency.currency}
                  onChange={(e) => setAgency({ ...agency, currency: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2">Monthly Goal</label>
                <input 
                  type="number" 
                  className="w-full px-5 py-3.5 bg-slate-900 dark:bg-slate-950 border dark:border-slate-800 text-white dark:text-blue-500 rounded-xl outline-none font-black text-xl shadow-xl dark:shadow-none"
                  value={agency.monthlyGoal}
                  onChange={(e) => setAgency({ ...agency, monthlyGoal: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2">Yearly Goal</label>
                <input 
                  type="number" 
                  className="w-full px-5 py-3.5 bg-slate-900 dark:bg-slate-950 border dark:border-slate-800 text-white dark:text-blue-500 rounded-xl outline-none font-black text-xl shadow-xl dark:shadow-none"
                  value={agency.yearlyGoal}
                  onChange={(e) => setAgency({ ...agency, yearlyGoal: Number(e.target.value) })}
                />
              </div>
            </div>
          </section>
        )}

        {/* Team Management - Admin Only */}
        {isAdmin && (
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-black text-slate-900 dark:text-slate-300 text-[10px] uppercase tracking-[0.2em]">Team Activation</h3>
              <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Admin Authorization Required</span>
            </div>
            <div className="p-8">
              <form onSubmit={handleCreateEmployee} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                    <input required type="text" className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 outline-none text-sm text-slate-900 dark:text-slate-100 font-bold" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} placeholder="Ex: John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Position</label>
                    <input required type="text" className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 outline-none text-sm text-slate-900 dark:text-slate-100 font-bold" value={newEmployee.position} onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })} placeholder="Ex: Lead Closer" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Work Email</label>
                    <input required type="email" className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 outline-none text-sm text-slate-900 dark:text-slate-100" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} placeholder="email@agency.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Initial Password</label>
                    <input required type="password" title="Minimum 6 characters" className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 outline-none text-sm text-slate-900 dark:text-slate-100" value={newEmployee.password} onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })} placeholder="••••••••" minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">System Role</label>
                    <select className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 outline-none text-sm text-slate-900 dark:text-slate-100 font-bold appearance-none cursor-pointer" value={newEmployee.role} onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as any })}>
                      <option value="Manager">Manager</option>
                      <option value="Setter">Setter</option>
                    </select>
                  </div>
                </div>
                <div className="pt-2">
                  <button disabled={creatingUser} type="submit" className="w-full py-4 bg-slate-900 dark:bg-slate-100 dark:text-slate-950 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                    {creatingUser ? <div className="w-4 h-4 border-2 border-slate-400 dark:border-slate-500 border-t-white dark:border-t-slate-950 rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>}
                    Activate Team Member Account
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Interface Preference */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-black text-slate-900 dark:text-slate-300 text-[10px] uppercase tracking-[0.2em]">Interface Preference</h3>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => onThemeChange('light')} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${theme === 'light' ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z"/></svg>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest text-center">Light Mode</p>
              </button>
              <button onClick={() => onThemeChange('dark')} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${theme === 'dark' ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest text-center">High Performance</p>
              </button>
              <button onClick={() => onThemeChange('system')} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${theme === 'system' ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'system' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest text-center">Adaptive Sync</p>
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="flex justify-end pt-10">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 dark:bg-slate-100 dark:text-slate-950 hover:bg-black dark:hover:bg-white text-white px-12 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl dark:shadow-none disabled:opacity-50 flex items-center gap-4 active:scale-95"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin"></div> : null}
          {saving ? 'Synchronizing...' : 'Apply Global Updates'}
        </button>
      </div>

      <ConfirmationModal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} title={modalConfig.title} message={modalConfig.message} isDanger={modalConfig.isDanger} />
    </div>
  );
};

export default Settings;