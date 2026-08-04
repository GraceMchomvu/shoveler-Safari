import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, getAuthToken, setAuthToken } from "./api";

export type User = {
  id: string;
  email: string;
  username?: string | null;
  name: string;
  phone?: string | null;
  role: string;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  permissions: string[];
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (login: string, password: string, totp?: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (permission: string) => boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authGen = useRef(0);

  const refresh = useCallback(async () => {
    const gen = authGen.current;
    try {
      const data = await api<{ user: User }>("/api/auth/me");
      if (gen !== authGen.current) return;
      setUser(data.user);
    } catch {
      if (gen !== authGen.current) return;
      // Only wipe session if we truly have no token (avoid race after login)
      if (!getAuthToken()) {
        setUser(null);
      }
    } finally {
      if (gen === authGen.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (loginId: string, password: string, totp?: string) => {
    authGen.current += 1;
    const data = await api<{ user: User; token?: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login: loginId, password, totp }),
    });
    if (data.token) setAuthToken(data.token);
    setUser(data.user);
    setLoading(false);
    // Confirm session works (Bearer and/or cookie)
    try {
      const me = await api<{ user: User }>("/api/auth/me");
      setUser(me.user);
      return me.user;
    } catch {
      if (!data.token) {
        setAuthToken(null);
        setUser(null);
        throw new Error(
          "Signed in, but the session cookie could not be saved. Please try again or contact support."
        );
      }
      return data.user;
    }
  }, []);

  const logout = useCallback(async () => {
    authGen.current += 1;
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refresh,
      can: (p: string) => !!user?.permissions?.includes(p) || user?.role === "SUPER_ADMIN",
    }),
    [user, loading, login, logout, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
