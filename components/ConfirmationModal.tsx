
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void; // Optional: if provided, shows two buttons. If not, acts as an alert.
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.6)] dark:shadow-none w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-10 border border-white/20 dark:border-slate-800 text-center">
        
        {/* Icon based on type */}
        <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 ${isDanger ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500'}`}>
          {isDanger ? (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ) : (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tight">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-10">{message}</p>

        <div className="flex flex-col sm:flex-row gap-3">
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-4 px-6 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-[1.5] py-4 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all active:scale-95 ${isDanger ? 'bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-200 dark:shadow-none' : 'bg-slate-900 dark:bg-slate-100 dark:text-slate-950 hover:bg-black dark:hover:bg-white shadow-xl shadow-slate-200 dark:shadow-none'}`}
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-4 px-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-white transition-all shadow-xl shadow-slate-200 dark:shadow-none"
            >
              Acknowledge
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;