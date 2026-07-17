
import React, { useEffect, useState } from 'react';
import { Lead, LeadStatus, AgencySettings } from '../types';
import { crmService } from '../services/crmService';

interface AnalyticsProps {
  leads: Lead[];
}

const Analytics: React.FC<AnalyticsProps> = ({ leads }) => {
  const [settings, setSettings] = useState<AgencySettings | null>(null);

  useEffect(() => {
    crmService.getAgencySettings().then(setSettings);
  }, []);

  const now = new Date();

  const isPaidThisMonth = (lead: Lead) => {
    if (lead.status !== LeadStatus.CLIENT) return false;
    if (!lead.lastPaymentDate) return false;
    
    const pDate = lead.lastPaymentDate.seconds 
      ? new Date(lead.lastPaymentDate.seconds * 1000) 
      : new Date(lead.lastPaymentDate);
      
    return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
  };

  const totalLeads = leads.filter(l => l.status === LeadStatus.LEAD).length;
  const totalDeals = leads.filter(l => l.status === LeadStatus.DEAL).length;
  const totalClients = leads.filter(l => l.status === LeadStatus.CLIENT).length;
  
  // Lifetime Revenue (Approximate based on active clients deal value - typically implies Pipeline Value in this context)
  const lifetimeRevenue = leads
    .filter(l => l.status === LeadStatus.CLIENT)
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);

  // Monthly Revenue: Strictly verified payments for the current month
  const monthlyRevenue = leads
    .filter(l => isPaidThisMonth(l))
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);

  const totalRecords = leads.length;
  const leadToDealRate = totalRecords > 0 ? (((totalDeals + totalClients) / totalRecords) * 100).toFixed(1) : "0";
  const dealToClientRate = (totalDeals + totalClients) > 0 ? ((totalClients / (totalDeals + totalClients)) * 100).toFixed(1) : "0";

  const goalProgress = settings?.monthlyGoal ? Math.min((monthlyRevenue / settings.monthlyGoal) * 100, 100) : 0;
  
  return (
    <div className="space-y-8 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm col-span-1 md:col-span-2 relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-6 flex-1">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Verified Monthly Revenue</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-slate-900 leading-none">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: settings?.currency || 'USD', maximumFractionDigits: 0 }).format(monthlyRevenue)}
                  </span>
                  <span className="text-emerald-500 text-[10px] font-black bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">PAID ONLY</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Quota Achievement</span>
                  <span className="text-slate-900">{goalProgress.toFixed(0)}%</span>
                </div>
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                  <div className="h-full bg-slate-900 rounded-full transition-all duration-1000" style={{ width: `${goalProgress}%` }}></div>
                </div>
              </div>
            </div>

            <div className="md:w-px md:h-24 bg-slate-100"></div>

            <div className="md:text-right">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Lifetime Ecosystem Value</p>
              <p className="text-3xl font-black text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: settings?.currency || 'USD', maximumFractionDigits: 0 }).format(lifetimeRevenue)}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Cumulative Partner Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Success Metrics</p>
            <h4 className="text-slate-900 font-bold">Conversion Funnel</h4>
          </div>
          <div className="space-y-5 py-4">
            <div>
              <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-tight">
                <span className="text-slate-400">Lead → Deal</span>
                <span className="text-blue-600">{leadToDealRate}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${leadToDealRate}%` }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-tight">
                <span className="text-slate-400">Deal → Client</span>
                <span className="text-emerald-500">{dealToClientRate}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dealToClientRate}%` }}></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
