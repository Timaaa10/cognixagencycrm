
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, AgencySettings, View } from '../types';
import { crmService } from '../services/crmService';
import StatsCards from '../components/StatsCards';
import Analytics from '../components/Analytics';
import VisualAnalytics from '../components/VisualAnalytics';

interface DashboardProps {
  leads: Lead[];
  onNavigate: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ leads, onNavigate }) => {
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  useEffect(() => {
    crmService.getAgencySettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (leads.length > 0) {
      setAdviceLoading(true);
      crmService.generateStrategicAdvice(leads, settings)
        .then(res => setAdvice(res))
        .finally(() => setAdviceLoading(false));
    }
  }, [leads, settings]);

  const highPriorityLeads = leads
    .filter(l => l.aiScore && l.aiScore > 75)
    .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
    .slice(0, 3);

  const avgScore = leads.length > 0 
    ? (leads.reduce((sum, l) => sum + (l.aiScore || 0), 0) / leads.length).toFixed(0)
    : 0;

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligence Dashboard</h1>
          <p className="text-slate-500 text-sm">Real-time analytical layer for Cognix Agency operations.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">AI Core Synced</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <VisualAnalytics leads={leads} settings={settings} onNavigate={onNavigate} />
          <StatsCards leads={leads} onStatClick={onNavigate} />
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col shadow-2xl shadow-blue-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z"/></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">AI Agency Pulse</p>
              <h3 className="font-bold text-lg">Strategic Advisor</h3>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-3">Overall Pipeline Quality</p>
              <div className="flex items-center gap-4">
                <span className="text-4xl font-black text-white">{avgScore}</span>
                <p className="text-xs text-slate-400 leading-tight">Average neural score across all opportunities.</p>
              </div>
            </div>

            <div className="p-5 bg-blue-600/10 rounded-3xl border border-blue-500/20">
              <p className="text-[10px] text-blue-400 uppercase font-black mb-3 tracking-widest">Growth Directives</p>
              {adviceLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-2 bg-white/10 rounded w-full"></div>
                  <div className="h-2 bg-white/10 rounded w-5/6"></div>
                  <div className="h-2 bg-white/10 rounded w-4/6"></div>
                </div>
              ) : (
                <p className="text-xs text-slate-200 leading-relaxed font-medium italic">
                  {advice || "Initialize agency matrix to generate strategic directives."}
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-4">High Probability Leads</p>
              <div className="space-y-3">
                {highPriorityLeads.length > 0 ? highPriorityLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors cursor-pointer group">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{lead.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{lead.company}</p>
                    </div>
                    <span className={`font-black text-xs transition-all ${getScoreTextColor(lead.aiScore || 0)}`}>%{lead.aiScore}</span>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 italic">No AI analyzed leads yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            <button 
              onClick={() => onNavigate('leads')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40"
            >
              Prioritize Pipeline
            </button>
          </div>
        </div>
      </div>

      <Analytics leads={leads} />
    </div>
  );
};

export default Dashboard;
