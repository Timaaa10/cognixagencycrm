import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  getDoc,
  setDoc,
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocs,
  where,
  runTransaction,
  increment
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from '@firebase/auth';
import { auth, db, firebaseConfig } from '../firebase';
import { 
  Lead, 
  LeadStatus, 
  UserProfile, 
  AgencySettings, 
  Expense, 
  LeadTemperature, 
  LeadSource,
  ExpenseCategory,
  FinancialSnapshot, 
  Transaction, 
  TransactionType, 
  ServiceType 
} from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const LEADS_COLLECTION = 'leads';
const USERS_COLLECTION = 'users';
const SETTINGS_COLLECTION = 'agencySettings';
const TRANSACTIONS_COLLECTION = 'transactions';
const HISTORY_COLLECTION = 'financial_history';

// ----------------------------------------------------
// ELEVATED RESILIENT LOCAL FALLBACK SEED DATA
// ----------------------------------------------------
const DEFAULT_LEADS: Lead[] = [
  {
    id: "lead-1",
    name: "Alexander Romanov",
    email: "alex@acmestudios.io",
    company: "Acme Studios",
    website: "https://acmestudios.io",
    industry: "E-commerce",
    phone: "+7 (999) 123-45-67",
    source: LeadSource.ADS,
    status: LeadStatus.LEAD,
    temperature: LeadTemperature.HOT,
    service: ServiceType.AI_CALLERS,
    assignedTo: "Tim",
    notes: "Acme Studios is looking to automate their customer support line. They currently have 5 support agents handling 200+ calls daily. High interest in custom voice agents with Russian and English support.",
    dealValue: 3500,
    aiScore: 89,
    aiInsight: "Excellent prospect. High call volume justifies the cost of custom voice agents. Lead has active budget and needs immediate deployment.",
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "lead-2",
    name: "Elena Petrova",
    email: "elena@zenithretail.com",
    company: "Zenith Retail",
    website: "https://zenithretail.com",
    industry: "Retail & Apparel",
    phone: "+7 (999) 765-43-21",
    source: LeadSource.WEBSITE,
    status: LeadStatus.DEAL,
    temperature: LeadTemperature.WARM,
    service: ServiceType.ADS_MANAGEMENT,
    assignedTo: "Tim",
    notes: "Zenith Retail wants to launch a scaling campaign for their summer collection. Monthly ad budget is around $15,000. Looking for full-service ad management and creative strategy.",
    dealValue: 2500,
    aiScore: 72,
    aiInsight: "Solid middle-tier deal. High ad budget ensures great potential for commission or management fee growth. Creative direction will be key.",
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "lead-3",
    name: "Dmitry Ivanov",
    email: "dmitry@novahealth.ru",
    company: "Nova Health",
    website: "https://novahealth.ru",
    industry: "Healthcare Tech",
    phone: "+7 (999) 111-22-33",
    source: LeadSource.COLD_OUTREACH,
    status: LeadStatus.CLIENT,
    temperature: LeadTemperature.HOT,
    service: ServiceType.FULL_REVENUE_SYSTEM,
    assignedTo: "Tim",
    notes: "Nova Health is a private clinic network. We integrated our full revenue system including CRM setup, custom AI booking agents, and lead flow pipelines.",
    dealValue: 6000,
    aiScore: 96,
    aiInsight: "Enterprise client with long-term retention potential. System is active and currently showing 35% increase in online appointment bookings.",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    lastPaymentDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    amount: 6000,
    category: "Full Revenue System",
    description: "Contract Won: Nova Health",
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    type: "revenue",
    createdBy: "Tim",
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "tx-2",
    amount: 1200,
    category: "Software",
    description: "VAPI & Retell AI Usage Billing",
    date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    type: "expense",
    createdBy: "Tim",
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "tx-3",
    amount: 850,
    category: "Ads",
    description: "Meta Ads Platform Spent",
    date: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    type: "expense",
    createdBy: "Tim",
    createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString()
  }
];

const DEFAULT_HISTORY: FinancialSnapshot[] = [
  {
    id: "M-2026-05",
    type: "month",
    period: "2026-05",
    revenue: 12500,
    expenses: 3200,
    profit: 9300,
    updatedAt: new Date().toISOString()
  },
  {
    id: "M-2026-06",
    type: "month",
    period: "2026-06",
    revenue: 14200,
    expenses: 4100,
    profit: 10100,
    updatedAt: new Date().toISOString()
  },
  {
    id: `M-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    type: "month",
    period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    revenue: 6000,
    expenses: 2050,
    profit: 3950,
    updatedAt: new Date().toISOString()
  }
];

// Active subscriptions/callbacks
let activeLeadsCallbacks: ((leads: Lead[]) => void)[] = [];
let activeTxCallbacks: ((txs: Transaction[]) => void)[] = [];

// Fallback memory state sync with LocalStorage
let fallbackLeads: Lead[] = JSON.parse(localStorage.getItem('cognix_fallback_leads') || 'null') || DEFAULT_LEADS;
let fallbackTransactions: Transaction[] = JSON.parse(localStorage.getItem('cognix_fallback_txs') || 'null') || DEFAULT_TRANSACTIONS;
let fallbackHistory: FinancialSnapshot[] = JSON.parse(localStorage.getItem('cognix_fallback_history') || 'null') || DEFAULT_HISTORY;
let fallbackSettings: AgencySettings = JSON.parse(localStorage.getItem('cognix_fallback_settings') || 'null') || {
  agencyName: "Cognix Agency",
  currency: "USD",
  monthlyGoal: 15000,
  yearlyGoal: 180000
};

// State flag to track whether fallback mode is active (default depends on previous session or failure)
let useFallback = localStorage.getItem('cognix_use_fallback') === 'true';

const saveFallbackData = () => {
  localStorage.setItem('cognix_fallback_leads', JSON.stringify(fallbackLeads));
  localStorage.setItem('cognix_fallback_txs', JSON.stringify(fallbackTransactions));
  localStorage.setItem('cognix_fallback_history', JSON.stringify(fallbackHistory));
  localStorage.setItem('cognix_fallback_settings', JSON.stringify(fallbackSettings));
  
  // Trigger callback pipelines
  activeLeadsCallbacks.forEach(cb => cb([...fallbackLeads]));
  activeTxCallbacks.forEach(cb => cb([...fallbackTransactions]));
};

// ----------------------------------------------------
// INTEGRATED ROBUST CRM SERVICE
// ----------------------------------------------------
export const crmService = {
  subscribeToLeads: (callback: (leads: Lead[]) => void) => {
    activeLeadsCallbacks.push(callback);
    
    if (useFallback) {
      setTimeout(() => callback([...fallbackLeads]), 0);
      return () => {
        activeLeadsCallbacks = activeLeadsCallbacks.filter(cb => cb !== callback);
      };
    }

    const q = query(collection(db, LEADS_COLLECTION), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const leads = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
        };
      }) as Lead[];
      callback(leads);
    }, (error) => {
      console.warn("Firestore subscription failed. Activating local CRM fallback layer.", error);
      useFallback = true;
      localStorage.setItem('cognix_use_fallback', 'true');
      callback([...fallbackLeads]);
    });

    return () => {
      unsub();
      activeLeadsCallbacks = activeLeadsCallbacks.filter(cb => cb !== callback);
    };
  },

  subscribeToTransactions: (callback: (transactions: Transaction[]) => void) => {
    activeTxCallbacks.push(callback);
    
    if (useFallback) {
      setTimeout(() => callback([...fallbackTransactions]), 0);
      return () => {
        activeTxCallbacks = activeTxCallbacks.filter(cb => cb !== callback);
      };
    }

    const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : data.date
        };
      }) as Transaction[];
      callback(txs);
    }, (error) => {
      console.warn("Firestore transactions subscription failed. Activating local CRM fallback layer.", error);
      useFallback = true;
      localStorage.setItem('cognix_use_fallback', 'true');
      callback([...fallbackTransactions]);
    });

    return () => {
      unsub();
      activeTxCallbacks = activeTxCallbacks.filter(cb => cb !== callback);
    };
  },

  getFinancialSnapshots: async (): Promise<FinancialSnapshot[]> => {
    if (useFallback) {
      return fallbackHistory;
    }
    try {
      const q = query(collection(db, HISTORY_COLLECTION), orderBy('period', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialSnapshot));
    } catch (error) {
      console.warn("Firestore financial snapshot fetch failed. Reverting to local fallback.", error);
      useFallback = true;
      localStorage.setItem('cognix_use_fallback', 'true');
      return fallbackHistory;
    }
  },

  addTransaction: async (data: Omit<Transaction, 'id' | 'createdBy' | 'createdAt' | 'period'>) => {
    const date = data.date instanceof Date ? data.date : new Date(data.date);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const year = `${date.getFullYear()}`;

    if (useFallback) {
      const newTx: Transaction = {
        ...data,
        id: `tx-${Date.now()}`,
        date: date.toISOString(),
        period,
        createdBy: auth.currentUser?.uid || 'fallback-user',
        createdAt: new Date().toISOString()
      };
      
      fallbackTransactions = [newTx, ...fallbackTransactions];
      
      // Mutate historical totals in fallback state
      const isRev = data.type === 'revenue';
      const diff = data.amount;

      // Month Aggregation
      let monthItem = fallbackHistory.find(h => h.id === `M-${period}`);
      if (!monthItem) {
        monthItem = { id: `M-${period}`, type: 'month', period, revenue: 0, expenses: 0, profit: 0, updatedAt: new Date().toISOString() };
        fallbackHistory.push(monthItem);
      }
      if (isRev) {
        monthItem.revenue += diff;
      } else {
        monthItem.expenses += diff;
      }
      monthItem.profit = monthItem.revenue - monthItem.expenses;
      monthItem.updatedAt = new Date().toISOString();

      // Year Aggregation
      let yearItem = fallbackHistory.find(h => h.id === `Y-${year}`);
      if (!yearItem) {
        yearItem = { id: `Y-${year}`, type: 'year', period: year, revenue: 0, expenses: 0, profit: 0, updatedAt: new Date().toISOString() };
        fallbackHistory.push(yearItem);
      }
      if (isRev) {
        yearItem.revenue += diff;
      } else {
        yearItem.expenses += diff;
      }
      yearItem.profit = yearItem.revenue - yearItem.expenses;
      yearItem.updatedAt = new Date().toISOString();

      saveFallbackData();
      return { id: newTx.id };
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Authentication required");

      const txPayload = {
        ...data,
        date,
        period,
        createdBy: user.uid,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), txPayload);
      await crmService.updateAggregateOnMutation(period, year, data.type, data.amount, 'add');
      return docRef;
    } catch (error) {
      console.warn("Firestore write failed. Falling back to Local Storage flow.", error);
      useFallback = true;
      localStorage.setItem('cognix_use_fallback', 'true');
      return crmService.addTransaction(data);
    }
  },

  deleteTransaction: async (id: string) => {
    if (useFallback) {
      const txIndex = fallbackTransactions.findIndex(t => t.id === id);
      if (txIndex === -1) return;

      const data = fallbackTransactions[txIndex];
      const amount = data.amount;
      const type = data.type;
      const date = new Date(data.date);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const year = `${date.getFullYear()}`;

      const diff = -amount;
      const isRev = type === 'revenue';

      // Month Aggregate Reverse
      const monthItem = fallbackHistory.find(h => h.id === `M-${period}`);
      if (monthItem) {
        if (isRev) monthItem.revenue += diff;
        else monthItem.expenses += diff;
        monthItem.profit = monthItem.revenue - monthItem.expenses;
        monthItem.updatedAt = new Date().toISOString();
      }

      // Year Aggregate Reverse
      const yearItem = fallbackHistory.find(h => h.id === `Y-${year}`);
      if (yearItem) {
        if (isRev) yearItem.revenue += diff;
        else yearItem.expenses += diff;
        yearItem.profit = yearItem.revenue - yearItem.expenses;
        yearItem.updatedAt = new Date().toISOString();
      }

      fallbackTransactions = fallbackTransactions.filter(t => t.id !== id);
      saveFallbackData();
      return;
    }

    try {
      const txRef = doc(db, TRANSACTIONS_COLLECTION, id);
      const snap = await getDoc(txRef);
      if (!snap.exists()) return;

      const data = snap.data() as Transaction;
      const amount = data.amount;
      const type = data.type;
      const date = data.date.toDate ? data.date.toDate() : new Date(data.date);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const year = `${date.getFullYear()}`;

      const incrementValues = type === 'revenue' 
        ? { revenue: increment(-amount), profit: increment(-amount) }
        : { expenses: increment(-amount), profit: increment(amount) };

      const monthHistRef = doc(db, HISTORY_COLLECTION, `M-${period}`);
      const yearHistRef = doc(db, HISTORY_COLLECTION, `Y-${year}`);

      await updateDoc(monthHistRef, { ...incrementValues, updatedAt: serverTimestamp() });
      await updateDoc(yearHistRef, { ...incrementValues, updatedAt: serverTimestamp() });
      await deleteDoc(txRef);
    } catch (error) {
      console.warn("Firestore transaction deletion failed, using local fallback.", error);
      useFallback = true;
      localStorage.setItem('cognix_use_fallback', 'true');
      fallbackTransactions = fallbackTransactions.filter(t => t.id !== id);
      saveFallbackData();
    }
  },

  updateAggregateOnMutation: async (period: string, year: string, type: TransactionType, amount: number, action: 'add' | 'subtract') => {
    if (useFallback) return; // Managed directly in fallback methods

    try {
      const diff = action === 'add' ? amount : -amount;
      const updates = [{ id: `M-${period}`, type: 'month', period }, { id: `Y-${year}`, type: 'year', period: year }];

      for (const item of updates) {
        const histRef = doc(db, HISTORY_COLLECTION, item.id);
        await runTransaction(db, async (transaction) => {
          const histDoc = await transaction.get(histRef);
          let current = histDoc.exists() ? histDoc.data() : { revenue: 0, expenses: 0, profit: 0 };
          const newRevenue = type === 'revenue' ? (current.revenue || 0) + (type === 'revenue' ? diff : 0) : (current.revenue || 0);
          const newExpenses = type === 'expense' ? (current.expenses || 0) + (type === 'expense' ? diff : 0) : (current.expenses || 0);
          transaction.set(histRef, { type: item.type, period: item.period, revenue: newRevenue, expenses: newExpenses, profit: newRevenue - newExpenses, updatedAt: serverTimestamp() }, { merge: true });
        });
      }
    } catch (e) {
      console.warn("Aggregation mutation failed:", e);
    }
  },

  addExpense: async (expenseData: Omit<Expense, 'id'>) => {
    return await crmService.addTransaction({
      amount: expenseData.amount,
      category: expenseData.category,
      description: expenseData.description,
      date: expenseData.date || new Date(),
      type: 'expense'
    });
  },

  updateExpense: async (id: string, updates: Partial<Expense>) => {
    if (useFallback) {
      fallbackTransactions = fallbackTransactions.map(t => t.id === id ? {
        ...t,
        ...updates as any,
        updatedAt: new Date().toISOString()
      } : t);
      saveFallbackData();
      return;
    }
    try {
      const txRef = doc(db, TRANSACTIONS_COLLECTION, id);
      await updateDoc(txRef, { ...updates, updatedAt: serverTimestamp() });
    } catch (e) {
      console.warn("Update failed, falling back locally:", e);
      fallbackTransactions = fallbackTransactions.map(t => t.id === id ? {
        ...t,
        ...updates as any,
        updatedAt: new Date().toISOString()
      } : t);
      saveFallbackData();
    }
  },

  addLead: async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (useFallback) {
      const newLead: Lead = {
        ...leadData,
        id: `lead-${Date.now()}`,
        dealValue: Number(leadData.dealValue) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      fallbackLeads = [newLead, ...fallbackLeads];
      saveFallbackData();
      return { id: newLead.id };
    }

    try {
      const now = serverTimestamp();
      return await addDoc(collection(db, LEADS_COLLECTION), { ...leadData, dealValue: Number(leadData.dealValue) || 0, createdAt: now, updatedAt: now });
    } catch (error) {
      console.warn("Firestore addLead failed, reverting to local fallback.", error);
      useFallback = true;
      localStorage.setItem('cognix_use_fallback', 'true');
      return crmService.addLead(leadData);
    }
  },

  updateLead: async (id: string, updates: Partial<Lead>) => {
    if (useFallback) {
      fallbackLeads = fallbackLeads.map(l => l.id === id ? {
        ...l,
        ...updates,
        dealValue: updates.dealValue !== undefined ? Number(updates.dealValue) : l.dealValue,
        updatedAt: new Date().toISOString()
      } : l);
      saveFallbackData();
      return;
    }

    try {
      const leadRef = doc(db, LEADS_COLLECTION, id);
      await updateDoc(leadRef, { ...updates, dealValue: updates.dealValue !== undefined ? Number(updates.dealValue) : undefined, updatedAt: serverTimestamp() });
    } catch (error) {
      console.warn("Firestore updateLead failed, saving locally.", error);
      fallbackLeads = fallbackLeads.map(l => l.id === id ? {
        ...l,
        ...updates,
        dealValue: updates.dealValue !== undefined ? Number(updates.dealValue) : l.dealValue,
        updatedAt: new Date().toISOString()
      } : l);
      saveFallbackData();
    }
  },

  deleteLead: async (id: string) => {
    if (useFallback) {
      fallbackLeads = fallbackLeads.filter(l => l.id !== id);
      saveFallbackData();
      return;
    }

    try {
      await deleteDoc(doc(db, LEADS_COLLECTION, id));
    } catch (error) {
      console.warn("Firestore deleteLead failed. Saving locally.", error);
      fallbackLeads = fallbackLeads.filter(l => l.id !== id);
      saveFallbackData();
    }
  },

  updateLeadStatus: async (id: string, newStatus: LeadStatus) => {
    if (useFallback) {
      const lead = fallbackLeads.find(l => l.id === id);
      if (!lead) return;

      const isSubscription = [ServiceType.FULL_REVENUE_SYSTEM, ServiceType.ADS_MANAGEMENT, ServiceType.AI_CALLERS].includes(lead.service);
      const wasClient = lead.status === LeadStatus.CLIENT;
      const isClient = newStatus === LeadStatus.CLIENT;

      fallbackLeads = fallbackLeads.map(l => l.id === id ? {
        ...l,
        status: newStatus,
        lastPaymentDate: (isClient && !wasClient && !isSubscription) ? new Date().toISOString() : l.lastPaymentDate,
        updatedAt: new Date().toISOString()
      } : l);
      saveFallbackData();

      if (isClient && !wasClient) {
        await crmService.addTransaction({
          amount: lead.dealValue,
          category: lead.service,
          description: `Contract Won: ${lead.company}`,
          date: new Date(),
          type: 'revenue'
        });
      }
      return;
    }

    try {
      const leadRef = doc(db, LEADS_COLLECTION, id);
      const snap = await getDoc(leadRef);
      if (!snap.exists()) return;

      const lead = snap.data() as Lead;
      const isSubscription = [ServiceType.FULL_REVENUE_SYSTEM, ServiceType.ADS_MANAGEMENT, ServiceType.AI_CALLERS].includes(lead.service);
      const updates: any = { status: newStatus, updatedAt: serverTimestamp() };
      
      if (newStatus === LeadStatus.CLIENT && lead.status !== LeadStatus.CLIENT && !isSubscription) {
        updates.lastPaymentDate = serverTimestamp();
      }
      
      await updateDoc(leadRef, updates);
      
      if (newStatus === LeadStatus.CLIENT && lead.status !== LeadStatus.CLIENT) {
        await crmService.addTransaction({ amount: lead.dealValue, category: lead.service, description: `Contract Won: ${lead.company}`, date: new Date(), type: 'revenue' });
      }
    } catch (error) {
      console.warn("Firestore updateLeadStatus failed, using local CRM flow.", error);
      useFallback = true;
      localStorage.setItem('cognix_use_fallback', 'true');
      await crmService.updateLeadStatus(id, newStatus);
    }
  },

  confirmSubscriptionPayment: async (leadId: string, amount: number, clientName: string, serviceName: string) => {
    const now = new Date();
    if (useFallback) {
      fallbackLeads = fallbackLeads.map(l => l.id === leadId ? {
        ...l,
        lastPaymentDate: now.toISOString(),
        updatedAt: now.toISOString()
      } : l);
      saveFallbackData();
      await crmService.addTransaction({
        amount,
        category: serviceName,
        description: `Subscription: ${clientName} (${now.toLocaleString('en-US', { month: 'long' })})`,
        date: now,
        type: 'revenue'
      });
      return;
    }

    try {
      await updateDoc(doc(db, LEADS_COLLECTION, leadId), { lastPaymentDate: serverTimestamp(), updatedAt: serverTimestamp() });
      await crmService.addTransaction({ amount, category: serviceName, description: `Subscription: ${clientName} (${now.toLocaleString('en-US', { month: 'long' })})`, date: now, type: 'revenue' });
    } catch (error) {
      console.warn("Firestore confirmSubscriptionPayment failed, falling back to local flow.", error);
      useFallback = true;
      localStorage.setItem('cognix_use_fallback', 'true');
      await crmService.confirmSubscriptionPayment(leadId, amount, clientName, serviceName);
    }
  },

  revokeSubscriptionPayment: async (leadId: string, clientName: string) => {
    const now = new Date();
    if (useFallback) {
      fallbackLeads = fallbackLeads.map(l => l.id === leadId ? {
        ...l,
        lastPaymentDate: null,
        updatedAt: now.toISOString()
      } : l);
      const desc = `Subscription: ${clientName} (${now.toLocaleString('en-US', { month: 'long' })})`;
      fallbackTransactions = fallbackTransactions.filter(t => t.description !== desc);
      saveFallbackData();
      return;
    }

    try {
      await updateDoc(doc(db, LEADS_COLLECTION, leadId), { lastPaymentDate: null, updatedAt: serverTimestamp() });
      const q = query(collection(db, TRANSACTIONS_COLLECTION), where('description', '==', `Subscription: ${clientName} (${now.toLocaleString('en-US', { month: 'long' })})`), where('type', '==', 'revenue'));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(doc => crmService.deleteTransaction(doc.id)));
    } catch (error) {
      console.warn("Firestore revokeSubscriptionPayment failed, reverting to local flow.", error);
      useFallback = true;
      localStorage.setItem('cognix_use_fallback', 'true');
      await crmService.revokeSubscriptionPayment(leadId, clientName);
    }
  },

  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
    } catch (e) {
      console.warn("Firestore profile fetch failed, checking local memories:", e);
    }

    // LocalStorage user cache fallback
    const localUsers = JSON.parse(localStorage.getItem('cognix_local_users') || '[]');
    const localMatch = localUsers.find((u: any) => u.uid === uid);
    if (localMatch) return localMatch;

    // Default admin fallback for designated administrator account
    const currentUser = auth.currentUser;
    if (currentUser && (currentUser.email === 'cognix@cognix.ai' || currentUser.uid === uid)) {
      return {
        uid: currentUser.uid,
        email: currentUser.email || 'cognix@cognix.ai',
        name: 'Tim',
        role: 'Admin',
        position: 'Agency Owner'
      };
    }
    return null;
  },

  saveUserProfile: async (profile: UserProfile) => {
    if (useFallback) {
      const localUsers = JSON.parse(localStorage.getItem('cognix_local_users') || '[]');
      const filtered = localUsers.filter((u: any) => u.uid !== profile.uid);
      filtered.push(profile);
      localStorage.setItem('cognix_local_users', JSON.stringify(filtered));
      return;
    }
    try {
      await setDoc(doc(db, USERS_COLLECTION, profile.uid), profile, { merge: true });
    } catch (e) {
      console.warn("Profile save failed, writing to local memory cache:", e);
      const localUsers = JSON.parse(localStorage.getItem('cognix_local_users') || '[]');
      const filtered = localUsers.filter((u: any) => u.uid !== profile.uid);
      filtered.push(profile);
      localStorage.setItem('cognix_local_users', JSON.stringify(filtered));
    }
  },

  getAgencySettings: async (): Promise<AgencySettings | null> => {
    if (useFallback) {
      return fallbackSettings;
    }
    try {
      const settingsDoc = await getDoc(doc(db, SETTINGS_COLLECTION, 'global'));
      return settingsDoc.exists() ? (settingsDoc.data() as AgencySettings) : null;
    } catch (error) {
      console.warn("Firestore getAgencySettings failed, using fallback.", error);
      useFallback = true;
      localStorage.setItem('cognix_use_fallback', 'true');
      return fallbackSettings;
    }
  },

  saveAgencySettings: async (settings: AgencySettings) => {
    if (useFallback) {
      fallbackSettings = settings;
      saveFallbackData();
      return;
    }
    try {
      await setDoc(doc(db, SETTINGS_COLLECTION, 'global'), settings, { merge: true });
    } catch (error) {
      console.warn("Firestore saveAgencySettings failed, writing locally.", error);
      fallbackSettings = settings;
      saveFallbackData();
    }
  },

  createEmployeeAccount: async (data: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Authentication failure.");
    
    const profile = await crmService.getUserProfile(currentUser.uid);
    if (profile?.role !== 'Admin') throw new Error("Unauthorized access: Admins only.");

    const appName = `temp-admin-creation-${Date.now()}`;
    let secondaryApp;

    try {
      secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userRecord = await createUserWithEmailAndPassword(
        secondaryAuth, 
        data.email, 
        data.password
      );
      
      const employeeProfile = {
        uid: userRecord.user.uid,
        email: data.email,
        name: data.name,
        position: data.position,
        role: data.role,
        createdAt: new Date().toISOString()
      };

      if (useFallback) {
        const localUsers = JSON.parse(localStorage.getItem('cognix_local_users') || '[]');
        localUsers.push(employeeProfile);
        localStorage.setItem('cognix_local_users', JSON.stringify(localUsers));
      } else {
        await setDoc(doc(db, USERS_COLLECTION, userRecord.user.uid), {
          ...employeeProfile,
          createdAt: serverTimestamp()
        });
      }
      
      return { success: true, uid: userRecord.user.uid };
    } catch (error: any) {
      console.error("Error during identity initialization:", error);
      throw new Error(error.message || "The neural node was unable to initialize the requested identity.");
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp);
      }
    }
  },

  generateStrategicAdvice: async (leads: Lead[], settings: AgencySettings | null) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stats = {
        leads: leads.filter(l => l.status === LeadStatus.LEAD).length,
        deals: leads.filter(l => l.status === LeadStatus.DEAL).length,
        clients: leads.filter(l => l.status === LeadStatus.CLIENT).length,
        avgScore: leads.length > 0 ? (leads.reduce((s, l) => s + (l.aiScore || 0), 0) / leads.length).toFixed(0) : 0,
        target: settings?.monthlyGoal || 0
      };

      const prompt = `Analyze Cognix Agency pipeline:
      - Pipeline Leads: ${stats.leads}
      - Active Deals: ${stats.deals}
      - Retained Clients: ${stats.clients}
      - Average Lead Quality (AI Score): ${stats.avgScore}%
      - Monthly Goal: $${stats.target}

      Provide 2-3 short, highly aggressive and actionable strategic sentences for the owner. 
      Focus on closing high-score leads or optimizing current deal flow. 
      Professional, futuristic, and direct.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are the Cognix AI Strategic Advisor, an expert in high-growth B2B agencies.",
          temperature: 0.8,
        },
      });

      return response.text;
    } catch (err) {
      console.error("Failed to generate strategic advice:", err);
      return "Strategic analysis offline. Monitor lead quality scores to prioritize outreach efforts.";
    }
  },

  scoreLeadWithAI: async (lead: Lead) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const hasNotes = lead.notes && lead.notes.trim().length > 10;
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Entity Analysis: Company: ${lead.company} Context: ${lead.notes || 'EMPTY'} Stage: ${lead.temperature || 'NOT_SET'}`,
        config: {
          systemInstruction: `Strategic Engine. Return JSON: {score, insight, temperature}.`,
          tools: hasNotes ? [] : [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              insight: { type: Type.STRING },
              temperature: { type: Type.STRING, enum: ['Cold', 'Warm', 'Hot', 'Spam', 'Not Interested'] }
            },
            required: ["score", "insight", "temperature"]
          }
        },
      });
      const result = JSON.parse(response.text.trim());
      
      // Save changes via updateLead which respects fallback mode dynamically
      await crmService.updateLead(lead.id, {
        aiScore: result.score,
        aiInsight: result.insight,
        temperature: lead.temperature || result.temperature
      });
      
      return result;
    } catch (error) {
      console.error("AI Analysis failed:", error);
      throw error;
    }
  }
};
