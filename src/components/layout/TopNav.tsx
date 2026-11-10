import React, { useState } from 'react';
import {
  AlertOctagon,
  Bell,
  HeartHandshake,
  LogOut,
  Moon,
  Pause,
  Play,
  ShieldCheck,
  Sun,
  TrendingDown,
  TrendingUp,
  Type,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTrading } from '../../context/TradingContext';
import { MarketStatus } from '../../types/trading';
import { AuthModal } from '../auth/AuthModal';

export const TopNav: React.FC = () => {
  const {
    market,
    activeSymbol,
    selectTradingSymbol,
    autoStreamEnabled,
    setAutoStreamEnabled,
    simulateMarketMove,
    setMarketStatusOverride,
    activeAccount,
    riskSettings,
    triggerEmergencyKillSwitch,
    resetKillSwitch,
    notifications,
    markAllNotificationsRead,
    theme,
    setTheme,
    textScale,
    setTextScale,
    setActiveSection,
    operatorEmail,
    secondsUntilCheckIn,
    checkInAlertDue,
    remainingDailyAllowanceUsd,
  } = useTrading();
  const { profile, signOut } = useAuth();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const statusColor: Record<MarketStatus, string> = {
    OPEN: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/40',
    'PRE-MARKET': 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40',
    'AFTER-HOURS': 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40',
    CLOSED: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/40',
  };

  const todayNetPnl = activeAccount.realizedPnl + activeAccount.unrealizedPnl;

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2D45] bg-[#111C2E] px-4 py-2.5">
        {/* Left: SPX Live Ticker Strip & Quick Stream Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* SPX / Active Symbol Price & VIX Pill */}
          <div className="flex items-center gap-3 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3.5 py-1.5">
            <div className="flex items-center gap-2">
              <select
                aria-label="Select Active Symbol"
                value={activeSymbol}
                onChange={(e) => selectTradingSymbol(e.target.value)}
                className="rounded-lg bg-[#111C2E] border border-[#26D6A0]/40 px-2 py-0.5 font-mono text-sm font-extrabold text-[#26D6A0] focus:outline-none"
              >
                <option value="SPX">SPX</option>
                <option value="SPY">SPY</option>
                <option value="QQQ">QQQ</option>
                <option value="NVDA">NVDA</option>
                <option value="AAPL">AAPL</option>
                <option value="TSLA">TSLA</option>
                <option value="MSFT">MSFT</option>
                <option value="META">META</option>
                <option value="AMD">AMD</option>
                <option value="AMZN">AMZN</option>
                <option value="IWM">IWM</option>
                <option value="COIN">COIN</option>
              </select>
              <span className="font-mono text-base font-extrabold text-white">
                ${market.spotPrice.toFixed(2)}
              </span>
              <span
                className={`flex items-center font-mono text-xs font-bold ${
                  market.dailyChange >= 0
                    ? 'text-[#22C55E]'
                    : 'text-[#EF4444]'
                }`}
              >
                {market.dailyChange >= 0 ? (
                  <TrendingUp className="mr-1 h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="mr-1 h-3.5 w-3.5" />
                )}
                {market.dailyChange >= 0 ? '+' : ''}
                {market.dailyChange.toFixed(2)} ({market.dailyChangePct.toFixed(2)}%)
              </span>
              <span className="rounded bg-[#22C55E]/15 px-1.5 py-0.5 font-mono text-[9px] font-extrabold text-[#22C55E]">
                LIVE FEED
              </span>
            </div>

            <div className="h-5 w-px bg-[#1E2D45]" />

            <div className="hidden sm:flex items-center gap-3 text-xs">
              <div>
                <span className="text-[#9BAFC4] mr-1">VIX:</span>
                <span className="font-mono font-bold text-white">
                  {market.vix.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[#9BAFC4] mr-1">ATM:</span>
                <span className="font-mono font-bold text-[#26D6A0]">
                  {market.atmStrike}
                </span>
              </div>
            </div>
          </div>

          {/* Market Status Selector + Stream Toggle */}
          <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5">
            <select
              aria-label="Market Status"
              value={market.marketStatus}
              onChange={(e) =>
                setMarketStatusOverride(e.target.value as MarketStatus)
              }
              className={`rounded-lg border px-2 py-0.5 font-mono text-[11px] font-bold focus:outline-none ${
                statusColor[market.marketStatus]
              }`}
            >
              <option value="OPEN">MARKET OPEN</option>
              <option value="PRE-MARKET">PRE-MARKET</option>
              <option value="AFTER-HOURS">AFTER-HOURS</option>
              <option value="CLOSED">CLOSED</option>
            </select>

            <button
              onClick={() => setAutoStreamEnabled(!autoStreamEnabled)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition ${
                autoStreamEnabled
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'bg-[#111C2E] text-[#26D6A0] border border-[#26D6A0]/40'
              }`}
              title="Toggle Real-Time Simulated SPX Tick Stream"
            >
              {autoStreamEnabled ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              <span>{autoStreamEnabled ? 'LIVE TICK' : 'AUTO TICK'}</span>
            </button>

            <button
              onClick={() => simulateMarketMove(-2.5, 0.2)}
              className="rounded-lg bg-[#EF4444]/15 px-2 py-1 font-mono text-[11px] font-bold text-[#EF4444] hover:bg-[#EF4444]/25 transition"
              title="Simulate SPX Drop"
            >
              -2.5
            </button>
            <button
              onClick={() => simulateMarketMove(2.5, -0.2)}
              className="rounded-lg bg-[#22C55E]/15 px-2 py-1 font-mono text-[11px] font-bold text-[#22C55E] hover:bg-[#22C55E]/25 transition"
              title="Simulate SPX Rally"
            >
              +2.5
            </button>
          </div>
        </div>

        {/* Right: Paper Equity, 10m Discipline Pill, Theme Switcher (Light/Dark), Text Size, Kill Switch, Account */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 10-Min Discipline & Remaining Daily Budget Pill */}
          <button
            onClick={() => setActiveSection('discipline')}
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              checkInAlertDue
                ? 'border-[#F59E0B] bg-[#F59E0B]/20 text-[#F59E0B] animate-pulse'
                : 'border-[#26D6A0]/40 bg-[#0B1220] text-[#26D6A0] hover:border-[#26D6A0]'
            }`}
            title="10-Min Brain Fog & Discipline Coach — Remember Family & Tomorrow"
          >
            <HeartHandshake className="h-4 w-4 shrink-0" />
            <span className="font-mono">
              {Math.floor(secondsUntilCheckIn / 60)}:
              {String(secondsUntilCheckIn % 60).padStart(2, '0')}
            </span>
            <span className="hidden md:inline text-white font-semibold">
              • ${remainingDailyAllowanceUsd.toFixed(0)} Left Today
            </span>
          </button>

          {/* Paper Account Balance & P&L */}
          <button
            onClick={() => setActiveSection('paper-trading')}
            className="hidden lg:flex items-center gap-3 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3.5 py-1.5 text-left hover:border-[#26D6A0]/60 transition"
          >
            <div>
              <span className="text-[11px] font-medium text-[#9BAFC4] mr-1.5">
                Paper BP:
              </span>
              <span className="font-mono text-xs font-extrabold text-white">
                ${activeAccount.buyingPower.toLocaleString()}
              </span>
            </div>
            <div className="h-4 w-px bg-[#1E2D45]" />
            <div>
              <span className="text-[11px] font-medium text-[#9BAFC4] mr-1.5">
                Day P&L:
              </span>
              <span
                className={`font-mono text-xs font-extrabold ${
                  todayNetPnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                }`}
              >
                {todayNetPnl >= 0 ? '+' : ''}${todayNetPnl.toFixed(2)}
              </span>
            </div>
          </button>

          {/* Prominent Light / Dark Theme Segmented Toggle */}
          <div
            className="flex items-center rounded-xl border border-[#1E2D45] bg-[#0B1220] p-1"
            role="group"
            aria-label="Theme Switcher"
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                theme === 'light'
                  ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                  : 'text-[#9BAFC4] hover:text-white'
              }`}
              title="Switch to Crisp Daylight Theme"
            >
              <Sun className="h-3.5 w-3.5" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                theme === 'dark'
                  ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                  : 'text-[#9BAFC4] hover:text-white'
              }`}
              title="Switch to Midnight Dark Theme"
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Dark</span>
            </button>
          </div>

          {/* Readable Text Scale Switcher (Compact / Medium / Large) */}
          <div
            className="hidden xl:flex items-center gap-1 rounded-xl border border-[#1E2D45] bg-[#0B1220] p-1"
            title="Adjust Text Size for Reading Comfort"
          >
            <Type className="ml-1.5 h-3.5 w-3.5 text-[#26D6A0]" />
            {(
              [
                { id: 'compact', label: 'S' },
                { id: 'medium', label: 'M' },
                { id: 'large', label: 'L' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTextScale(opt.id)}
                className={`rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold transition ${
                  textScale === opt.id
                    ? 'bg-[#26D6A0] text-[#0B1220]'
                    : 'text-[#9BAFC4] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Emergency Kill Switch Button */}
          {riskSettings.killSwitchActive ? (
            <button
              onClick={resetKillSwitch}
              className="flex items-center gap-1.5 rounded-xl bg-[#EF4444] px-3 py-1.5 text-xs font-bold text-white shadow-md hover:opacity-90 transition"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>RESET KILL</span>
            </button>
          ) : (
            <button
              onClick={triggerEmergencyKillSwitch}
              className="flex items-center gap-1.5 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-1.5 text-xs font-bold text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition"
              title="Emergency Kill Switch — Block New Entries"
            >
              <AlertOctagon className="h-4 w-4" />
              <span className="hidden sm:inline">KILL SWITCH</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#26D6A0] px-1 font-mono text-[10px] font-bold text-[#0B1220]">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-88 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-3.5 shadow-2xl z-50">
                <div className="flex items-center justify-between border-b border-[#1E2D45] pb-2 mb-2.5">
                  <span className="text-xs font-bold text-white">
                    Notification Center
                  </span>
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs font-semibold text-[#26D6A0] hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-xl border p-2.5 text-xs ${
                        n.severity === 'CRITICAL'
                          ? 'border-[#EF4444]/40 bg-[#EF4444]/10'
                          : n.severity === 'SUCCESS'
                            ? 'border-[#22C55E]/30 bg-[#22C55E]/10'
                            : n.severity === 'WARNING'
                              ? 'border-[#F59E0B]/30 bg-[#F59E0B]/10'
                              : 'border-[#1E2D45] bg-[#0B1220]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>{n.title}</span>
                        <span className="font-mono text-[10px] text-[#9BAFC4]">
                          {n.timestamp}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#9BAFC4]">
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account & Sign Out */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="hidden 2xl:flex items-center gap-1.5 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 text-xs font-semibold text-[#9BAFC4] hover:text-white"
            title="Account & Backup"
          >
            <UserCheck className="h-3.5 w-3.5 text-[#26D6A0]" />
            <span className="max-w-28 truncate">
              {profile?.email || operatorEmail}
            </span>
          </button>

          <button
            onClick={() => signOut()}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-2.5 text-xs font-bold text-[#9BAFC4] hover:border-[#EF4444]/50 hover:text-[#EF4444] transition"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};
