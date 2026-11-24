'use client';

import { useAcademic } from '@/lib/store';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useAcademic();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-lg shadow-lg border flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-5 duration-200 ${
              isError
                ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                : isWarning
                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                : isSuccess
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                : 'bg-white border-[#E2E8F0] text-[#0F172A]'
            }`}
          >
            {isError && <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />}
            {isWarning && <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />}
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />}
            {!isError && !isWarning && !isSuccess && <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold tracking-tight">{toast.title}</h4>
                {toast.code && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/5 shrink-0">
                    {toast.code}
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90 break-words">{toast.description}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-current opacity-50 hover:opacity-100 transition-opacity p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
