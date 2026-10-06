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
      <div className="fixed right-4 top-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#222226]/95 p-4 text-sm shadow-2xl shadow-black/40 backdrop-blur-xl">
            {item.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
            ) : (
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-rose-400" />
            )}
            <p className="flex-1 text-white/85">{item.message}</p>
            <button type="button" onClick={() => remove(item.id)} className="text-white/45 transition hover:text-white" aria-label="Fechar notificação">
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
