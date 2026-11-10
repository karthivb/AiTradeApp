import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  DollarSign,
  Flame,
  HeartHandshake,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { BrainFogLevel, DisciplineMood } from '../types/trading';

const BRAIN_FOG_OPTIONS: {
  id: BrainFogLevel;
  label: string;
  desc: string;
  danger: boolean;
}[] = [
  {
    id: 'CLEAR',
    label: '🧠 Clear & Sharp',
    desc: 'Calm, focused, reading price action objectively',
    danger: false,
  },
  {
    id: 'MILD_FATIGUE',
    label: '😐 Mild Fatigue',
    desc: 'Slightly tired — cut contract size by 50%',
    danger: false,
  },
  {
    id: 'BRAIN_FOG',
    label: '🌫️ Brain Fog',
    desc: 'Cloudy judgment, staring at ticks — STOP TRADING',
    danger: true,
  },
  {
    id: 'EXHAUSTED',
    label: '😫 Exhausted / Stressed',
    desc: 'Emotionally drained — close terminal & rest',
    danger: true,
  },
];

const MOOD_OPTIONS: {
  id: DisciplineMood;
  label: string;
  desc: string;
  coachMessage: string;
  severity: 'SAFE' | 'CAUTION' | 'DANGER';
}[] = [
  {
    id: 'CALM_DISCIPLINED',
    label: '✅ Calm & Disciplined',
    desc: 'Waiting patiently for A+ setup within risk budget',
    coachMessage:
      'Great state of mind. Stick to 1–2 contracts, respect your stop loss, and take base hits.',
    severity: 'SAFE',
  },
  {
    id: 'PROFIT_CONFIDENT',
    label: '😎 Profit Confident',
    desc: 'Won recent trades — feeling invincible or tempted to size up',
    coachMessage:
      '⚠️ Watch out for post-win euphoria! Traders often give back an entire green day by doubling contract size after a win. Keep your size small and lock in your green day for your family.',
    severity: 'CAUTION',
  },
  {
    id: 'OVER_TRADE',
    label: '⚡ Over-Trading Urge',
    desc: 'Taking too many trades in chop or boredom clicking',
    coachMessage:
      '🛑 Stop clicking! You do not get paid by the hour. Every extra trade in mid-day SPX chop exposes your daily allowance to theta decay.',
    severity: 'DANGER',
  },
  {
    id: 'REVENGE',
    label: '🔥 Revenge Trading Mood',
    desc: 'Angry at a loss — trying to force the market to pay it back now',
    coachMessage:
      '🚨 STOP IMMEDIATELY: Revenge trading is how a small manageable loss turns into a blown account. The market does not know you lost. Step away for 15 minutes right now.',
    severity: 'DANGER',
  },
  {
    id: 'FOMO',
    label: '🏃 FOMO (Chasing Move)',
    desc: 'Entering late after a big candle already moved without you',
    coachMessage:
      '🛑 If you missed the 9:35 AM move, let it go! Chasing extended 0DTE premiums at the top of a spike means buying inflated IV right before a pullback.',
    severity: 'DANGER',
  },
  {
    id: 'CLEAR_ALL_DEBT_ONE_TRADE',
    label: '💣 "Clear All Debt in One Trade"',
    desc: 'Tempted to go all-in or oversize to solve finances in 1 trade',
    coachMessage:
      '🚨 LIFE ANCHOR REMINDER: You CANNOT and DO NOT need to clear all debt in one trade! Putting everything into one 0DTE trade risks your family peace and tomorrow’s capital. Trade small base hits only!',
    severity: 'DANGER',
  },
  {
    id: 'AVERAGING_DOWN_URGE',
    label: '📉 Averaging Down & Waiting Too Long',
    desc: 'Adding to a losing 0DTE option and praying it bounces back',
    coachMessage:
      '🚨 NEVER AVERAGE DOWN A 0DTE LOSER! On 0DTE options, theta + gamma will wipe out doubled-down losers in minutes. Cut the loser small and protect your remaining daily budget.',
    severity: 'DANGER',
  },
  {
    id: 'HOLDING_TOO_LONG',
    label: '⏳ Waiting Too Long / Greed',
    desc: 'Refusing to take +20–30% green profit, waiting for a home run',
    coachMessage:
      '⚠️ Base hits pay the bills! On 0DTE options, a +25% green trade can turn red in two candles. Lock in partial or full profits and protect your green day.',
    severity: 'CAUTION',
  },
];

export const DisciplinePage: React.FC = () => {
  const {
    disciplineLogs,
    addDisciplineCheckIn,
    deleteDisciplineCheckIn,
    checkInIntervalMinutes,
    setCheckInIntervalMinutes,
    secondsUntilCheckIn,
    checkInTimerActive,
    setCheckInTimerActive,
    checkInAlertDue,
    acknowledgeCheckInAlert,
    dailyAllowanceUsd,
    setDailyAllowanceUsd,
    remainingDailyAllowanceUsd,
    riskSettings,
    triggerEmergencyKillSwitch,
    resetKillSwitch,
    activeAccount,
  } = useTrading();

  const [brainFog, setBrainFog] = useState<BrainFogLevel>('CLEAR');
  const [selectedMood, setSelectedMood] =
    useState<DisciplineMood>('CALM_DISCIPLINED');
  const [secondaryMoods, setSecondaryMoods] = useState<DisciplineMood[]>([]);
  const [urgeIntensity, setUrgeIntensity] = useState<number>(3);
  const [actionTaken, setActionTaken] = useState<string>(
    'Followed Plan — Kept Small Size'
  );
  const [familyReminderChecked, setFamilyReminderChecked] =
    useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  const minsLeft = Math.floor(secondsUntilCheckIn / 60);
  const secsLeft = secondsUntilCheckIn % 60;
  const formattedCountdown = `${String(minsLeft).padStart(2, '0')}:${String(
    secsLeft
  ).padStart(2, '0')}`;

  const activeMoodObj =
    MOOD_OPTIONS.find((m) => m.id === selectedMood) || MOOD_OPTIONS[0];
  const activeFogObj =
    BRAIN_FOG_OPTIONS.find((b) => b.id === brainFog) || BRAIN_FOG_OPTIONS[0];

  const isDangerState =
    activeMoodObj.severity === 'DANGER' || activeFogObj.danger;

  const safeMaxRiskPerSingleTrade = Math.max(
    50,
    Math.round(remainingDailyAllowanceUsd / 3)
  );

  const toggleSecondaryMood = (m: DisciplineMood) => {
    setSecondaryMoods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleLogCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    addDisciplineCheckIn({
      brainFog,
      mood: selectedMood,
      secondaryMoods,
      urgeIntensity,
      remainingDailyBudgetUsd: remainingDailyAllowanceUsd,
      actionTaken,
      familyReminderChecked,
      notes:
        notes.trim() ||
        `10m check-in: ${activeMoodObj.label} | Remaining today: $${remainingDailyAllowanceUsd}`,
    });
    setNotes('');
  };

  return (
    <div className="space-y-4">
      {/* 1. ALWAYS-VISIBLE FAMILY, TOMORROW & SURVIVAL REMINDER BANNER */}
      <div className="rounded-2xl border-2 border-[#26D6A0]/50 bg-[#111C2E] p-5 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 max-w-3xl">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#26D6A0]/15 text-[#26D6A0] border border-[#26D6A0]/40">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-extrabold text-white">
                  Trader Discipline, 10-Min Brain-Fog Coach & Family Anchor
                </h1>
                <span className="rounded-md bg-[#26D6A0]/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                  PROTECT YOUR TOMORROW
                </span>
              </div>
              <p className="mt-1 text-xs text-[#9BAFC4] leading-relaxed">
                <strong className="text-white">Read before every trade:</strong>{' '}
                You do <span className="underline font-bold text-[#EF4444]">NOT</span> need to clear all debt in one trade. Do not wait too long on losers, never average down a losing 0DTE option, and never put everything into one trade.{' '}
                <strong className="text-[#26D6A0]">
                  You have your family. You have tomorrow.
                </strong>
              </p>
            </div>
          </div>

          {/* 10-Minute Timer Pill */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#1E2D45] bg-[#0B1220] px-4 py-2.5">
            <Clock className="h-5 w-5 text-[#26D6A0]" />
            <div>
              <span className="block text-[10px] font-bold uppercase text-[#9BAFC4]">
                Next {checkInIntervalMinutes}m Check-In
              </span>
              <span className="font-mono text-xl font-extrabold text-white">
                {formattedCountdown}
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={() => setCheckInTimerActive(!checkInTimerActive)}
                className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-2 text-[#26D6A0] hover:text-white"
                title={checkInTimerActive ? 'Pause Timer' : 'Resume Timer'}
              >
                {checkInTimerActive ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={acknowledgeCheckInAlert}
                className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-2 text-[#9BAFC4] hover:text-white"
                title="Reset 10m Timer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 4 Golden Rules Strip */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#F59E0B]">
              <span>1. TODAY’S REMAINING BUDGET</span>
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-xl font-extrabold text-white">
                ${remainingDailyAllowanceUsd.toFixed(0)} Left
              </span>
              <span className="font-mono text-[11px] text-[#9BAFC4]">
                of ${dailyAllowanceUsd} limit
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#9BAFC4]">
              Max safe risk per trade now:{' '}
              <strong className="font-mono text-[#26D6A0]">
                ${safeMaxRiskPerSingleTrade}
              </strong>{' '}
              (Never put it all in 1 trade!)
            </p>
          </div>

          <div className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3.5">
            <div className="text-xs font-bold text-[#EF4444]">
              2. NO "ONE TRADE TO CLEAR DEBT"
            </div>
            <p className="mt-1.5 text-xs text-white font-semibold">
              Home-run gambling destroys accounts.
            </p>
            <p className="mt-0.5 text-[11px] text-[#9BAFC4]">
              Take +15% to +30% base hits and close it. Wealth is built over 250 trading days, not 1 candle.
            </p>
          </div>

          <div className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3.5">
            <div className="text-xs font-bold text-[#26D6A0]">
              3. NEVER AVERAGE DOWN 0DTE
            </div>
            <p className="mt-1.5 text-xs text-white font-semibold">
              Do not wait long & add to losers.
            </p>
            <p className="mt-0.5 text-[11px] text-[#9BAFC4]">
              If a setup fails your stop (-20%), exit immediately. You can always re-enter a fresh setup later.
            </p>
          </div>

          <div className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3.5">
            <div className="text-xs font-bold text-[#3B82F6]">
              4. YOU HAVE FAMILY & TOMORROW
            </div>
            <p className="mt-1.5 text-xs text-white font-semibold">
              Protect your mental peace first.
            </p>
            <p className="mt-0.5 text-[11px] text-[#9BAFC4]">
              Your family needs you calm and present—not stressed over revenge trades. Market opens tomorrow at 9:30 AM!
            </p>
          </div>
        </div>
      </div>

      {/* 10-MINUTE POPUP ALERT BANNER IF DUE */}
      {checkInAlertDue && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#F59E0B] bg-[#F59E0B]/15 p-4">
          <div className="flex items-center gap-3">
            <Flame className="h-6 w-6 text-[#F59E0B] animate-bounce" />
            <div>
              <h2 className="text-sm font-extrabold text-white">
                ⏰ {checkInIntervalMinutes}-Minute Discipline Check-In Is Due!
              </h2>
              <p className="text-xs text-[#9BAFC4]">
                Pause for 15 seconds: Check for brain fog, revenge mood, FOMO, or over-confidence below and log your state.
              </p>
            </div>
          </div>
          <button
            onClick={acknowledgeCheckInAlert}
            className="rounded-xl bg-[#F59E0B] px-4 py-2 text-xs font-extrabold text-[#0B1220]"
          >
            Acknowledge & Complete Check-In Below
          </button>
        </div>
      )}

      {/* 2. INTERACTIVE 10-MINUTE CHECK-IN FORM & REAL-TIME PSYCHOLOGY INTERVENTION */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left: Check-In Logger (8 cols) */}
        <form
          onSubmit={handleLogCheckIn}
          className="lg:col-span-8 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2D45] pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[#26D6A0]" />
              <h2 className="text-sm font-extrabold text-white">
                Log 10-Minute Emotion, Brain-Fog & Discipline Check-In
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#9BAFC4]">Check-In Every:</span>
              {[5, 10, 15, 30].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setCheckInIntervalMinutes(m);
                    acknowledgeCheckInAlert();
                  }}
                  className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold ${
                    checkInIntervalMinutes === m
                      ? 'bg-[#26D6A0] text-[#0B1220]'
                      : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4]'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* Step A: Brain Fog Check */}
          <div>
            <label className="block text-xs font-bold text-white mb-2">
              Step 1: How is your Mental Clarity / Brain Fog right now?
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {BRAIN_FOG_OPTIONS.map((item) => {
                const active = brainFog === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBrainFog(item.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      active
                        ? item.danger
                          ? 'border-[#EF4444] bg-[#EF4444]/15'
                          : 'border-[#26D6A0] bg-[#26D6A0]/15'
                        : 'border-[#1E2D45] bg-[#0B1220] hover:border-[#26D6A0]/50'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">
                      {item.label}
                    </div>
                    <p className="mt-1 text-[11px] text-[#9BAFC4]">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step B: Primary Mood Selector */}
          <div>
            <label className="block text-xs font-bold text-white mb-2">
              Step 2: What Mood / Temptation are you feeling right now?
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {MOOD_OPTIONS.map((item) => {
                const active = selectedMood === item.id;
                const borderStyle = active
                  ? item.severity === 'DANGER'
                    ? 'border-[#EF4444] bg-[#EF4444]/15'
                    : item.severity === 'CAUTION'
                      ? 'border-[#F59E0B] bg-[#F59E0B]/15'
                      : 'border-[#26D6A0] bg-[#26D6A0]/15'
                  : 'border-[#1E2D45] bg-[#0B1220] hover:border-[#26D6A0]/50';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedMood(item.id);
                      if (item.severity === 'DANGER') {
                        setActionTaken(
                          'Stepped Away 15m — Refused Impulse / Protected Remaining Budget'
                        );
                      } else if (item.severity === 'CAUTION') {
                        setActionTaken('Sized Down to 1 Contract — Locked Profit');
                      } else {
                        setActionTaken('Followed Plan — Base Hit Sizing Only');
                      }
                    }}
                    className={`rounded-xl border p-3 text-left transition ${borderStyle}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white">
                        {item.label}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                          item.severity === 'DANGER'
                            ? 'bg-[#EF4444]/20 text-[#EF4444]'
                            : item.severity === 'CAUTION'
                              ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                              : 'bg-[#22C55E]/20 text-[#22C55E]'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#9BAFC4]">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step C: Secondary Mood Tags + Urge Intensity + Remaining Budget Input */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-[#9BAFC4] mb-1">
                Today’s Max Risk Allowance ($)
              </label>
              <input
                type="number"
                value={dailyAllowanceUsd}
                onChange={(e) =>
                  setDailyAllowanceUsd(Math.max(50, Number(e.target.value)))
                }
                className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3 py-2 font-mono text-xs font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9BAFC4] mb-1">
                Impulse / Emotion Intensity ({urgeIntensity}/10)
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={urgeIntensity}
                onChange={(e) => setUrgeIntensity(Number(e.target.value))}
                className="w-full accent-[#26D6A0] mt-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9BAFC4] mb-1">
                Action You Are Taking Now
              </label>
              <select
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-xs font-semibold text-white"
              >
                <option value="Followed Plan — Base Hit Sizing Only">
                  Followed Plan — Base Hit Sizing Only
                </option>
                <option value="Sized Down to 1 Contract — Locked Profit">
                  Sized Down to 1 Contract — Locked Profit
                </option>
                <option value="Stepped Away 15m — Refused Impulse / Protected Remaining Budget">
                  Stepped Away 15m — Refused Impulse
                </option>
                <option value="Cut Loser Early — Did Not Average Down">
                  Cut Loser Early — Did Not Average Down
                </option>
                <option value="Done for the Day — Protecting Family & Green P&L">
                  Done for the Day — Protecting Family & P&L
                </option>
              </select>
            </div>
          </div>

          {/* Step D: Secondary Tags & Notes */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[#9BAFC4] mr-1">Also feeling:</span>
              {MOOD_OPTIONS.filter((m) => m.id !== selectedMood).map((m) => {
                const checked = secondaryMoods.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleSecondaryMood(m.id)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                      checked
                        ? 'border-[#26D6A0] bg-[#26D6A0]/20 text-[#26D6A0]'
                        : 'border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4]'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <input
                type="text"
                placeholder="Write a quick note to yourself (e.g., 'Up $300 today, only risking $100 max on next setup, not chasing')..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3.5 py-2.5 text-xs text-white"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#26D6A0] px-5 py-2.5 text-xs font-extrabold text-[#0B1220] shadow-md hover:opacity-95 transition shrink-0"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save 10m Check-In Log</span>
              </button>
            </div>
          </div>
        </form>

        {/* Right: Live Coach Intervention & Emergency Cooldown Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div
            className={`rounded-2xl border-2 p-5 space-y-3.5 ${
              isDangerState
                ? 'border-[#EF4444] bg-[#EF4444]/10'
                : activeMoodObj.severity === 'CAUTION'
                  ? 'border-[#F59E0B] bg-[#F59E0B]/10'
                  : 'border-[#26D6A0]/50 bg-[#111C2E]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                {isDangerState ? (
                  <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
                ) : (
                  <Sparkles className="h-5 w-5 text-[#26D6A0]" />
                )}
                Real-Time Mindset Coach
              </span>
              <span className="font-mono text-xs font-bold text-[#26D6A0]">
                {activeMoodObj.label}
              </span>
            </div>

            <p className="text-xs text-white leading-relaxed font-medium">
              {activeMoodObj.coachMessage}
            </p>

            {/* Family & Survival Pledge Checkbox */}
            <label className="flex items-start gap-2.5 rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={familyReminderChecked}
                onChange={(e) => setFamilyReminderChecked(e.target.checked)}
                className="mt-1 accent-[#26D6A0]"
              />
              <span className="text-[#9BAFC4]">
                <strong className="text-white">I promise myself & my family:</strong>{' '}
                I only have <strong className="text-[#26D6A0]">${remainingDailyAllowanceUsd}</strong> left to risk today. I will not wait too long, I will not average down, and I will not put everything into one trade.
              </span>
            </label>

            {/* One-Click Protective Cooldown / Kill Switch */}
            <div className="pt-1">
              {riskSettings.killSwitchActive ? (
                <button
                  type="button"
                  onClick={resetKillSwitch}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-4 py-2.5 text-xs font-extrabold text-white"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Cooldown Complete — Unlock Terminal</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={triggerEmergencyKillSwitch}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#EF4444] px-4 py-2.5 text-xs font-extrabold text-white shadow-md hover:opacity-90 transition"
                >
                  <AlertOctagon className="h-4 w-4" />
                  <span>
                    Feeling Revenge / Brain Fog? Lock Terminal Now
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Today's Survival Math Box */}
          <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between font-bold text-white">
              <span>Today’s Capital Protection Math</span>
              <ShieldAlert className="h-4 w-4 text-[#26D6A0]" />
            </div>
            <div className="flex items-center justify-between border-b border-[#1E2D45] pb-2">
              <span className="text-[#9BAFC4]">Today’s Net P&L So Far:</span>
              <span
                className={`font-mono font-extrabold ${
                  activeAccount.realizedPnl + activeAccount.unrealizedPnl >= 0
                    ? 'text-[#22C55E]'
                    : 'text-[#EF4444]'
                }`}
              >
                {activeAccount.realizedPnl + activeAccount.unrealizedPnl >= 0
                  ? '+'
                  : ''}
                $
                {(
                  activeAccount.realizedPnl + activeAccount.unrealizedPnl
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1E2D45] pb-2">
              <span className="text-[#9BAFC4]">Remaining Risk Today:</span>
              <span className="font-mono font-extrabold text-[#26D6A0]">
                ${remainingDailyAllowanceUsd.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9BAFC4]">Safe Base-Hit Allowance:</span>
              <span className="font-mono font-bold text-white">
                3 trades × ${safeMaxRiskPerSingleTrade} max risk
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CAPTURED MOOD & DISCIPLINE LOG HISTORY TABLE */}
      <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-extrabold text-white">
              Captured 10-Minute Mood, Brain-Fog & Discipline Logs ({disciplineLogs.length})
            </h2>
            <p className="text-xs text-[#9BAFC4]">
              Review your emotional pattern across the trading day to spot Profit Overconfidence, Revenge, or FOMO before they cost you money
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E2D45] text-[11px] font-bold uppercase text-[#9BAFC4]">
                <th className="py-2.5 px-3">Time / Date</th>
                <th className="py-2.5 px-3">Brain Fog</th>
                <th className="py-2.5 px-3">Mood Captured</th>
                <th className="py-2.5 px-3">Urge (1-10)</th>
                <th className="py-2.5 px-3">Remaining Budget</th>
                <th className="py-2.5 px-3">Action Taken</th>
                <th className="py-2.5 px-3">Reflection / Notes</th>
                <th className="py-2.5 px-2 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D45]">
              {disciplineLogs.map((log) => {
                const moodMeta =
                  MOOD_OPTIONS.find((m) => m.id === log.mood) || MOOD_OPTIONS[0];
                return (
                  <tr key={log.id} className="hover:bg-[#0B1220]">
                    <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                      {log.timestamp}
                      <span className="block text-[10px] font-normal text-[#9BAFC4]">
                        {log.tradeDate}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${
                          log.brainFog === 'BRAIN_FOG' ||
                          log.brainFog === 'EXHAUSTED'
                            ? 'bg-[#EF4444]/20 text-[#EF4444]'
                            : log.brainFog === 'MILD_FATIGUE'
                              ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                              : 'bg-[#22C55E]/20 text-[#22C55E]'
                        }`}
                      >
                        {log.brainFog}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`rounded-md px-2 py-0.5 font-bold ${
                          moodMeta.severity === 'DANGER'
                            ? 'bg-[#EF4444]/20 text-[#EF4444]'
                            : moodMeta.severity === 'CAUTION'
                              ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                              : 'bg-[#26D6A0]/20 text-[#26D6A0]'
                        }`}
                      >
                        {moodMeta.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {log.urgeIntensity}/10
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#26D6A0]">
                      ${log.remainingDailyBudgetUsd}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {log.actionTaken}
                    </td>
                    <td className="py-3 px-3 text-[#9BAFC4] max-w-md">
                      {log.notes}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => deleteDisciplineCheckIn(log.id)}
                        className="rounded-lg p-1.5 text-[#9BAFC4] hover:text-[#EF4444]"
                        title="Delete Check-In"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
