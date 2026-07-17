
import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, View, LeadTemperature, ServiceType, UserProfile } from '../types';
import { crmService } from '../services/crmService';
import LeadModal from '../components/LeadModal';
import ConfirmationModal from '../components/ConfirmationModal';

interface LeadsProps {
  leads: Lead[];
  viewMode: View;
  profile?: UserProfile | null;
}

type SortOption = 'recent' | 'name-asc' | 'name-desc' | 'revenue' | 'ai-priority';

const Leads: React.FC<LeadsProps> = ({ leads, viewMode, profile }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [contactCardLead, setContactCardLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  // Modal State for Alerts and Confirmations
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const isAdmin = profile?.role === 'Admin';

  const toggleInsight = (id: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedInsights(newExpanded);
  };

  const filteredAndSortedLeads = useMemo(() => {
    let result = leads.filter(l => 
      (l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return result.sort((a, b) => {
      switch (sortBy) {
        case 'recent': {
          const getTime = (val: any) => {
            if (!val) return 0;
            if (val.seconds !== undefined) return val.seconds * 1000;
            if (typeof val.toDate === 'function') return val.toDate().getTime();
            return new Date(val).getTime() || 0;
          };
          return getTime(b.createdAt) - getTime(a.createdAt);
        }
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'revenue':
          return (b.dealValue || 0) - (a.dealValue || 0);
        case 'ai-priority':
          return (b.aiScore || 0) - (a.aiScore || 0);
        default:
          return 0;
      }
    });
  }, [leads, searchTerm, sortBy]);

  const isSubscriptionService = (service: ServiceType) => [
    ServiceType.FULL_REVENUE_SYSTEM,
    ServiceType.ADS_MANAGEMENT,
    ServiceType.AI_CALLERS
  ].includes(service);

  const isClientPaid = (lead: Lead) => {
    if (lead.status !== LeadStatus.CLIENT) return false;
    if (!isSubscriptionService(lead.service)) return true;
    if (!lead.lastPaymentDate) return false;
    const now = new Date();
    const paymentDate = lead.lastPaymentDate.toDate ? lead.lastPaymentDate.toDate() : new Date(lead.lastPaymentDate);
    return paymentDate.getFullYear() === now.getFullYear() && 
           paymentDate.getMonth() === now.getMonth();
  };

  const handleAction = async (data: any) => {
    try {
      if (editingLead) {
        const notesChanged = editingLead.notes !== data.notes;
        const tempChanged = editingLead.temperature !== data.temperature;
        await crmService.updateLead(editingLead.id, data);
        if (notesChanged || tempChanged || !editingLead.aiScore) {
          const updatedLead = { ...editingLead, ...data };
          handleAIAnalyze(updatedLead);
        }
      } else {
        const docRef = await crmService.addLead(data);
        const newLead = { ...data, id: docRef.id } as Lead;
        handleAIAnalyze(newLead);
      }
    } catch (err) {
      console.error("Failed to save lead:", err);
    } finally {
      setIsModalOpen(false);
      setEditingLead(null);
    }
  };

  const handleAIAnalyze = async (lead: Lead) => {
    setProcessingId(lead.id);
    try {
      await crmService.scoreLeadWithAI(lead);
    } catch (err: any) {
      console.error("AI Analysis failed:", err);
      setModalConfig({
        isOpen: true,
        title: "AI Node Offline",
        message: err.message || "Failed to analyze this entity. Please verify that your Gemini API Key is configured inside Settings.",
        isDanger: true
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handlePromote = async (id: string, currentStatus: LeadStatus) => {
    let nextStatus: LeadStatus = currentStatus;
    if (currentStatus === LeadStatus.LEAD) nextStatus = LeadStatus.DEAL;
    else if (currentStatus === LeadStatus.DEAL) nextStatus = LeadStatus.CLIENT;
    
    setProcessingId(id);
    try {
      await crmService.updateLeadStatus(id, nextStatus);
    } catch (err) {
      console.error("Promotion failed:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePaymentConfirmation = (lead: Lead) => {
    setModalConfig({
      isOpen: true,
      title: 'Confirm Monthly Subscription',
      message: `Manually confirm that ${lead.company} has paid their monthly invoice of $${lead.dealValue}? This will log a revenue transaction and update their status to PAID for this month.`,
      onConfirm: async () => {
        setProcessingId(lead.id);
        try {
          await crmService.confirmSubscriptionPayment(
            lead.id, 
            Number(lead.dealValue), 
            lead.company, 
            lead.service
          );
        } catch (err) {
          console.error("Payment confirmation failed", err);
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const handleRevokePayment = (lead: Lead) => {
    setModalConfig({
      isOpen: true,
      title: 'Revoke Payment Status?',
      message: `Are you sure you want to mark ${lead.company} as UNPAID for this month? This will automatically remove the associated revenue transaction from your financials.`,
      isDanger: true,
      onConfirm: async () => {
        setProcessingId(lead.id);
        try {
          await crmService.revokeSubscriptionPayment(lead.id, lead.company);
        } catch (err) {
          console.error("Revoke failed", err);
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const handleDeleteLead = (id: string) => {
    if (!isAdmin) return; // Guard for extra safety
    setModalConfig({
      isOpen: true,
      title: 'Delete Lead?',
      message: 'This will permanently remove the lead from the database. This action cannot be undone.',
      isDanger: true,
      onConfirm: async () => {
        setProcessingId(id);
        try {
          await crmService.deleteLead(id);
        } catch (err) {
          console.error("Deletion failed:", err);
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setModalConfig({
      isOpen: true,
      title: 'Action Successful',
      message: 'Identifier has been successfully recorded to the system clipboard.'
    });
  };

  const formatCreationDate = (timestamp: any) => {
    if (!timestamp) return 'System Entry';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const openContactLink = (label: string, value: string) => {
    const link = getActionLink(label, value);
    if (link) window.open(link, '_blank');
    else setModalConfig({
      isOpen: true,
      title: 'Compatibility Alert',
      message: 'The system cannot automatically initialize this resource type.',
      isDanger: true
    });
  };

  const getActionLink = (label: string, value: string) => {
    const l = label.toLowerCase();
    const v = value.trim();
    if (v.startsWith('http')) return v;
    if (l.includes('email')) return `mailto:${v}`;
    if (l.includes('phone') || l.includes('whatsapp')) {
      const digits = v.replace(/\D/g, '');
      if (l.includes('whatsapp')) return `https://wa.me/${digits}`;
      return `tel:${v}`;
    }
    if (l.includes('telegram')) {
      const handle = v.startsWith('@') ? v.slice(1) : v;
      return `https://t.me/${handle}`;
    }
    if (l.includes('linkedin')) {
      return v.includes('linkedin.com') ? (v.startsWith('http') ? v : `https://${v}`) : `https://linkedin.com/in/${v}`;
    }
    return null;
  };

  const getScoreColors = (score: number) => {
    if (score >= 80) return 'border-emerald-500 text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10';
    if (score >= 50) return 'border-amber-500 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/10';
    return 'border-rose-500 text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-900/10';
  };

  const getTempColors = (temp?: LeadTemperature) => {
    switch (temp) {
      case LeadTemperature.HOT: return 'bg-orange-500 text-white shadow-orange-100 dark:shadow-none';
      case LeadTemperature.WARM: return 'bg-blue-500 text-white shadow-blue-100 dark:shadow-none';
      case LeadTemperature.COLD: return 'bg-slate-400 dark:bg-slate-700 text-white shadow-slate-100 dark:shadow-none';
      case LeadTemperature.SPAM: 
      case LeadTemperature.NOT_INTERESTED: return 'bg-rose-100 dark:bg-rose-900/30 text-rose-500 shadow-transparent';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500';
    }
  };

  const getTitle = () => {
    switch (viewMode) {
      case 'leads': return 'Pipeline Input';
      case 'deals': return 'Active Matrix';
      case 'clients': return 'Partner Ecosystem';
      case 'database': return 'Central Intelligence Database';
      default: return 'Records';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight capitalize">
            {getTitle()}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Analyzing {filteredAndSortedLeads.length} active entities.</p>
        </div>
        <div className="flex items-center gap-3">
          {viewMode === 'leads' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white text-white dark:text-slate-950 px-8 py-3 rounded-2xl font-black transition-all shadow-xl shadow-slate-200 dark:shadow-none flex items-center gap-3 group"
            >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              New Entity
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6 bg-slate-50/20 dark:bg-slate-900/50">
          <div className="relative flex-1 w-full">
            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search internal index..."
              className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] outline-none text-sm text-slate-900 dark:text-slate-100 focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 dark:focus:border-blue-500/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-6 py-3.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all appearance-none pr-10 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 15px center', backgroundSize: '15px' }}
            >
              <option value="recent">Recent</option>
              <option value="ai-priority">AI Score</option>
              <option value="revenue">Revenue</option>
              <option value="name-asc">A-Z</option>
              <option value="name-desc">Z-A</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-10 py-6">Account Identity {viewMode === 'database' && '& Status'}</th>
                <th className="px-10 py-6">Intelligence Matrix</th>
                {viewMode === 'clients' && (
                  <th className="px-10 py-6">Subscription</th>
                )}
                <th className="px-10 py-6">System Entry</th>
                <th className="px-10 py-6 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredAndSortedLeads.length > 0 ? filteredAndSortedLeads.map(lead => (
                <tr key={lead.id} className="group hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-10 py-8 align-top">
                    <div className="flex items-center gap-6">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.25rem] flex items-center justify-center text-slate-900 dark:text-slate-100 font-black text-lg shadow-sm uppercase shrink-0 transition-transform group-hover:scale-105 group-hover:-rotate-3">
                          {lead.name.charAt(0)}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-base truncate">{lead.name}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight truncate">{lead.company}</div>
                          <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest ${
                            lead.status === LeadStatus.CLIENT ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500' : 
                            lead.status === LeadStatus.DEAL ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {lead.status}
                          </span>
                          {lead.temperature && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm ${getTempColors(lead.temperature)}`}>
                              {lead.temperature}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 align-top">
                    <div className="flex flex-col gap-4">
                      {lead.aiScore !== undefined ? (
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-[11px] font-black shrink-0 transition-colors ${getScoreColors(lead.aiScore)}`}>
                            {lead.aiScore}%
                          </div>
                          <div className="flex-1 flex flex-col items-stretch max-w-lg gap-2">
                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${expandedInsights.has(lead.id) ? 'max-h-96 opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
                              <div className="text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-slate-50/80 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-800">
                                {lead.aiInsight}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => toggleInsight(lead.id)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl transition-all group/btn"
                              >
                                <span className="text-[9px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.2em]">
                                  {expandedInsights.has(lead.id) ? 'Hide Insight' : 'Open Full AI Analysis'}
                                </span>
                                <svg className={`w-3 h-3 text-blue-600 dark:text-blue-500 transition-transform duration-300 ${expandedInsights.has(lead.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/>
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleAIAnalyze(lead)}
                                disabled={processingId === lead.id}
                                className="p-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-500 transition-all"
                                title="Refresh Intel"
                              >
                                <svg className={`w-4 h-4 ${processingId === lead.id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleAIAnalyze(lead)}
                          disabled={processingId === lead.id}
                          className="flex items-center gap-3 text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest hover:text-blue-800 dark:hover:text-blue-400 disabled:opacity-50"
                        >
                          <svg className={`w-5 h-5 ${processingId === lead.id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                          Initialize Research
                        </button>
                      )}
                    </div>
                  </td>
                  {viewMode === 'clients' && (
                    <td className="px-10 py-8 align-top">
                       <div className="flex flex-col gap-3">
                         {isClientPaid(lead) ? (
                           isSubscriptionService(lead.service) ? (
                             <button 
                               onClick={() => handleRevokePayment(lead)}
                               disabled={processingId === lead.id}
                               className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none self-start transition-all"
                               title="Click to mark as Unpaid"
                             >
                               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                               Paid
                             </button>
                           ) : (
                             <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none self-start cursor-default">
                               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                               Paid
                             </span>
                           )
                         ) : (
                           <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-500 text-[9px] font-black uppercase tracking-widest self-start">
                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                             Unpaid
                           </span>
                         )}
                         <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                           {lead.dealValue ? `$${lead.dealValue.toLocaleString()}${isSubscriptionService(lead.service) ? '/mo' : ''}` : 'No value set'}
                         </div>
                       </div>
                    </td>
                  )}
                  <td className="px-10 py-8 align-top">
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="text-[13px] font-bold text-slate-900 dark:text-slate-200">{formatCreationDate(lead.createdAt)}</div>
                      <div className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Registration</div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right align-top">
                    <div className="flex flex-col items-end gap-3 min-w-[200px]">
                      <div className="flex items-center justify-end gap-2 w-full">
                        <button 
                          onClick={() => { setEditingLead(lead); setIsModalOpen(true); }} 
                          className="p-3.5 text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        {/* Role-Based Delete Restriction */}
                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteLead(lead.id)}
                            disabled={processingId === lead.id}
                            className="p-3.5 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                            title="Delete Entity"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                        {lead.status !== LeadStatus.CLIENT && (
                          <button
                            disabled={processingId === lead.id}
                            onClick={() => handlePromote(lead.id, lead.status)}
                            className="flex-1 px-8 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-white transition-all shadow-lg shadow-slate-200 dark:shadow-none"
                          >
                            Promote
                          </button>
                        )}
                        {lead.status === LeadStatus.CLIENT && !isClientPaid(lead) && isSubscriptionService(lead.service) && (
                          <button
                            disabled={processingId === lead.id}
                            onClick={() => handlePaymentConfirmation(lead)}
                            className="flex-1 px-4 py-3.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2"
                          >
                            Confirm Pay
                          </button>
                        )}
                      </div>
                      <button 
                        onClick={() => setContactCardLead(lead)}
                        className="w-full px-8 py-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
                      >
                        <svg className="w-4 h-4 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        Contact Card
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={viewMode === 'clients' ? 5 : 4} className="px-10 py-32 text-center text-slate-400 dark:text-slate-600 font-bold tracking-widest uppercase text-[10px]">No records in this matrix.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Card Modal */}
      {contactCardLead && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.6)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10 dark:border-slate-800 relative">
            <div className="p-10 text-center relative">
              <button 
                onClick={() => setContactCardLead(null)}
                className="absolute top-6 right-6 text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-100 p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl mx-auto flex items-center justify-center text-slate-900 dark:text-slate-100 text-3xl font-black mb-6 shadow-sm relative">
                {contactCardLead.name.charAt(0)}
                {contactCardLead.temperature && (
                   <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-2xl ring-4 ring-white dark:ring-slate-900 ${getTempColors(contactCardLead.temperature)}`}>
                     {contactCardLead.temperature}
                   </div>
                )}
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">{contactCardLead.name}</h3>
              <p className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1 mb-8">
                {contactCardLead.company} • {contactCardLead.industry || 'Lead Entity'}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl group/row border border-transparent dark:border-slate-800/50">
                  <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-500 shadow-sm shrink-0 border dark:border-slate-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">{contactCardLead.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => copyToClipboard(contactCardLead.email)}
                      className="p-2.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                      title="Copy"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 00-2 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                    </button>
                    <button 
                      onClick={() => openContactLink('Email', contactCardLead.email)}
                      className="p-2.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                      title="Open Service"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </button>
                  </div>
                </div>

                {contactCardLead.phone && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl group/row border border-transparent dark:border-slate-800/50">
                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-500 shadow-sm shrink-0 border dark:border-slate-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Primary Contact</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">{contactCardLead.phone}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => copyToClipboard(contactCardLead.phone)}
                        className="p-2.5 text-slate-300 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"
                        title="Copy"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 00-2 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                      </button>
                      <button 
                        onClick={() => openContactLink('Phone', contactCardLead.phone)}
                        className="p-2.5 text-slate-300 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"
                        title="Open Service"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      </button>
                    </div>
                  </div>
                )}

                {contactCardLead.contacts?.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl group/row border border-transparent dark:border-slate-800/50">
                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-600 shadow-sm shrink-0 border dark:border-slate-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">{c.label}</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">{c.value}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => copyToClipboard(c.value)}
                        className="p-2.5 text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all"
                        title="Copy"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 00-2 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                      </button>
                      <button 
                        onClick={() => openContactLink(c.label, c.value)}
                        className="p-2.5 text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all"
                        title="Open Service"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Cognix Agency Intelligence Node</p>
            </div>
          </div>
        </div>
      )}

      <LeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAction} initialData={editingLead} />
      
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        isDanger={modalConfig.isDanger}
      />
    </div>
  );
};

export default Leads;