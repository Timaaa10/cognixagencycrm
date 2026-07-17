
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, LeadSource, ContactField, ServiceType, LeadTemperature } from '../types';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  initialData?: Lead | null;
}

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Omit<Lead, 'id' | 'createdAt'>>({
    name: '',
    email: '',
    company: '',
    website: '',
    industry: '',
    phone: '',
    source: LeadSource.WEBSITE,
    status: LeadStatus.LEAD,
    temperature: undefined,
    service: ServiceType.AI_AUDIT,
    assignedTo: '',
    notes: '',
    internalNotes: '',
    dealValue: 0,
    contacts: []
  });

  const [dynamicContacts, setDynamicContacts] = useState<ContactField[]>([
    { label: 'LinkedIn', value: '' },
    { label: 'Telegram', value: '' }
  ]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        company: initialData.company,
        website: initialData.website || '',
        industry: initialData.industry || '',
        phone: initialData.phone,
        source: initialData.source || LeadSource.WEBSITE,
        status: initialData.status,
        temperature: initialData.temperature,
        service: initialData.service || ServiceType.AI_AUDIT,
        assignedTo: initialData.assignedTo,
        notes: initialData.notes || '',
        internalNotes: initialData.internalNotes || '',
        dealValue: initialData.dealValue || 0,
        contacts: initialData.contacts || []
      });
      if (initialData.contacts && initialData.contacts.length > 0) {
        setDynamicContacts(initialData.contacts);
      }
    } else {
      setFormData({
        name: '', email: '', company: '', website: '', industry: '', phone: '',
        source: LeadSource.WEBSITE, status: LeadStatus.LEAD, temperature: undefined, service: ServiceType.AI_AUDIT,
        assignedTo: '', notes: '', internalNotes: '', dealValue: 0, contacts: []
      });
      setDynamicContacts([{ label: 'LinkedIn', value: '' }, { label: 'Telegram', value: '' }]);
    }
  }, [initialData, isOpen]);

  const addField = () => setDynamicContacts([...dynamicContacts, { label: '', value: '' }]);
  const updateField = (index: number, key: 'label' | 'value', val: string) => {
    const updated = [...dynamicContacts];
    updated[index][key] = val;
    setDynamicContacts(updated);
  };
  const removeField = (index: number) => setDynamicContacts(dynamicContacts.filter((_, i) => i !== index));

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalContacts = dynamicContacts.filter(c => c.value.trim() !== '');
    onSubmit({ ...formData, contacts: finalContacts });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.4)] dark:shadow-none w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col relative text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-12 py-8 bg-slate-900 dark:bg-slate-950 text-white flex justify-between items-center shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1">Entity Configurator</p>
            <h2 className="text-2xl font-black">{initialData ? 'Update Matrix Node' : 'Initialize New Account'}</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 dark:hover:bg-slate-900 rounded-2xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Left Column: Profile & Service */}
            <div className="space-y-10">
              <section>
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Core Identity
                </h3>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase ml-1">Contact Name</label>
                      <input required type="text" className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 dark:focus:border-blue-500/50 outline-none transition-all font-medium text-slate-900 dark:text-slate-100" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full Name" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase ml-1">Organization</label>
                      <input required type="text" className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 dark:focus:border-blue-500/50 outline-none transition-all font-medium text-slate-900 dark:text-slate-100" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Company Name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase ml-1">Email</label>
                      <input required type="email" className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 dark:focus:border-blue-500/50 outline-none transition-all text-slate-900 dark:text-slate-100" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@company.com" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase ml-1">Phone</label>
                      <input type="tel" className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 dark:focus:border-blue-500/50 outline-none transition-all text-slate-900 dark:text-slate-100" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1..." />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Temperature Level
                </h3>
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Select manually or let AI decide</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(LeadTemperature).map(t => (
                      <button 
                        key={t} 
                        type="button" 
                        onClick={() => setFormData({ ...formData, temperature: t })} 
                        className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.temperature === t ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-950 shadow-lg dark:shadow-none' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:border-slate-200 dark:hover:border-slate-700'}`}
                      >
                        {t}
                      </button>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, temperature: undefined })} 
                      className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.temperature === undefined ? 'bg-blue-600 border-blue-600 text-white shadow-lg dark:shadow-none' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:border-slate-200 dark:hover:border-slate-700'}`}
                    >
                      AI AUTO
                    </button>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Service Architecture
                </h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest ml-1">Monthly Recurring Subscriptions</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[ServiceType.FULL_REVENUE_SYSTEM, ServiceType.ADS_MANAGEMENT, ServiceType.AI_CALLERS].map(s => (
                        <button key={s} type="button" onClick={() => setFormData({ ...formData, service: s })} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.service === s ? 'bg-blue-600 border-blue-600 text-white shadow-lg dark:shadow-none' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:border-slate-200 dark:hover:border-slate-700'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest ml-1">One-Time Performance Assets</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[ServiceType.AI_AUDIT, ServiceType.CUSTOM_CRM, ServiceType.COMPANY_WEBSITE].map(s => (
                        <button key={s} type="button" onClick={() => setFormData({ ...formData, service: s })} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.service === s ? 'bg-amber-500 border-amber-500 text-white shadow-lg dark:shadow-none' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:border-slate-200 dark:hover:border-slate-700'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase ml-1">Contract Value ($)</label>
                    <input type="number" className="w-full px-5 py-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-white dark:text-blue-500 font-black text-xl outline-none shadow-xl dark:shadow-none border dark:border-slate-800" value={formData.dealValue || ''} onChange={(e) => setFormData({ ...formData, dealValue: Number(e.target.value) })} placeholder="0" />
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Intelligence & Status */}
            <div className="space-y-10">
              <section>
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div> AI Strategy Context
                </h3>
                <textarea className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-purple-500/5 dark:focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-500/50 outline-none transition-all text-sm text-slate-900 dark:text-slate-100 min-h-[120px] resize-none" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Inputs for Lead Scoring & AI Insights..." />
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-700 rounded-full"></div> Private Ops Notes
                </h3>
                <textarea className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm text-slate-900 dark:text-slate-100 min-h-[100px] resize-none" value={formData.internalNotes} onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })} placeholder="Internal team comments (Non-AI)..." />
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-900 dark:bg-slate-100 rounded-full"></div> Matrix Lifecycle
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(LeadStatus).map(status => (
                    <button key={status} type="button" onClick={() => setFormData({ ...formData, status })} className={`py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${formData.status === status ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border-slate-900 dark:border-slate-100 shadow-lg dark:shadow-none' : 'bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>{status}</button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 dark:bg-blue-600 rounded-full"></div> Social Connectors
                </h3>
                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                  {dynamicContacts.map((contact, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input type="text" className="w-24 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-900 dark:text-slate-200" value={contact.label} onChange={(e) => updateField(index, 'label', e.target.value)} placeholder="Platform" />
                      <input type="text" className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[10px] text-slate-900 dark:text-slate-200" value={contact.value} onChange={(e) => updateField(index, 'value', e.target.value)} placeholder="Handle / Link" />
                      <button type="button" onClick={() => removeField(index)} className="p-2 text-slate-300 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                    </div>
                  ))}
                  <button type="button" onClick={addField} className="w-full py-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest hover:border-blue-400 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-500 transition-all">+ Add Connector</button>
                </div>
              </section>
            </div>
          </div>
        </form>

        <div className="px-12 py-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center shrink-0">
          <button type="button" onClick={onClose} className="text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-100 font-black text-[10px] uppercase tracking-widest">Cancel</button>
          <button onClick={handleFormSubmit} className="px-12 py-4 text-white dark:text-slate-950 bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl dark:shadow-none transition-all active:scale-95 flex items-center gap-3">
            {initialData ? 'Sync Changes' : 'Execute Injection'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadModal;