import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Heart,
  HeartHandshake,
  Lock,
  PauseCircle,
  ShieldAlert,
  Sparkles,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { BrainFogLevel, DisciplineMood } from '../../types/trading';

interface MindsetReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MindsetReminderModal: React.FC<MindsetReminderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    addDisciplineCheckIn,
    acknowledgeCheckInAlert,
    triggerEmergencyKillSwitch,
    secondsUntilCheckIn,
    operatorEmail,
    activeAccount,
    isRegularMarketOpen,
    market,
  } = useTrading();

  const [brainFog, setBrainFog] = useState<BrainFogLevel>('CLEAR');
  const [mood, setMood] = useState<DisciplineMood>('CALM_DISCIPLINED');
  const [mindsetNote, setMindsetNote] = useState<string>('');
  const [respectedOneQuantityRule, setRespectedOneQuantityRule] = useState<boolean>(true);
  const [avoidedChopZone, setAvoidedChopZone] = useState<boolean>(true);
  const [stopLossPreDefined, setStopLossPreDefined] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // USER RULE: Pop-up should work during regular market open hours only
  const isMarketOpen = isRegularMarketOpen();
  if (!isOpen) return null;

  const handleSaveMindset = () => {
    setIsSubmitting(true);

    const checksPassed = [
      respectedOneQuantityRule ? 'Strict 1-Contract Rule Respected' : null,
      avoidedChopZone ? 'Avoided 8:30 AM Midday Chop Zone' : null,
      stopLossPreDefined ? 'Hard Stop Loss Pre-Defined Before Entry' : null,
    ].filter(Boolean).join(' • ');

    addDisciplineCheckIn({
      brainFog,
      mood,
      secondaryMoods: [],
      urgeIntensity: mood === 'REVENGE' ? 8 : 2,
      remainingDailyBudgetUsd: 500,
      actionTaken: checksPassed || 'Disciplined mindset logged prior to execution',
      familyReminderChecked: true,
      notes: mindsetNote.trim() || 'Mindset verified. Focused on execution over outcome. 1 contract only.',
    });

    setIsSubmitting(false);
    onClose();
  };

  const handleTakeFifteenBreak = () => {
    addDisciplineCheckIn({
      brainFog: 'EXHAUSTED',
      mood: 'OVER_TRADE',
      secondaryMoods: [],
      urgeIntensity: 3,
      remainingDailyBudgetUsd: 500,
      actionTaken: 'Trader elected 15-minute mental reset break. Stepping away from charts.',
      familyReminderChecked: true,
      notes: 'Stepped away from screen for mental clarity. Protecting capital.',
    });
    acknowledgeCheckInAlert();
    onClose();
  };

  const handleTriggerEmergencyStop = () => {
    triggerEmergencyKillSwitch();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-[#26D6A0] bg-[#111C2E] p-6 shadow-2xl shadow-[#26D6A0]/20 text-white overflow-hidden max-h-[92vh] flex flex-col">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#26D6A0] via-[#22C55E] to-[#F59E0B]" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#1E2D45] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#26D6A0]/15 text-[#26D6A0] ring-4 ring-[#26D6A0]/10">
              <Brain className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">
                  Trader Mindset & Psychological Check-In
                </h2>
                <span className="rounded bg-[#F59E0B]/20 border border-[#F59E0B]/40 px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#F59E0B]">
                  DISCIPLINE GATE
                </span>
                <span
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] font-extrabold ${
                    isMarketOpen
                      ? 'border-[#22C55E]/40 bg-[#22C55E]/20 text-[#22C55E]'
                      : 'border-[#9BAFC4]/40 bg-[#0B1220] text-[#9BAFC4]'
                  }`}
                  title="Mindset pop-up works automatically during Regular Market Open Hours (9:30 AM - 4:00 PM ET)"
                >
                  {isMarketOpen ? '● REGULAR MARKET OPEN' : '○ MANUAL OVERVIEW'}
                </span>
              </div>
              <p className="text-xs text-[#9BAFC4]">
                10-Minute Reality Anchor • Pause before your next execution • Protect your tomorrow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-2 text-[#9BAFC4] hover:text-white transition"
            title="Dismiss reminder"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Family & Long-Term Tomorrow Anchor Banner */}
          <div className="rounded-xl border border-[#26D6A0]/30 bg-[#26D6A0]/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#26D6A0] text-[#0B1220]">
                <Heart className="h-5 w-5 fill-current" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-[#26D6A0] uppercase tracking-wide">
                  The Family & Tomorrow Anchor:
                </span>
                <p className="mt-1 text-white font-medium italic leading-relaxed">
                  "You are not trading for today's adrenaline. You are trading to fund your family's future and build lasting financial freedom. Never let one impulsive trade steal what you took months to build."
                </p>
                <div className="mt-2 flex items-center gap-4 text-[11px] text-[#9BAFC4]">
                  <span>Operator: <strong className="text-white">{operatorEmail || 'Disciplined Trader'}</strong></span>
                  <span>•</span>
                  <span>Current P&L: <strong className={activeAccount.realizedPnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}>${activeAccount.realizedPnl.toFixed(2)}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* 1. Brain Fog & Clarity Level */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9BAFC4] mb-2">
              1. Mental Clarity & Brain Fog Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { level: 'CLEAR' as BrainFogLevel, label: 'Razor Sharp', desc: '100% Alert & Focused', color: 'border-[#22C55E] text-[#22C55E] bg-[#22C55E]/10' },
                { level: 'MILD_FATIGUE' as BrainFogLevel, label: 'Mild Fatigue', desc: 'Slightly distracted', color: 'border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10' },
                { level: 'BRAIN_FOG' as BrainFogLevel, label: 'Foggy / Tired', desc: 'Slower reactions', color: 'border-[#FB923C] text-[#FB923C] bg-[#FB923C]/10' },
                { level: 'EXHAUSTED' as BrainFogLevel, label: 'Severe Fog', desc: 'High risk of tilt', color: 'border-[#EF4444] text-[#EF4444] bg-[#EF4444]/10' },
              ].map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setBrainFog(item.level)}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    brainFog === item.level
                      ? `${item.color} ring-2 ring-current font-bold`
                      : 'border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:border-[#9BAFC4]'
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Emotional State / Mood */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9BAFC4] mb-2">
              2. Current Psychological State
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { moodCode: 'CALM_DISCIPLINED' as DisciplineMood, label: '🧘 Calm & Objective', desc: 'Executing edge with zero ego' },
                { moodCode: 'REVENGE' as DisciplineMood, label: '😤 Revenge / Frustrated', desc: 'Urge to win back previous loss' },
                { moodCode: 'FOMO' as DisciplineMood, label: '😨 FOMO / Chasing', desc: 'Urge to chase green candles' },
                { moodCode: 'PROFIT_CONFIDENT' as DisciplineMood, label: '🤑 Profit Confident', desc: 'Feeling invincible after win' },
                { moodCode: 'OVER_TRADE' as DisciplineMood, label: '💤 Over-trading Urge', desc: 'Taking trades out of restlessness' },
                { moodCode: 'CLEAR_ALL_DEBT_ONE_TRADE' as DisciplineMood, label: '🚨 Home Run Fantasy', desc: 'Trying to hit 1 giant winner' },
              ].map((m) => (
                <button
                  key={m.moodCode}
                  type="button"
                  onClick={() => setMood(m.moodCode)}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    mood === m.moodCode
                      ? 'border-[#26D6A0] bg-[#26D6A0]/15 text-white font-bold ring-2 ring-[#26D6A0]'
                      : 'border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:border-[#9BAFC4]'
                  }`}
                >
                  <div className="text-xs">{m.label}</div>
                  <div className="text-[10px] text-[#9BAFC4] mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Strict Rules Checklist */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9BAFC4] mb-2">
              3. Strict Rules Gate (User Discipline Commitments)
            </label>
            <div className="space-y-2 rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3.5">
              <label className="flex items-center gap-3 text-xs text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={respectedOneQuantityRule}
                  onChange={(e) => setRespectedOneQuantityRule(e.target.checked)}
                  className="h-4 w-4 rounded border-[#1E2D45] bg-[#111C2E] text-[#26D6A0] focus:ring-[#26D6A0]"
                />
                <div>
                  <strong className="text-[#26D6A0]">Strict 1-Quantity Rule:</strong>
                  <span className="text-[#9BAFC4] ml-1.5">Hard cap of 1 contract per trade. No sizing up on loss.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={avoidedChopZone}
                  onChange={(e) => setAvoidedChopZone(e.target.checked)}
                  className="h-4 w-4 rounded border-[#1E2D45] bg-[#111C2E] text-[#26D6A0] focus:ring-[#26D6A0]"
                />
                <div>
                  <strong className="text-[#F59E0B]">8:30 AM PT Stop Discipline:</strong>
                  <span className="text-[#9BAFC4] ml-1.5">Strict Stay Away between 9:00 AM and 11:00 AM PT (12:00 PM – 2:00 PM ET).</span>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={stopLossPreDefined}
                  onChange={(e) => setStopLossPreDefined(e.target.checked)}
                  className="h-4 w-4 rounded border-[#1E2D45] bg-[#111C2E] text-[#26D6A0] focus:ring-[#26D6A0]"
                />
                <div>
                  <strong className="text-[#22C55E]">Pre-Defined Exit Plan:</strong>
                  <span className="text-[#9BAFC4] ml-1.5">Stop loss and target are calculated prior to hitting buy.</span>
                </div>
              </label>
            </div>
          </div>

          {/* 4. Mindset Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9BAFC4] mb-1.5">
              4. Capture Mindset Details & Setup Strategy (Freeform Notes)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Feeling calm and patient. Waiting for clean 1m Bollinger Band mean reversion or VWAP tap on SPX with 1 contract only..."
              value={mindsetNote}
              onChange={(e) => setMindsetNote(e.target.value)}
              className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3 text-xs font-mono text-white placeholder-[#9BAFC4]/50 focus:border-[#26D6A0] focus:outline-none"
            />
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1E2D45] pt-4 mt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTakeFifteenBreak}
              className="flex items-center gap-1.5 rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3.5 py-2 font-mono text-xs font-bold text-[#F59E0B] hover:bg-[#F59E0B] hover:text-[#0B1220] transition"
              title="Pause trading and step away from charts for 15 minutes"
            >
              <PauseCircle className="h-4 w-4" />
              <span>Take 15m Reset Break</span>
            </button>
            <button
              type="button"
              onClick={handleTriggerEmergencyStop}
              className="flex items-center gap-1.5 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2 font-mono text-xs font-bold text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition"
              title="Activate Emergency Kill Switch"
            >
              <AlertOctagon className="h-4 w-4" />
              <span>Emergency Lock</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveMindset}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-[#26D6A0] px-5 py-2.5 font-mono text-xs font-black text-[#0B1220] hover:bg-[#22C55E] shadow-lg shadow-[#26D6A0]/25 transition"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Save Mindset & Lock Discipline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default MindsetReminderModal;
