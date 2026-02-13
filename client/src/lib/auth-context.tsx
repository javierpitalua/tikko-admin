import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Admin } from "@shared/schema";
import { getAuth, setAuth as storeAuth, clearAuth, getAdmins, saveAdmin, generateId } from "./store";

interface AuthState {
  admin: Admin | null;
  verified: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (name: string, email: string, password: string) => { success: boolean; error?: string };
  verifyToken: (token: string) => boolean;
  logout: () => void;
  pendingToken: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = getAuth();
  const [state, setState] = useState<AuthState>({
    admin: stored?.admin || null,
    verified: stored?.verified || false,
    isAuthenticated: !!stored?.admin && !!stored?.verified,
  });
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  const login = useCallback((email: string, password: string) => {
    const admins = getAdmins();
    let found = admins.find((a) => a.email === email);
    if (!found) {
      const nameFromEmail = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      found = { id: generateId(), name: nameFromEmail, email, password };
      saveAdmin(found);
    }
    const token = String(Math.floor(100000 + Math.random() * 900000));
    setPendingToken(token);
    setState({ admin: found, verified: false, isAuthenticated: false });
    storeAuth(found, false);
    return { success: true };
  }, []);

  const register = useCallback((name: string, email: string, password: string) => {
    const admins = getAdmins();
    if (admins.find((a) => a.email === email)) {
      return { success: false, error: "El correo ya está registrado" };
    }
    const newAdmin: Admin = { id: generateId(), name, email, password };
    saveAdmin(newAdmin);
    const token = String(Math.floor(100000 + Math.random() * 900000));
    setPendingToken(token);
    setState({ admin: newAdmin, verified: false, isAuthenticated: false });
    storeAuth(newAdmin, false);
    return { success: true };
  }, []);

  const verifyToken = useCallback((token: string) => {
    if (token.length === 6 && state.admin) {
      setState({ admin: state.admin, verified: true, isAuthenticated: true });
      storeAuth(state.admin, true);
      setPendingToken(null);
      return true;
    }
    return false;
  }, [state.admin]);

  const logout = useCallback(() => {
    clearAuth();
    setPendingToken(null);
    setState({ admin: null, verified: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, verifyToken, logout, pendingToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
