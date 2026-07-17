
import React from 'react';
import { Lead, LeadStatus, LeadSource, AgencySettings, View, ServiceType } from '../types';

interface VisualAnalyticsProps {
  leads: Lead[];
  settings: AgencySettings | null;
  onNavigate?: (view: View) => void;
}

const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({ leads, settings, onNavigate }) => {
  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' });
  const currentYear = now.getFullYear();

  // Next Month specific name for MRR prediction
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthName = nextMonthDate.toLocaleString('en-US', { month: 'long' });
  
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  // Recurring services
  const isSubscriptionService = (service: ServiceType) => [
    ServiceType.FULL_REVENUE_SYSTEM,
    ServiceType.ADS_MANAGEMENT,
    ServiceType.AI_CALLERS
  ].includes(service);

  const clients = leads.filter(l => l.status === LeadStatus.CLIENT);

  const getTimestamp = (lead: Lead) => {
    if (!lead.updatedAt) return 0;
    if (lead.updatedAt.seconds) return lead.updatedAt.seconds * 1000;
    return new Date(lead.updatedAt).getTime();
  };

  const isPaidThisMonth = (lead: Lead) => {
    if (lead.status !== LeadStatus.CLIENT) return false;
    if (!lead.lastPaymentDate) return false;
    
    const pDate = lead.lastPaymentDate.seconds 
      ? new Date(lead.lastPaymentDate.seconds * 1000) 
      : new Date(lead.lastPaymentDate);
      
    return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
  };

  // Current Month Revenue: Strictly Paid
  const currentMonthRevenue = clients
    .filter(l => isPaidThisMonth(l))
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);

  // Year Revenue: Based on general activity for now (approximation without full transaction history)
  const currentYearRevenue = clients
    .filter(l => getTimestamp(l) >= startOfYear)
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);

  // MRR Forecast: Shows potential (All active subscription clients)
  const mrrValue = clients
    .filter(l => isSubscriptionService(l.service))
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);

  const mGoal = settings?.monthlyGoal || 1;
  const yGoal = settings?.yearlyGoal || 1;
  const mProgress = Math.min((currentMonthRevenue / mGoal) * 100, 100);
  const yProgress = Math.min((currentYearRevenue / yGoal) * 100, 100);

  const sourceCounts = leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sources = Object.values(LeadSource);
  const maxSourceCount = Math.max(...(Object.values(sourceCounts) as number[]), 1);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: settings?.currency || 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const circumference = 80 * Math.PI;
  const strokeDashoffset = circumference - (mProgress / 100) * circumference;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Card 1: Monthly Objective */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-between min-h-[300px] group transition-all hover:border-blue-200">
          <div className="w-full flex justify-between items-center">
            <div className="flex flex-col">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monthly Quota</h3>
              <p className="text-[10px] font-bold text-blue-600">{currentMonthName} {currentYear}</p>
            </div>
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
          </div>
          
          <div className="relative flex items-center justify-center my-4">
            <svg width="160" height="90" viewBox="0 0 200 110">
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className="text-blue-600 transition-all duration-1000" strokeDasharray={`${circumference} ${circumference}`} style={{ strokeDashoffset }} />
            </svg>
            <div className="absolute top-[50px] flex flex-col items-center">
              <span className="text-3xl font-black text-slate-900 leading-none">{mProgress.toFixed(0)}%</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 pt-4 border-t border-slate-50">
            <div className="text-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Current</p>
              <p className="text-xs font-black text-slate-900">{formatCurrency(currentMonthRevenue)}</p>
            </div>
            <div className="text-center border-l border-slate-100">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Target</p>
              <p className="text-xs font-black text-slate-900">{formatCurrency(mGoal)}</p>
            </div>
          </div>
        </div>

        {/* Card 2: MRR Forecast */}
        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MRR Forecast</h3>
              <p className="text-[10px] font-bold text-emerald-400">{nextMonthName} Pipeline</p>
            </div>
            <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded uppercase tracking-widest">Active</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center relative z-10 my-4">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expected Recurring</p>
            <h4 className="text-3xl font-black tracking-tight">{formatCurrency(mrrValue)}</h4>
          </div>

          <div className="relative z-10 p-3 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase">Subscription Base</span>
              <span className="text-xs font-black">{clients.filter(l => isSubscriptionService(l.service)).length} Active</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pipeline Hub */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[300px]">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Pipeline Hub</h3>
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {[
              { label: 'Leads', view: 'leads' as View, count: leads.filter(l => l.status === LeadStatus.LEAD).length, color: 'bg-slate-900', w: '100%' },
              { label: 'Deals', view: 'deals' as View, count: leads.filter(l => l.status === LeadStatus.DEAL).length, color: 'bg-blue-600', w: '85%' },
              { label: 'Clients', view: 'clients' as View, count: leads.filter(l => l.status === LeadStatus.CLIENT).length, color: 'bg-emerald-500', w: '70%' },
            ].map((item, idx) => (
              <button key={idx} onClick={() => onNavigate?.(item.view)} className="group flex flex-col items-center w-full">
                <div className={`h-10 ${item.color} rounded-xl w-full flex items-center justify-between px-4 transition-transform group-hover:scale-105 active:scale-95`}>
                   <span className="text-[8px] font-black text-white uppercase tracking-widest">{item.label}</span>
                   <span className="text-sm font-black text-white">{item.count}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Card 4: Source Attribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[300px]">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Lead Sources</h3>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {sources.map(source => {
              const count = sourceCounts[source] || 0;
              const barWidth = (count / maxSourceCount) * 100;
              return (
                <div key={source}>
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-1.5">
                    <span className="text-slate-400">{source}</span>
                    <span className="text-slate-900">{count}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-900 rounded-full transition-all duration-1000" style={{ width: `${barWidth}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Yearly Strategic View (Full Width) */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full -mr-64 -mt-64 blur-[140px] pointer-events-none transition-transform group-hover:scale-110"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em]">Fiscal Period {currentYear}</p>
            <h3 className="text-4xl font-black tracking-tight">Annual Revenue</h3>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-6xl font-black tracking-tighter">{yProgress.toFixed(1)}%</span>
             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Goal Progression</p>
          </div>
        </div>
        
        <div className="mt-12 relative z-10">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            <span>Collected: {formatCurrency(currentYearRevenue)}</span>
            <span>Strategic Target: {formatCurrency(yGoal)}</span>
          </div>
          <div className="h-5 w-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-1">
            <div className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-emerald-400 rounded-xl transition-all duration-[2000ms] ease-out shadow-[0_0_30px_rgba(37,99,235,0.3)]" style={{ width: `${yProgress}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualAnalytics;
