import React, { createContext, ReactNode, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

type AuthContextValue = {
  session: Session;
  username: string;
  isAdmin: boolean;
  adminUsernames: string[];
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ value, children }: { value: AuthContextValue; children: ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
