import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastCtx = { toast: (message: string, type?: "ok" | "err") => void };

const Ctx = createContext<ToastCtx>({ toast: () => undefined });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  const toast = useCallback((text: string, type: "ok" | "err" = "ok") => {
    setMsg({ text, type });
    window.setTimeout(() => setMsg(null), 3200);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl px-4 py-3 text-sm shadow-lg ${
            msg.type === "ok"
              ? "bg-[#1a1f1a] text-white"
              : "bg-red-700 text-white"
          }`}
          role="status"
        >
          {msg.text}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
