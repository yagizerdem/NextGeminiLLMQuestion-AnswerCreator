"use client";

import { HttpStatusCode } from "@/lib/utils";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type AuthUser = {
  id: string;
  username: string;
  email: string;
};

type AuthContextState = {
  user: AuthUser | null;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
};

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const guard = useRef<number>(0);

  useEffect(() => {
    async function fetchUser() {
      guard.current += 1;
      const currentGuard = guard.current;

      try {
        const response = await fetch("/api/auth/me");
        if (response.status === HttpStatusCode.UNAUTHORIZED) return null;

        if (response.ok) {
          const data: { user: AuthUser } = await response.json();
          if (currentGuard === guard.current && data.user) {
            setUser((previousUser) => previousUser ?? data.user);
          }
        }
      } catch (error: unknown) {
        if (currentGuard === guard.current)
          console.error("Failed to load current user", error);
      }
    }

    if (guard.current === 0) {
      fetchUser();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
