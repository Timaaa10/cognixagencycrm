
import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, Expense, ExpenseCategory, AgencySettings, FinancialSnapshot, ServiceType } from '../types';
import { crmService } from '../services/crmService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import ConfirmationModal from '../components/ConfirmationModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface FinancialsProps {
  leads: Lead[];
  expenses: Expense[];
}

const Financials: React.FC<FinancialsProps> = ({ leads = [], expenses = [] }) => {
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [history, setHistory] = useState<FinancialSnapshot[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState<ExpenseCategory | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modal State
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

  useEffect(() => {
    crmService.getAgencySettings().then(setSettings);
    crmService.getFinancialSnapshots().then(setHistory);
  }, []);

  useEffect(() => {
    crmService.getFinancialSnapshots().then(setHistory);
  }, [leads, expenses]);

  useEffect(() => {
    if (editingExpense) {
      setExpenseDesc(editingExpense.description);
      setExpenseAmount(editingExpense.amount);
      const dateVal = editingExpense.date?.toDate ? editingExpense.date.toDate() : new Date(editingExpense.date);
      setExpenseDate(dateVal.toISOString().split('T')[0]);
      setIsAddingExpense(editingExpense.category);
    } else if (!isAddingExpense) {
      setExpenseDesc('');
      setExpenseAmount(0);
      setExpenseDate(new Date().toISOString().split('T')[0]);
    }
  }, [editingExpense, isAddingExpense]);

  const now = new Date();
  const nextMonthName = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleString('en-US', { month: 'long' });

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  const getTimestamp = (val: any) => {
    if (!val) return 0;
    if (val.seconds) return val.seconds * 1000;
    if (val instanceof Date) return val.getTime();
    return new Date(val).getTime();
  };

  const isSubscriptionService = (service: ServiceType) => [
    ServiceType.FULL_REVENUE_SYSTEM,
    ServiceType.ADS_MANAGEMENT,
    ServiceType.AI_CALLERS
  ].includes(service);

  const clientLeads = leads.filter(l => l.status === LeadStatus.CLIENT);
  
  const isPaidThisMonth = (lead: Lead) => {
    if (lead.status !== LeadStatus.CLIENT) return false;
    if (!lead.lastPaymentDate) return false;
    
    const pDate = lead.lastPaymentDate.seconds 
      ? new Date(lead.lastPaymentDate.seconds * 1000) 
      : new Date(lead.lastPaymentDate);
      
    return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
  };

  const mrrValue = clientLeads
    .filter(l => isSubscriptionService(l.service))
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);

  // --- REVENUE LOGIC ---
  const monthlyRevenue = clientLeads
    .filter(l => isPaidThisMonth(l))
    .reduce((s, l) => s + (Number(l.dealValue) || 0), 0);

  const monthlyRecurringRevenue = clientLeads
    .filter(l => isPaidThisMonth(l) && isSubscriptionService(l.service))
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);
  
  const monthlyOneTimeRevenue = clientLeads
    .filter(l => isPaidThisMonth(l) && !isSubscriptionService(l.service))
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);

  const yearlyRevenue = clientLeads
    .filter(l => getTimestamp(l.updatedAt) >= startOfYear)
    .reduce((s, l) => s + (Number(l.dealValue) || 0), 0);

  const lifetimeRevenue = clientLeads
    .reduce((s, l) => s + (Number(l.dealValue) || 0), 0);

  // --- EXPENSE LOGIC ---
  const monthlyExpenses = expenses
    .filter(e => getTimestamp(e.date) >= startOfMonth)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const yearlyExpenses = expenses
    .filter(e => getTimestamp(e.date) >= startOfYear)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const lifetimeExpenses = expenses
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // --- PROFIT LOGIC ---
  const monthlyProfit = monthlyRevenue - monthlyExpenses;
  const yearlyProfit = yearlyRevenue - yearlyExpenses;
  const lifetimeProfit = lifetimeRevenue - lifetimeExpenses;

  // --- METRICS ---
  const yearlyMargin = yearlyRevenue > 0 ? (yearlyProfit / yearlyRevenue) * 100 : 0;

  const doughnutData = useMemo(() => ({
    labels: ['Recurring', 'One-Time'],
    datasets: [{
      data: [monthlyRecurringRevenue, monthlyOneTimeRevenue],
      backgroundColor: ['#3b82f6', '#fbbf24'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  }), [monthlyRecurringRevenue, monthlyOneTimeRevenue]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: settings?.currency || 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddingExpense || !expenseDesc.trim() || expenseAmount <= 0) return;
    try {
      const payload = {
        description: expenseDesc.trim(),
        amount: Number(expenseAmount),
        category: isAddingExpense,
        date: new Date(expenseDate)
      };
      if (editingExpense) await crmService.updateExpense(editingExpense.id, payload);
      else await crmService.addExpense(payload);
      setIsAddingExpense(null);
      setEditingExpense(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      title: 'Delete transaction?',
      message: 'This action will permanently purge the record from the financial matrix. This action cannot be undone.',
      isDanger: true,
      onConfirm: async () => {
        try { 
          await crmService.deleteTransaction(id); 
        } catch (err) { 
          console.error(err); 
        }
      }
    });
  };

  const categoryIcons = {
    [ExpenseCategory.ADS]: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z',
    [ExpenseCategory.SOFTWARE]: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    [ExpenseCategory.EMPLOYEES]: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    [ExpenseCategory.OTHERS]: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  };

  const getCategoryTotal = (cat: ExpenseCategory) => 
    expenses
      .filter(e => e.category === cat && getTimestamp(e.date) >= startOfMonth)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Financial Intelligence</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Strategic capital oversight & performance analytics.</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <div className="px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] shadow-sm flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Global Gross Revenue</span>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(lifetimeRevenue)}</span>
           </div>
           <div className="px-5 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-[1.25rem] shadow-xl dark:shadow-none flex flex-col items-end">
              <span className="text-[9px] font-black text-emerald-400 dark:text-emerald-600 uppercase tracking-widest">Lifetime Net Gain</span>
              <span className="text-sm font-black text-white dark:text-slate-950">{formatCurrency(lifetimeProfit)}</span>
           </div>
        </div>
      </div>

      {/* SECTION: MONTHLY (Priority 1) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Monthly Pulse</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-500 transition-all">
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">Monthly Revenue</p>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(monthlyRevenue)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Paid confirm</span>
              <span className="text-[10px] font-black text-blue-600">Active</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-rose-500 transition-all">
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">Monthly Expenses</p>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-500">{formatCurrency(monthlyExpenses)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Burn rate</span>
              <span className="text-[10px] font-black text-rose-500">Live</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-emerald-500 transition-all group">
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">Monthly Profit</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{formatCurrency(monthlyProfit)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Yield</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 dark:bg-slate-100 p-8 rounded-[2.5rem] text-white dark:text-slate-950 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="z-10">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">Forecast MRR</p>
              <p className="text-3xl font-black">{formatCurrency(mrrValue)}</p>
            </div>
            <div className="z-10 mt-4 pt-4 border-t border-white/10 dark:border-slate-950/10">
              <p className="text-[9px] font-bold text-emerald-400 dark:text-emerald-600 uppercase tracking-widest">{nextMonthName} Pipeline</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: ANNUAL (Priority 2) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-700"></div>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Annual performance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:bg-white dark:hover:bg-slate-900 transition-colors">
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Annual Revenue</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(yearlyRevenue)}</p>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-4">Year-to-date total</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:bg-white dark:hover:bg-slate-900 transition-colors">
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Annual Expenses</p>
              <p className="text-2xl font-black text-rose-600/80 dark:text-rose-400/80">{formatCurrency(yearlyExpenses)}</p>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-4">Yearly operational cost</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:bg-white dark:hover:bg-slate-900 transition-colors">
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Annual Profit</p>
              <p className="text-2xl font-black text-emerald-600/80 dark:text-emerald-400/80">{formatCurrency(yearlyProfit)}</p>
            </div>
            <div className="flex items-center gap-2 mt-4">
               <span className="text-[10px] font-black px-2 py-1 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">{yearlyMargin.toFixed(1)}%</span>
               <span className="text-[9px] text-slate-400 font-bold uppercase">Net Margin</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: GLOBAL / LIFETIME */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-slate-100"></div>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Matrix Overview</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-10">
            <div className="flex-1 space-y-8">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest mb-4">Revenue DNA</h3>
                <div className="space-y-6">
                   <div className="flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                         <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Total Revenue</span>
                      </div>
                      <span className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(lifetimeRevenue)}</span>
                   </div>
                   <div className="flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                         <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Total Expenses</span>
                      </div>
                      <span className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(lifetimeExpenses)}</span>
                   </div>
                   <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-slate-400">Net Ecosystem Gain</span>
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-500">{formatCurrency(lifetimeProfit)}</span>
                   </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-48 flex items-center justify-center relative">
               <Doughnut 
                 data={doughnutData} 
                 options={{ 
                   cutout: '70%', 
                   plugins: { legend: { display: false } },
                   maintainAspectRatio: true
                 }} 
               />
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[8px] font-black text-slate-400 uppercase">MONTHLY</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(monthlyRevenue)}</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {Object.values(ExpenseCategory).map(category => (
               <button 
                 key={category}
                 type="button"
                 onClick={() => { setIsAddingExpense(category); setEditingExpense(null); }}
                 className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:shadow-xl transition-all group active:scale-95"
               >
                 <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-900 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={categoryIcons[category]} />
                   </svg>
                 </div>
                 <span className="block text-[10px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest">{category}</span>
               </button>
             ))}
             <div className="col-span-2 bg-slate-900 rounded-[2.5rem] p-8 flex items-center justify-between text-white shadow-2xl">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Capital Burn</p>
                   <p className="text-2xl font-black">{formatCurrency(lifetimeExpenses)}</p>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="space-y-1 text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Ledger</p>
                   <p className="text-sm font-black text-blue-400">{expenses.length} Records</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* LEDGER SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
        <div className="p-10 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Transaction Ledger</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Live Financial Matrix Synchronization</p>
          </div>
          <button 
            onClick={() => setIsAddingExpense(ExpenseCategory.OTHERS)}
            className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105"
          >
            Manual entry
          </button>
        </div>
        <div className="overflow-y-auto max-h-[500px] custom-scrollbar">
          <table className="w-full text-left border-collapse">
             <thead className="bg-slate-50/50 dark:bg-slate-950/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                   <th className="px-10 py-5">Identifier</th>
                   <th className="px-10 py-5 text-center">Class</th>
                   <th className="px-10 py-5">Timeline</th>
                   <th className="px-10 py-5 text-right">Commitment</th>
                   <th className="px-10 py-5 text-right">Ops</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {expenses.length > 0 ? expenses.map(exp => (
                  <tr key={exp.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                     <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={categoryIcons[exp.category]}/></svg>
                           </div>
                           <span className="text-sm font-bold text-slate-900 dark:text-slate-200">{exp.description}</span>
                        </div>
                     </td>
                     <td className="px-10 py-6 text-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">{exp.category}</span>
                     </td>
                     <td className="px-10 py-6 text-sm text-slate-500 font-medium">
                        {new Date(getTimestamp(exp.date)).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                     </td>
                     <td className="px-10 py-6 text-right">
                        <span className="text-sm font-black text-rose-600">-{formatCurrency(Number(exp.amount))}</span>
                     </td>
                     <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => setEditingExpense(exp)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                           <button onClick={(e) => handleDeleteExpense(exp.id, e)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                        </div>
                     </td>
                  </tr>
                )) : (
                  <tr>
                     <td colSpan={5} className="px-10 py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No entries recorded in Ledger</td>
                  </tr>
                )}
             </tbody>
          </table>
        </div>
      </div>

      {(isAddingExpense || editingExpense) && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10 dark:border-slate-800 p-10">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">{editingExpense ? 'Modify Entry' : 'Record Transaction'}</h3>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-8">Asset Class: {isAddingExpense}</p>
            <form onSubmit={handleSaveExpense} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Date</label>
                <input required type="date" className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-slate-900 dark:text-slate-100" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Description</label>
                <input required type="text" className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 outline-none font-medium text-slate-900 dark:text-slate-100" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} placeholder="Memo or Vendor" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Amount</label>
                <input required type="number" step="0.01" className="w-full px-5 py-4 rounded-xl bg-slate-900 dark:bg-slate-950 border dark:border-slate-800 text-white dark:text-blue-500 font-black text-xl outline-none shadow-xl dark:shadow-none" placeholder="0.00" value={expenseAmount || ''} onChange={(e) => setExpenseAmount(Number(e.target.value))} />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => { setIsAddingExpense(null); setEditingExpense(null); }} className="flex-1 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest hover:text-slate-900 dark:hover:text-slate-200 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-white transition-all shadow-xl dark:shadow-none">Commit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        isDanger={modalConfig.isDanger}
        confirmLabel={modalConfig.isDanger ? "Confirm Action" : "Proceed"}
        cancelLabel="Discard"
      />
    </div>
  );
};

export default Financials;