"use client";

import { apiRequest, clearStoredToken, getStoredToken, setStoredToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export interface User {
  id: string;
  email: string;
  role: "USER" | "CREATOR";
  createdAt: string;
  updatedAt: string;
}

type AuthSuccessResponse = {
  success: true;
  message: string;
  token: string;
  user: User;
};

type VerifyTokenResponse = {
  success: true;
  message: string;
  user: User;
};

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: "USER" | "CREATOR") => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string, role: "USER" | "CREATOR") => Promise<boolean>;
  verifyToken: (tokenToVerify?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const isAuthenticated = Boolean(user && token);

  const resetAuth = () => {
    setUser(null);
    setToken(null);
    clearStoredToken();
  };

  const verifyToken = async (tokenToVerify?: string): Promise<boolean> => {
    const activeToken = tokenToVerify ?? token;

    if (!activeToken) {
      return false;
    }

    try {
      const response = await apiRequest<VerifyTokenResponse>("/api/auth/verify-token", {
        method: "POST",
        token: activeToken,
        json: {},
      });

      setToken(activeToken);
      setUser(response.user);
      return true;
    } catch (_error) {
      resetAuth();
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getStoredToken();

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      try {
        const response = await apiRequest<VerifyTokenResponse>("/api/auth/verify-token", {
          method: "POST",
          token: storedToken,
          json: {},
        });

        setUser(response.user);
      } catch (_error) {
        setUser(null);
        setToken(null);
        clearStoredToken();
      }

      setIsLoading(false);
    };

    void initializeAuth();
  }, []);

  const login = async (
    email: string,
    password: string,
    role: "USER" | "CREATOR"
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiRequest<AuthSuccessResponse>("/api/auth/sign-in", {
        method: "POST",
        json: { email, password, role },
      });

      setToken(response.token);
      setUser(response.user);
      setStoredToken(response.token);
      toast.success(response.message);
      router.replace("/dashboard");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    role: "USER" | "CREATOR"
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiRequest<AuthSuccessResponse>("/api/auth/sign-up", {
        method: "POST",
        json: { email, password, role },
      });

      setToken(response.token);
      setUser(response.user);
      setStoredToken(response.token);
      toast.success(response.message);
      router.replace("/dashboard");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    resetAuth();
    toast.success("Logged out successfully");
    router.replace("/signin");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
        signup,
        verifyToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
