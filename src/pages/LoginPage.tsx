import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  KeyRound,
  Lock,
  Mail,
  Moon,
  Play,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { TradePilotLogo } from '../components/layout/Logo';
import { useAuth } from '../context/AuthContext';
import { useTrading } from '../context/TradingContext';
import {
  activeSupabaseAnonKey,
  activeSupabaseUrl,
} from '../lib/supabase';

export const LoginPage: React.FC = () => {
  const {
    supabaseConnected,
    signInWithEmail,
    signUpWithEmail,
    signInWithOtpLink,
    resetPassword,
    enterDemoSession,
    connectSupabaseProject,
  } = useAuth();
  const { theme, setTheme } = useTrading();

  const [mode, setMode] = useState<'SIGN_IN' | 'SIGN_UP' | 'MAGIC_LINK' | 'RESET'>(
    'SIGN_IN'
  );
  const [email, setEmail] = useState('loginlife83@gmail.com');
  const [password, setPassword] = useState('mylife');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pre-configured with built-in production project (bixjrkdqxurgsjkvgkwq)
  const [showProjectConfig, setShowProjectConfig] = useState(false);
  const [projectUrl, setProjectUrl] = useState(activeSupabaseUrl);
  const [anonKey, setAnonKey] = useState(activeSupabaseAnonKey);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'SIGN_IN') {
        const res = await signInWithEmail(email, password);
        if (res.error) setErrorMsg(res.error);
      } else if (mode === 'SIGN_UP') {
        const res = await signUpWithEmail(email, password);
        if (res.error) setErrorMsg(res.error);
        if (res.message) setSuccessMsg(res.message);
      } else if (mode === 'MAGIC_LINK') {
        const res = await signInWithOtpLink(email);
        if (res.error) setErrorMsg(res.error);
        if (res.message) setSuccessMsg(res.message);
      } else if (mode === 'RESET') {
        const res = await resetPassword(email);
        if (res.error) setErrorMsg(res.error);
        if (res.message) setSuccessMsg(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnectProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!projectUrl.startsWith('https://') || anonKey.length < 20) {
      setErrorMsg(
        'Enter a valid https://<project-ref>.supabase.co URL and publishable/anon key.'
      );
      return;
    }
    const res = await connectSupabaseProject(projectUrl, anonKey);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg('Supabase project credentials updated!');
      setShowProjectConfig(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-[#0B1220] px-4 py-6 text-white">
      {/* Top Bar: Theme Switcher */}
      <div className="mb-4 flex w-full max-w-md items-center justify-between">
        <TradePilotLogo />
        <div className="flex items-center rounded-xl border border-[#1E2D45] bg-[#111C2E] p-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              theme === 'light'
                ? 'bg-[#26D6A0] text-[#0B1220]'
                : 'text-[#9BAFC4] hover:text-white'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              theme === 'dark'
                ? 'bg-[#26D6A0] text-[#0B1220]'
                : 'text-[#9BAFC4] hover:text-white'
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            <span>Dark</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        {/* Auth Card */}
        <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-6 shadow-xl space-y-4">
          {/* Quick Instant Launch Banner */}
          <button
            type="button"
            onClick={() => enterDemoSession(email)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#26D6A0] px-4 py-3 text-sm font-extrabold text-[#0B1220] shadow-md hover:opacity-95 transition"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Launch Command Center (Instant Paper Mode)</span>
          </button>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-[#1E2D45]" />
            <span className="mx-3 shrink text-[11px] font-semibold uppercase tracking-wider text-[#9BAFC4]">
              Or Sign In with Supabase Auth
            </span>
            <div className="flex-grow border-t border-[#1E2D45]" />
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#0B1220] p-1 text-xs font-bold border border-[#1E2D45]">
            <button
              type="button"
              onClick={() => {
                setMode('SIGN_IN');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`rounded-lg py-2 transition ${
                mode === 'SIGN_IN'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'text-[#9BAFC4] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('SIGN_UP');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`rounded-lg py-2 transition ${
                mode === 'SIGN_UP'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'text-[#9BAFC4] hover:text-white'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('MAGIC_LINK');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`rounded-lg py-2 transition ${
                mode === 'MAGIC_LINK'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'text-[#9BAFC4] hover:text-white'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Error / Success Messages */}
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/10 p-3 text-xs text-[#22C55E]">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Main Auth Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#9BAFC4] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#9BAFC4]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] pl-9 pr-3 py-2.5 text-sm text-white focus:border-[#26D6A0] focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {(mode === 'SIGN_IN' || mode === 'SIGN_UP') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#9BAFC4]">
                    Password
                  </label>
                  {mode === 'SIGN_IN' && (
                    <button
                      type="button"
                      onClick={() => setMode('RESET')}
                      className="text-xs font-semibold text-[#26D6A0] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-[#9BAFC4]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] pl-9 pr-3 py-2.5 text-sm text-white focus:border-[#26D6A0] focus:outline-none"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#26D6A0]/50 bg-[#26D6A0]/15 px-4 py-2.5 text-sm font-bold text-[#26D6A0] hover:bg-[#26D6A0] hover:text-[#0B1220] disabled:opacity-50 transition"
            >
              {mode === 'SIGN_IN' && <Lock className="h-4 w-4" />}
              {mode === 'SIGN_UP' && <Sparkles className="h-4 w-4" />}
              {mode === 'MAGIC_LINK' && <Mail className="h-4 w-4" />}
              <span>
                {submitting
                  ? 'Authenticating...'
                  : mode === 'SIGN_IN'
                    ? 'Sign In with Supabase'
                    : mode === 'SIGN_UP'
                      ? 'Create Account ($100k Paper Provisioned)'
                      : mode === 'MAGIC_LINK'
                        ? 'Send Passwordless Magic Link'
                        : 'Send Password Reset Email'}
              </span>
            </button>
          </form>

          {/* Pre-Connected Supabase Project Status Footer */}
          <div className="flex items-center justify-between rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-xs">
            <span className="flex items-center gap-1.5 text-[#9BAFC4]">
              <Database className="h-3.5 w-3.5 text-[#26D6A0]" />
              <span>Supabase DB (`bixjrkdqxurgsjkvgkwq`):</span>
            </span>
            <button
              type="button"
              onClick={() => setShowProjectConfig(!showProjectConfig)}
              className="rounded-md bg-[#22C55E]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#22C55E]"
            >
              {supabaseConnected ? 'CONNECTED ✓' : 'CONFIGURE'}
            </button>
          </div>

          {showProjectConfig && (
            <form
              onSubmit={handleConnectProject}
              className="rounded-xl border border-[#26D6A0]/40 bg-[#0B1220] p-3.5 space-y-2.5 text-xs"
            >
              <div className="font-bold text-[#26D6A0]">
                Built-In Production Project Credentials
              </div>
              <div>
                <label className="block text-[11px] text-[#9BAFC4] mb-1">
                  Supabase URL
                </label>
                <input
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#111C2E] px-2.5 py-1.5 font-mono text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#9BAFC4] mb-1">
                  Public Anon Key
                </label>
                <input
                  type="text"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#111C2E] px-2.5 py-1.5 font-mono text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#26D6A0] py-2 font-bold text-[#0B1220]"
              >
                Save Override
              </button>
            </form>
          )}
        </div>

        {/* Security Assurance Note */}
        <div className="flex items-center justify-center gap-2 text-center text-xs text-[#9BAFC4]">
          <ShieldCheck className="h-4 w-4 text-[#26D6A0]" />
          <span>
            20 Tables Live with RLS • Built-In Supabase Keys • Zero Manual Copy Needed
          </span>
        </div>
      </div>
    </div>
  );
};
