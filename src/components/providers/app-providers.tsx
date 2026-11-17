"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

type ToastTone = "success" | "error";
type Toast = { id: number; message: string; tone: ToastTone };
type ToastContextValue = { toast: (message: string, tone?: ToastTone) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = Date.now();
      setToasts((current) => [...current, { id, message, tone }]);
      window.setTimeout(() => remove(id), 4500);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+12px)] z-[120] mx-auto flex w-auto max-w-[380px] flex-col gap-3 sm:inset-x-auto sm:left-4 sm:mx-0 sm:w-[360px]" aria-live="polite" aria-atomic="true">
        {toasts.map((item) => (
          <div key={item.id} role={item.tone === "error" ? "alert" : "status"} className="toast-enter pointer-events-auto flex min-w-0 items-start gap-3 rounded-2xl border border-white/10 bg-[#222226]/95 p-3 pl-4 text-sm shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-4">
            {item.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
            ) : (
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-rose-400" />
            )}
            <p className="min-w-0 flex-1 break-words py-1.5 leading-relaxed text-white/85 [overflow-wrap:anywhere]">{item.message}</p>
            <button type="button" onClick={() => remove(item.id)} className="tap-target -m-1 flex shrink-0 items-center justify-center rounded-xl text-white/45 transition-all duration-200 hover:bg-white/[0.06] hover:text-white active:scale-95" aria-label="Fechar notificação">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast deve ser usado dentro de AppProviders");
  return context;
}
