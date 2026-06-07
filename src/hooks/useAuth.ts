/**
 * useAuth — backward-compatibility shim for the no-auth system.
 * 
 * The new platform has no user accounts. This hook returns a safe
 * null/no-op implementation so that any remaining references to
 * useAuth() don't crash the app.
 */
import { createContext, useContext } from "react";

export interface AuthContextType {
  user: null;
  profile: null;
  isLoading: false;
  setProfile: (_: any) => void;
  login: (_email: string, _password: string) => Promise<void>;
  register: (_data: any) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: false,
  setProfile: () => {},
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function useAuthState(): AuthContextType {
  return {
    user: null,
    profile: null,
    isLoading: false,
    setProfile: () => {},
    login: async () => {},
    register: async () => {},
    logout: async () => {},
  };
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
