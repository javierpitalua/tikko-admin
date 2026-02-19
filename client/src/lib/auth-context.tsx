import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { AuthService } from "../../api/services/AuthService";
import { UsuariosService } from "../../api/services/UsuariosService";
import { OpenAPI } from "../../api/core/OpenAPI";

interface AdminInfo {
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  admin: AdminInfo | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AUTH_KEY = "tikko_auth";
const TOKEN_KEY = "tikko_token";

function parseJwtPayload(token: string): Record<string, any> {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return {};
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

function extractRoleFromToken(token: string): string {
  const payload = parseJwtPayload(token);
  const role =
    payload["role"] ||
    payload["roles"] ||
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    "";
  if (Array.isArray(role)) return role[0] || "";
  return String(role);
}

function getStoredAuth(): { admin: AdminInfo; token: string } | null {
  try {
    const authRaw = localStorage.getItem(AUTH_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (authRaw && token) {
      const admin = JSON.parse(authRaw) as AdminInfo;
      if (!admin.role && token) {
        admin.role = extractRoleFromToken(token);
      }
      return { admin, token };
    }
  } catch {}
  return null;
}

function storeAuth(admin: AdminInfo, token: string) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(admin));
  localStorage.setItem(TOKEN_KEY, token);
}

function clearStoredAuth() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = getStoredAuth();

  if (stored?.token) {
    OpenAPI.TOKEN = stored.token;
  }

  const [state, setState] = useState<AuthState>({
    admin: stored?.admin || null,
    isAuthenticated: !!stored?.token,
  });

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await AuthService.postApiV1AuthLogin({
        userName: email,
        password: password,
      });

      if (response.isValid && response.token) {
        OpenAPI.TOKEN = response.token;

        const role = extractRoleFromToken(response.token);

        let displayName = "";
        try {
          const usersRes = await UsuariosService.getApiV1UsuariosList();
          const users = usersRes.items || [];
          const me = users.find((u: any) => (u.correoElectronico || "").toLowerCase() === email.toLowerCase());
          if (me?.nombre) {
            displayName = [me.nombre, me.apellidoPaterno].filter(Boolean).join(" ");
          }
        } catch {}

        if (!displayName) {
          const payload = parseJwtPayload(response.token);
          displayName =
            payload["name"] ||
            payload["nombre"] ||
            payload["given_name"] ||
            payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
            "";
        }

        const adminInfo: AdminInfo = {
          email,
          name: displayName || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          role,
        };

        storeAuth(adminInfo, response.token);
        setState({ admin: adminInfo, isAuthenticated: true });
        return { success: true };
      } else {
        return { success: false, error: response.errorMessage || "Credenciales incorrectas" };
      }
    } catch (err: any) {
      return { success: false, error: err?.body?.errorMessage || err?.message || "Error de conexión con el servidor" };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const nameParts = name.trim().split(/\s+/);
      const nombre = nameParts[0] || "";
      const apellidoPaterno = nameParts.slice(1).join(" ") || "";

      await UsuariosService.postApiV1UsuariosCreate({
        correoElectronico: email,
        nombre,
        apellidoPaterno: apellidoPaterno || null,
        apellidoMaterno: null,
        habilitado: true,
        password,
      });

      return { success: true };
    } catch (err: any) {
      const msg = err?.body?.errorMessage || err?.body?.message || err?.message || "Error al crear la cuenta";
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    OpenAPI.TOKEN = undefined;
    clearStoredAuth();
    setState({ admin: null, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
