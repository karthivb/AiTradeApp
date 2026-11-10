import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  Lock,
  UserCheck,
  X,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useTrading } from '../../context/TradingContext';

export const AuthModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const {
    operatorEmail,
    setOperatorEmail,
    paperAccounts,
    positions,
    orders,
    journalEntries,
    riskSettings,
  } = useTrading();

  const [emailInput, setEmailInput] = useState(operatorEmail);
  const [passwordInput, setPasswordInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });
      if (error) {
        setStatusMsg(`Supabase Auth: ${error.message}`);
        return;
      }
      setOperatorEmail(emailInput);
      setStatusMsg('Signed in via Supabase Authentication.');
    } else {
      setOperatorEmail(emailInput);
      setStatusMsg(
        'Operator profile updated in Local Demo Session (Supabase env vars not configured).'
      );
    }
  };

  const handleExportBackup = () => {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        operatorEmail,
        paperAccounts,
        positions,
        orders,
        journalEntries,
        riskSettings,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradepilot-state-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E2D45] pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#26D6A0]" />
            <h2 className="text-sm font-bold text-white">
              Operator Authentication & Database Sync
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#9BAFC4] hover:bg-[#0B1220] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-3 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Database className="h-3.5 w-3.5 text-[#26D6A0]" />
              <span>Persistence Engine:</span>
            </span>
            <span className="rounded bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
              {isSupabaseConfigured ? 'SUPABASE POSTGRESQL' : 'LOCAL DEMO DB'}
            </span>
          </div>
          <p className="text-[11px] text-[#9BAFC4]">
            {isSupabaseConfigured
              ? 'Connected to Supabase Auth & RLS tables.'
              : 'Running in free-tier Local Demo mode. Configure VITE_SUPABASE_URL in .env to enable cloud sync.'}
          </p>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[#9BAFC4] mb-1">Operator Email</label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-white"
            />
          </div>

          {isSupabaseConfigured && (
            <div>
              <label className="block text-[#9BAFC4] mb-1">Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-white"
              />
            </div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#26D6A0] py-2 font-bold text-[#0B1220] hover:bg-[#26D6A0]/90"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>
              {isSupabaseConfigured
                ? 'Sign In with Supabase Auth'
                : 'Update Active Operator Session'}
            </span>
          </button>
        </form>

        {statusMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-[#22C55E]/15 p-2.5 text-xs text-[#22C55E]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="border-t border-[#1E2D45] pt-3 flex items-center justify-between">
          <span className="text-[11px] text-[#9BAFC4]">
            Export Paper Accounts, Positions & Journal JSON:
          </span>
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#26D6A0]"
          >
            <Download className="h-3.5 w-3.5 text-[#26D6A0]" />
            <span>Export State JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
