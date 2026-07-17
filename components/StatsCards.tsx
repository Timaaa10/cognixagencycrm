
import React from 'react';
import { Lead, LeadStatus, View } from '../types';

interface StatsCardsProps {
  leads: Lead[];
  onStatClick?: (view: View) => void;
}

const StatsCards: React.FC<StatsCardsProps> = ({ leads, onStatClick }) => {
  const total = leads.length;
  const leadCount = leads.filter(l => l.status === LeadStatus.LEAD).length;
  const dealCount = leads.filter(l => l.status === LeadStatus.DEAL).length;
  const clientCount = leads.filter(l => l.status === LeadStatus.CLIENT).length;

  const stats = [
    { label: 'Pipeline Leads', value: leadCount, color: 'text-blue-600', bg: 'bg-blue-50', view: 'leads' as View },
    { label: 'Active Deals', value: dealCount, color: 'text-amber-600', bg: 'bg-amber-50', view: 'deals' as View },
    { label: 'Partner Clients', value: clientCount, color: 'text-emerald-600', bg: 'bg-emerald-50', view: 'clients' as View },
    { label: 'Total Database', value: total, color: 'text-slate-900', bg: 'bg-slate-50', view: null },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          onClick={() => stat.view && onStatClick?.(stat.view)}
          className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all ${stat.view ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 active:scale-95' : ''}`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
            {stat.view && (
              <div className="ml-auto opacity-0 group-hover:opacity-100 text-slate-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
