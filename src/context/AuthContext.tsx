import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import {
  clearRuntimeSupabase,
  configureRuntimeSupabase,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';
import { NavigationSection } from '../types/trading';

export interface UserProfileRecord {
  id: string;
  email: string;
  displayName: string;
  tradingMode: 'READ_ONLY' | 'PAPER' | 'LIVE_DISABLED';
  liveTradingAuthorized: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfileRecord | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoSession: boolean;
  supabaseConnected: boolean;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error?: string; message?: string }>;
  signInWithOtpLink: (
    email: string
  ) => Promise<{ error?: string; message?: string }>;
  resetPassword: (
    email: string
  ) => Promise<{ error?: string; message?: string }>;
  enterDemoSession: (email?: string) => void;
  signOut: () => Promise<void>;
  connectSupabaseProject: (url: string, anonKey: string) => Promise<{ error?: string }>;
  disconnectSupabaseProject: () => void;
  canAccessRoute: (route: NavigationSection) => {
    allowed: boolean;
    reason?: string;
  };
}

const DEMO_SESSION_KEY = 'tradepilot_demo_auth_session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoSession, setIsDemoSession] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] =
    useState<boolean>(isSupabaseConfigured);

  const loadDatabaseProfile = async (authUser: User) => {
    if (!supabase) return;
    const { data } = await supabase
      .from('profiles')
      .select(
        'id, email, display_name, trading_mode, live_trading_authorized'
      )
      .eq('id', authUser.id)
      .maybeSingle();

    if (data) {
      setProfile({
        id: data.id,
        email: data.email,
        displayName: data.display_name || authUser.email?.split('@')[0] || 'Trader',
        tradingMode: data.trading_mode || 'PAPER',
        liveTradingAuthorized: Boolean(data.live_trading_authorized),
      });
    } else {
      setProfile({
        id: authUser.id,
        email: authUser.email || 'trader@tradepilot.local',
        displayName: authUser.email?.split('@')[0] || 'Trader',
        tradingMode: 'PAPER',
        liveTradingAuthorized: false,
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (supabase && isSupabaseConfigured) {
        // Verify user token directly with Supabase Auth server (best practice over getSession alone)
        const {
          data: { user: verifiedUser },
        } = await supabase.auth.getUser();
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession();

        if (mounted) {
          if (verifiedUser && activeSession) {
            setUser(verifiedUser);
            setSession(activeSession);
            setIsDemoSession(false);
            await loadDatabaseProfile(verifiedUser);
          }
          setIsLoading(false);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (!mounted) return;
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user) {
            setIsDemoSession(false);
            await loadDatabaseProfile(newSession.user);
          } else {
            setProfile(null);
          }
        });

        return () => subscription.unsubscribe();
      } else {
        // Check if user has an active local demo session; default to true on first boot so app is immediately testable, or false after explicit Sign Out
        const savedDemo = localStorage.getItem(DEMO_SESSION_KEY);
        if (savedDemo !== 'SIGNED_OUT') {
          const email = savedDemo || 'trader@tradepilot.local';
          setIsDemoSession(true);
          setProfile({
            id: 'demo-operator-uuid',
            email,
            displayName: email.split('@')[0],
            tradingMode: 'PAPER',
            liveTradingAuthorized: false,
          });
        }
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();
    return () => {
      mounted = false;
    };
  }, [supabaseConnected]);

  const signInWithEmail = async (email: string, password: string) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error && data.user) {
        setUser(data.user);
        setSession(data.session);
        setIsDemoSession(false);
        await loadDatabaseProfile(data.user);
        return {};
      }
      // Built-in admin password fallback ('mylife')
      if (password === 'mylife') {
        enterDemoSession(email || 'loginlife83@gmail.com');
        return {};
      }
      if (error) return { error: error.message };
    }
    if (password === 'mylife') {
      enterDemoSession(email || 'loginlife83@gmail.com');
      return {};
    }
    return {
      error:
        'Invalid credentials. Use your Supabase account or admin password.',
    };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      return {
        error:
          'Supabase URL & Publishable/Anon Key are not configured yet. Connect your Supabase project below first.',
      };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) return { error: error.message };
    if (data.user && data.session) {
      setUser(data.user);
      setSession(data.session);
      setIsDemoSession(false);
      await loadDatabaseProfile(data.user);
      return { message: 'Account created and signed in.' };
    }
    return {
      message:
        'Sign-up successful! Check your email inbox to confirm your account.',
    };
  };

  const signInWithOtpLink = async (email: string) => {
    if (!supabase) {
      return {
        error: 'Connect your Supabase Project URL and Anon Key first.',
      };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };
    return {
      message: `Magic link sent to ${email}. Click the link in your email to authenticate.`,
    };
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return {
        error: 'Connect your Supabase Project URL and Anon Key first.',
      };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) return { error: error.message };
    return {
      message: `Password recovery link sent to ${email}.`,
    };
  };

  const enterDemoSession = (email = 'trader@tradepilot.local') => {
    localStorage.setItem(DEMO_SESSION_KEY, email);
    setIsDemoSession(true);
    setProfile({
      id: 'demo-operator-uuid',
      email,
      displayName: email.split('@')[0],
      tradingMode: 'PAPER',
      liveTradingAuthorized: false,
    });
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.setItem(DEMO_SESSION_KEY, 'SIGNED_OUT');
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsDemoSession(false);
  };

  const connectSupabaseProject = async (url: string, anonKey: string) => {
    try {
      const client = configureRuntimeSupabase(url, anonKey);
      const { error } = await client.auth.getSession();
      if (error) {
        return { error: error.message };
      }
      setSupabaseConnected(true);
      return {};
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : 'Failed to initialize Supabase client',
      };
    }
  };

  const disconnectSupabaseProject = () => {
    clearRuntimeSupabase();
    setSupabaseConnected(false);
    setUser(null);
    setSession(null);
  };

  // Route-level & Role-level Access Control
  const canAccessRoute = (route: NavigationSection) => {
    const isAuthenticated = Boolean(user || isDemoSession);
    if (!isAuthenticated) {
      return {
        allowed: false,
        reason: 'Authentication required to access TradePilot routes.',
      };
    }
    if (route === 'live-trading' && profile?.tradingMode === 'READ_ONLY') {
      return {
        allowed: false,
        reason:
          'Your profile is restricted to READ_ONLY mode. Switch to PAPER mode in Broker Connections to access trading desks.',
      };
    }
    return { allowed: true };
  };

  const isAuthenticated = Boolean(user || isDemoSession);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAuthenticated,
        isDemoSession,
        supabaseConnected,
        signInWithEmail,
        signUpWithEmail,
        signInWithOtpLink,
        resetPassword,
        enterDemoSession,
        signOut,
        connectSupabaseProject,
        disconnectSupabaseProject,
        canAccessRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
