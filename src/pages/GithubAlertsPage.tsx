import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BellOff,
  BellRing,
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  ExternalLink,
  Flame,
  Info,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Table,
  Target,
  Terminal,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { DayTraderAlertType, DayTraderSkillAlert } from '../types/trading';

const ALERT_TYPE_LABELS: Record<
  DayTraderAlertType,
  { label: string; color: string; bg: string; icon: React.FC<{ className?: string }> }
> = {
  STOP_LOSS: {
    label: 'STOP LOSS',
    color: 'text-[#EF4444]',
    bg: 'bg-[#EF4444]/15 border-[#EF4444]/40',
    icon: ShieldAlert,
  },
  PROFIT_TARGET: {
    label: 'PROFIT TARGET',
    color: 'text-[#22C55E]',
    bg: 'bg-[#22C55E]/15 border-[#22C55E]/40',
    icon: Target,
  },
  FLAT_BY_CLOSE: {
    label: 'FLAT BY CLOSE',
    color: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/15 border-[#F59E0B]/40',
    icon: Clock,
  },
  PRICE_ABOVE: {
    label: 'PRICE ABOVE',
    color: 'text-[#26D6A0]',
    bg: 'bg-[#26D6A0]/15 border-[#26D6A0]/40',
    icon: ArrowUpRight,
  },
  PRICE_BELOW: {
    label: 'PRICE BELOW',
    color: 'text-[#38BDF8]',
    bg: 'bg-[#38BDF8]/15 border-[#38BDF8]/40',
    icon: ArrowDownRight,
  },
  OPENING_BELL: {
    label: 'OPENING BELL',
    color: 'text-[#A855F7]',
    bg: 'bg-[#A855F7]/15 border-[#A855F7]/40',
    icon: BellRing,
  },
  PERCENT_MOVE: {
    label: 'PERCENT MOVE',
    color: 'text-[#EC4899]',
    bg: 'bg-[#EC4899]/15 border-[#EC4899]/40',
    icon: TrendingUp,
  },
};

export const GithubAlertsPage: React.FC = () => {
  const {
    activeSymbol,
    selectTradingSymbol,
    market,
    dayTraderAlerts,
    totalAlertsCreatedCount,
    addDayTraderAlert,
    createTradePlanAlertTriad,
    deleteDayTraderAlert,
    clearExpiredAlerts,
    clearAllDayTraderAlerts,
  } = useTrading();

  // Active Main Tab: ALERTS_DESK or DEVELOPER_DEBUG (Schema & Query Editor)
  const [viewTab, setViewTab] = useState<'ALERTS_DESK' | 'DEV_SCHEMA_QUERY'>('ALERTS_DESK');

  // Filter & Search
  const [filterType, setFilterType] = useState<'ALL' | DayTraderAlertType>('ALL');
  const [searchSymbol, setSearchSymbol] = useState<string>('');

  // Retention setting (USER REQUEST: alert make for more than 2 days: 2, 7, 14, 30, or 90 days)
  const [selectedRetentionDays, setSelectedRetentionDays] = useState<number>(7);

  // Quick Triad Plan Builder Inputs
  const [triadSymbol, setTriadSymbol] = useState<string>(activeSymbol);
  const [triadStop, setTriadStop] = useState<number>(
    Number((market.spotPrice * 0.985).toFixed(2))
  );
  const [triadTarget, setTriadTarget] = useState<number>(
    Number((market.spotPrice * 1.02).toFixed(2))
  );
  const [triadCloseTime, setTriadCloseTime] = useState<string>('15:55');

  // Single Alert Custom Builder
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customSymbol, setCustomSymbol] = useState<string>(activeSymbol);
  const [customType, setCustomType] = useState<DayTraderAlertType>('PRICE_ABOVE');
  const [customPrice, setCustomPrice] = useState<number>(
    Number(market.spotPrice.toFixed(2))
  );
  const [customCondition, setCustomCondition] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [customRetentionDays, setCustomRetentionDays] = useState<number>(7);

  // Feedback message
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Developer Query Editor State
  const [customQuery, setCustomQuery] = useState<string>(
    'SELECT symbol, alertType, targetPrice, status, expiresAt FROM day_trader_alerts WHERE status = "ACTIVE"'
  );
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const activeAlerts = useMemo(
    () => dayTraderAlerts.filter((a) => a.status === 'ACTIVE'),
    [dayTraderAlerts]
  );

  const filteredAlerts = useMemo(() => {
    return dayTraderAlerts.filter((alert) => {
      if (filterType !== 'ALL' && alert.alertType !== filterType) return false;
      if (
        searchSymbol &&
        !alert.symbol.toLowerCase().includes(searchSymbol.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [dayTraderAlerts, filterType, searchSymbol]);

  // Compute remaining time until expiration (supports 2d, 7d, 14d, 30d, 90d)
  const getExpiresTimeText = (expiresAtIso: string) => {
    const diffMs = new Date(expiresAtIso).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;
    if (days > 0) return `${days}d ${remHours}h left`;
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${totalHours}h ${mins}m left`;
  };

  const handleCreateTriad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!triadSymbol || triadStop <= 0 || triadTarget <= 0) return;
    createTradePlanAlertTriad(
      triadSymbol.trim().toUpperCase(),
      triadStop,
      triadTarget,
      triadCloseTime,
      selectedRetentionDays
    );
    setActionFeedback(
      `✓ Created 3 Alert Triad for ${triadSymbol.toUpperCase()} with ${selectedRetentionDays}-Day retention.`
    );
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymbol) return;

    let condition = customCondition.trim();
    if (!condition) {
      if (customType === 'PRICE_ABOVE') condition = `${customSymbol} >= $${customPrice}`;
      else if (customType === 'PRICE_BELOW') condition = `${customSymbol} <= $${customPrice}`;
      else if (customType === 'STOP_LOSS') condition = `Stop Loss at $${customPrice}`;
      else if (customType === 'PROFIT_TARGET') condition = `Profit Target at $${customPrice}`;
      else if (customType === 'FLAT_BY_CLOSE') condition = `Mandatory Flatten Alert`;
      else if (customType === 'OPENING_BELL') condition = `NYSE 9:30 AM Opening Bell`;
      else condition = `${customSymbol} Alert Trigger`;
    }

    addDayTraderAlert({
      symbol: customSymbol.trim().toUpperCase(),
      alertType: customType,
      targetPrice: customPrice > 0 ? customPrice : undefined,
      triggerCondition: condition,
      currentPriceAtCreation: market.spotPrice,
      notes: customNotes || undefined,
      retentionDays: customRetentionDays,
    });

    setShowCustomModal(false);
    setCustomCondition('');
    setCustomNotes('');
    setActionFeedback(`✓ Created single alert for ${customSymbol.toUpperCase()} with ${customRetentionDays}-day retention.`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Clean-up action: Individual alert deletion
  const handleDeleteSingleAlert = (id: string, symbol: string) => {
    deleteDayTraderAlert(id);
    setActionFeedback(`✓ Cleaned alert ${id} (${symbol}).`);
    setTimeout(() => setActionFeedback(null), 2500);
  };

  // Clean-up action: Clear expired alerts
  const handlePurgeExpired = () => {
    const purged = clearExpiredAlerts();
    setActionFeedback(
      purged > 0
        ? `✓ Cleaned ${purged} expired alert(s).`
        : '✓ Zero expired alerts found. All active alerts are within their retention schedule.'
    );
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Clean-up action: Clear ALL alerts with confirmation
  const handleClearAllAlerts = () => {
    if (window.confirm(`Are you sure you want to clean up and delete ALL ${dayTraderAlerts.length} alerts?`)) {
      clearAllDayTraderAlerts();
      setActionFeedback('✓ All alerts successfully cleaned up and cleared.');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // Execute Developer Mock SQL / JSON Query
  const handleExecuteQuery = () => {
    setQueryError(null);
    try {
      const q = customQuery.trim().toLowerCase();
      let res = [...dayTraderAlerts];

      if (q.includes('where')) {
        if (q.includes('status = "active"') || q.includes("status = 'active'")) {
          res = res.filter((a) => a.status === 'ACTIVE');
        } else if (q.includes('stop_loss')) {
          res = res.filter((a) => a.alertType === 'STOP_LOSS');
        } else if (q.includes('profit_target')) {
          res = res.filter((a) => a.alertType === 'PROFIT_TARGET');
        } else if (q.includes('flat_by_close')) {
          res = res.filter((a) => a.alertType === 'FLAT_BY_CLOSE');
        }
      }

      if (q.includes('order by')) {
        if (q.includes('createdat desc')) {
          res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (q.includes('targetprice')) {
          res.sort((a, b) => (b.targetPrice || 0) - (a.targetPrice || 0));
        }
      }

      setQueryResult(res);
    } catch (err: any) {
      setQueryError(`Query execution error: ${err.message || String(err)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#26D6A0]/15 text-[#26D6A0]">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-black text-white">
                Github Day Trader Skill Alert Desk
              </h1>
              <span className="rounded-md bg-[#26D6A0]/20 px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-[#26D6A0]">
                Jakeschincariol/day-trader-skill
              </span>
              <span className="rounded-md bg-[#38BDF8]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#38BDF8]">
                EXTENDED RETENTION &amp; DEV SCHEMA
              </span>
            </div>
            <p className="text-xs text-[#9BAFC4] mt-0.5">
              Integrated from{' '}
              <a
                href="https://github.com/Jakeschincariol/day-trader-skill"
                target="_blank"
                rel="noreferrer"
                className="text-[#26D6A0] hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Jakeschincariol/day-trader-skill
                <ExternalLink className="h-3 w-3" />
              </a>
              : multi-alert trade plan triads, customizable retention (&gt; 2 days to 90 days), single/all cleanup actions, and dev query debugger.
            </p>
          </div>
        </div>

        {/* View Segment Switcher (Alerts Desk vs Developer Schema & Query Editor) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-[#1E2D45] bg-[#0B1220] p-1 text-xs font-bold">
            <button
              onClick={() => setViewTab('ALERTS_DESK')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                viewTab === 'ALERTS_DESK'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'text-[#9BAFC4] hover:text-white'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Alerts Desk</span>
            </button>
            <button
              onClick={() => {
                setViewTab('DEV_SCHEMA_QUERY');
                if (!queryResult) handleExecuteQuery();
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                viewTab === 'DEV_SCHEMA_QUERY'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'text-[#9BAFC4] hover:text-white'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Dev Schema &amp; Query Editor</span>
            </button>
          </div>

          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#26D6A0] px-4 py-2 text-xs font-black text-[#0B1220] hover:bg-[#22C55E] shadow-md shadow-[#26D6A0]/20 transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ Create Alert</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-xl border border-[#26D6A0]/40 bg-[#0B1220] p-3 text-xs text-[#26D6A0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-[#9BAFC4] hover:text-white">✕</button>
        </div>
      )}

      {/* VIEW TAB 1: ALERTS DESK */}
      {viewTab === 'ALERTS_DESK' && (
        <>
          {/* Metric Cards: Total Created Counter & Lifespan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BAFC4]">
                Total Alerts Created
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-white">
                  {totalAlertsCreatedCount}
                </span>
                <span className="text-xs text-[#26D6A0] font-semibold">
                  All-Time Lifetime Count
                </span>
              </div>
              <span className="text-[10px] text-[#9BAFC4] block mt-1">
                Persistently stored in LocalStorage
              </span>
            </div>

            <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BAFC4]">
                Active Alerts Monitored
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-[#26D6A0]">
                  {activeAlerts.length}
                </span>
                <span className="text-xs text-[#9BAFC4]">
                  of {dayTraderAlerts.length} in registry
                </span>
              </div>
              <span className="text-[10px] text-[#9BAFC4] block mt-1">
                Monitored against real-time market data ticks
              </span>
            </div>

            <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BAFC4]">
                Configured Retention Lifespan
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-[#38BDF8]">
                  {selectedRetentionDays} Days
                </span>
                <span className="text-xs text-[#38BDF8] font-bold">
                  ({selectedRetentionDays * 24} Hours)
                </span>
              </div>
              <span className="text-[10px] text-[#9BAFC4] block mt-1">
                Configurable retention (2d, 7d, 14d, 30d, 90d)
              </span>
            </div>

            <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BAFC4]">
                Active Target Symbol
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-[#F59E0B]">
                  {activeSymbol}
                </span>
                <span className="font-mono text-xs text-white">
                  ${market.spotPrice.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-[#9BAFC4] block mt-1">
                Click any alert row to switch active focus
              </span>
            </div>
          </div>

          {/* Multi-Alert Triad Generator Box with Custom Retention (> 2 Days) */}
          <div className="rounded-2xl border border-[#26D6A0]/40 bg-[#111C2E] p-5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2D45] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#26D6A0]" />
                <span className="text-sm font-extrabold text-white">
                  Trade Plan Multi-Alert Triad Generator (Configurable Retention)
                </span>
                <span className="rounded bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                  skill: trader-alerts
                </span>
              </div>
              <p className="text-xs text-[#9BAFC4]">
                Generates 3 day-trading guardrails at once: Stop Loss, Profit Target, and 3:55 PM Flatten alert.
              </p>
            </div>

            <form onSubmit={handleCreateTriad} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 text-xs">
              <div>
                <label className="block text-[#9BAFC4] font-bold mb-1">Symbol</label>
                <input
                  type="text"
                  value={triadSymbol}
                  onChange={(e) => setTriadSymbol(e.target.value.toUpperCase())}
                  placeholder="SPX, SPY, NVDA"
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-white font-mono font-bold focus:border-[#26D6A0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#EF4444] font-bold mb-1">
                  Stop-Loss Level ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={triadStop}
                  onChange={(e) => setTriadStop(Number(e.target.value))}
                  placeholder="e.g. 5940.00"
                  className="w-full rounded-lg border border-[#EF4444]/40 bg-[#0B1220] px-3 py-2 text-[#EF4444] font-mono font-bold focus:border-[#EF4444] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#22C55E] font-bold mb-1">
                  Profit Target Level ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={triadTarget}
                  onChange={(e) => setTriadTarget(Number(e.target.value))}
                  placeholder="e.g. 6020.00"
                  className="w-full rounded-lg border border-[#22C55E]/40 bg-[#0B1220] px-3 py-2 text-[#22C55E] font-mono font-bold focus:border-[#22C55E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#F59E0B] font-bold mb-1">
                  Closing Flat Alert Time (ET)
                </label>
                <input
                  type="text"
                  value={triadCloseTime}
                  onChange={(e) => setTriadCloseTime(e.target.value)}
                  placeholder="15:55"
                  className="w-full rounded-lg border border-[#F59E0B]/40 bg-[#0B1220] px-3 py-2 text-[#F59E0B] font-mono font-bold focus:border-[#F59E0B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#38BDF8] font-bold mb-1">
                  Alert Retention Lifespan
                </label>
                <select
                  value={selectedRetentionDays}
                  onChange={(e) => setSelectedRetentionDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#38BDF8]/40 bg-[#0B1220] px-3 py-2 text-[#38BDF8] font-mono font-bold focus:border-[#38BDF8] focus:outline-none"
                >
                  <option value={2}>2 Days (48 Hours)</option>
                  <option value={7}>7 Days (1 Week - Recommended)</option>
                  <option value={14}>14 Days (2 Weeks)</option>
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={90}>90 Days (Quarter)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#26D6A0] px-4 py-2 font-mono font-black text-[#0B1220] hover:bg-[#22C55E] transition shadow-md"
                >
                  Generate 3 Alerts (+3)
                </button>
              </div>
            </form>
          </div>

          {/* Clean-up Actions Bar & Search & Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#1E2D45] bg-[#0B1220] p-1 text-xs font-bold">
              <button
                onClick={() => setFilterType('ALL')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  filterType === 'ALL'
                    ? 'bg-[#26D6A0] text-[#0B1220]'
                    : 'text-[#9BAFC4] hover:text-white'
                }`}
              >
                All Types ({dayTraderAlerts.length})
              </button>
              {(['STOP_LOSS', 'PROFIT_TARGET', 'FLAT_BY_CLOSE', 'PRICE_ABOVE', 'PRICE_BELOW'] as const).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      filterType === type
                        ? 'bg-[#26D6A0] text-[#0B1220]'
                        : 'text-[#9BAFC4] hover:text-white'
                    }`}
                  >
                    {ALERT_TYPE_LABELS[type].label}
                  </button>
                )
              )}
            </div>

            {/* Clean-up Controls (Clear Expired, Clear All, Filter) */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#9BAFC4]" />
                <input
                  type="text"
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  placeholder="Filter by ticker (e.g. SPX)..."
                  className="rounded-xl border border-[#1E2D45] bg-[#0B1220] pl-8 pr-3 py-1.5 text-xs text-white font-mono focus:border-[#26D6A0] focus:outline-none"
                />
              </div>

              {/* USER REQUEST: keep clear all alert action.. or each alert... to clean up */}
              <button
                onClick={handlePurgeExpired}
                className="flex items-center gap-1.5 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3.5 py-1.5 text-xs font-bold text-[#9BAFC4] hover:text-white hover:border-[#26D6A0]/40 transition"
                title="Prune all alerts that have exceeded their configured retention window"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Prune Expired</span>
              </button>

              {dayTraderAlerts.length > 0 && (
                <button
                  onClick={handleClearAllAlerts}
                  className="flex items-center gap-1.5 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/15 px-3.5 py-1.5 text-xs font-bold text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition shadow-sm"
                  title="Clear all alerts from the active list"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All ({dayTraderAlerts.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Alerts Table with Each-Alert Delete Trash Can */}
          <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#1E2D45] bg-[#0B1220] text-[10px] uppercase tracking-wider text-[#9BAFC4]">
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4">Alert Type</th>
                    <th className="py-3 px-4">Trigger Condition</th>
                    <th className="py-3 px-4">Target Level</th>
                    <th className="py-3 px-4">Lifespan &amp; Expiry</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Clean Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D45]/50">
                  {filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-[#9BAFC4]">
                        Zero alerts match your filter. Use the Triad Generator above or click "+ Create Alert".
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((alert) => {
                      const cfg = ALERT_TYPE_LABELS[alert.alertType] || ALERT_TYPE_LABELS.PRICE_ABOVE;
                      const Icon = cfg.icon;
                      const isExpired = new Date(alert.expiresAt).getTime() <= Date.now();

                      return (
                        <tr
                          key={alert.id}
                          className="hover:bg-[#0B1220]/60 transition cursor-pointer"
                          onClick={() => selectTradingSymbol(alert.symbol)}
                        >
                          {/* Symbol */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-[#26D6A0]">
                                {alert.symbol}
                              </span>
                              {alert.symbol === activeSymbol && (
                                <span className="rounded bg-[#26D6A0]/20 px-1.5 py-0.2 font-mono text-[9px] text-[#26D6A0]">
                                  FOCUS
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Type Badge */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 border text-[10px] font-extrabold ${cfg.bg} ${cfg.color}`}
                            >
                              <Icon className="h-3 w-3" />
                              <span>{cfg.label}</span>
                            </span>
                          </td>

                          {/* Condition */}
                          <td className="py-3 px-4 font-sans text-xs text-white">
                            <div>{alert.triggerCondition}</div>
                            {alert.notes && (
                              <div className="text-[10px] text-[#9BAFC4] mt-0.5">
                                {alert.notes}
                              </div>
                            )}
                          </td>

                          {/* Target Level */}
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {alert.targetPrice !== undefined
                              ? `$${alert.targetPrice.toFixed(2)}`
                              : '—'}
                          </td>

                          {/* Lifespan & Expiry */}
                          <td className="py-3 px-4 text-[11px]">
                            <div
                              className={`font-mono font-bold flex items-center gap-1 ${
                                isExpired ? 'text-[#EF4444]' : 'text-[#38BDF8]'
                              }`}
                            >
                              <Clock className="h-3.5 w-3.5" />
                              <span>{getExpiresTimeText(alert.expiresAt)}</span>
                            </div>
                            <span className="text-[10px] text-[#9BAFC4]">
                              {alert.retentionDays ? `${alert.retentionDays}d retention` : 'Exp'}: {new Date(alert.expiresAt).toLocaleDateString()}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${
                                alert.status === 'ACTIVE'
                                  ? 'bg-[#22C55E]/15 text-[#22C55E]'
                                  : 'bg-[#9BAFC4]/20 text-[#9BAFC4]'
                              }`}
                            >
                              {alert.status}
                            </span>
                          </td>

                          {/* Individual Alert Clean Up Action */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSingleAlert(alert.id, alert.symbol);
                              }}
                              className="rounded-lg p-1.5 text-[#9BAFC4] hover:bg-[#EF4444]/20 hover:text-[#EF4444] transition"
                              title={`Clean up and delete alert ${alert.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW TAB 2: DEVELOPER SCHEMA & QUERY EDITOR (USER REQUEST) */}
      {viewTab === 'DEV_SCHEMA_QUERY' && (
        <div className="space-y-6">
          {/* Schema Definition Card */}
          <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2D45] pb-3">
              <div className="flex items-center gap-2.5">
                <Database className="h-5 w-5 text-[#26D6A0]" />
                <h2 className="text-base font-extrabold text-white">
                  DayTraderSkillAlert Entity Schema &amp; Storage Contract
                </h2>
              </div>
              <span className="rounded bg-[#26D6A0]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                TABLE: day_trader_alerts
              </span>
            </div>

            <p className="text-xs text-[#9BAFC4] leading-relaxed">
              Standardized relational schema representation for alerts generated via <code>Jakeschincariol/day-trader-skill</code>.
              Stored client-side in persistent <code>localStorage</code> with timestamp tracking, customizable retention days, and automatic cleanup hooks.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#1E2D45] text-[10px] uppercase text-[#9BAFC4]">
                    <th className="py-2 px-3">Column Name</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Nullable</th>
                    <th className="py-2 px-3">Default / Constraint</th>
                    <th className="py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D45]/60 text-white">
                  <tr>
                    <td className="py-2 px-3 text-[#26D6A0] font-bold">id</td>
                    <td className="py-2 px-3 text-[#38BDF8]">VARCHAR(64)</td>
                    <td className="py-2 px-3 text-[#EF4444]">NO</td>
                    <td className="py-2 px-3">PRIMARY KEY</td>
                    <td className="py-2 px-3 text-[#9BAFC4]">Unique UUID / timestamp identifier</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[#26D6A0] font-bold">symbol</td>
                    <td className="py-2 px-3 text-[#38BDF8]">VARCHAR(12)</td>
                    <td className="py-2 px-3 text-[#EF4444]">NO</td>
                    <td className="py-2 px-3">UPPERCASE INDEX</td>
                    <td className="py-2 px-3 text-[#9BAFC4]">Ticker symbol (SPX, SPY, NVDA, etc.)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[#26D6A0] font-bold">alertType</td>
                    <td className="py-2 px-3 text-[#38BDF8]">ENUM</td>
                    <td className="py-2 px-3 text-[#EF4444]">NO</td>
                    <td className="py-2 px-3">'STOP_LOSS' | 'PROFIT_TARGET' | 'FLAT_BY_CLOSE' | 'PRICE_ABOVE' | 'PRICE_BELOW'</td>
                    <td className="py-2 px-3 text-[#9BAFC4]">Day-trading guardrail taxonomy</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[#26D6A0] font-bold">targetPrice</td>
                    <td className="py-2 px-3 text-[#38BDF8]">DECIMAL(12,2)</td>
                    <td className="py-2 px-3 text-[#22C55E]">YES</td>
                    <td className="py-2 px-3">NULL</td>
                    <td className="py-2 px-3 text-[#9BAFC4]">Exact threshold dollar price level</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[#26D6A0] font-bold">triggerCondition</td>
                    <td className="py-2 px-3 text-[#38BDF8]">TEXT</td>
                    <td className="py-2 px-3 text-[#EF4444]">NO</td>
                    <td className="py-2 px-3">—</td>
                    <td className="py-2 px-3 text-[#9BAFC4]">Human-readable evaluation condition</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[#26D6A0] font-bold">createdAt</td>
                    <td className="py-2 px-3 text-[#38BDF8]">TIMESTAMPTZ</td>
                    <td className="py-2 px-3 text-[#EF4444]">NO</td>
                    <td className="py-2 px-3">CURRENT_TIMESTAMP</td>
                    <td className="py-2 px-3 text-[#9BAFC4]">Creation time in ISO 8601</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[#26D6A0] font-bold">expiresAt</td>
                    <td className="py-2 px-3 text-[#38BDF8]">TIMESTAMPTZ</td>
                    <td className="py-2 px-3 text-[#EF4444]">NO</td>
                    <td className="py-2 px-3">createdAt + INTERVAL 'X DAYS'</td>
                    <td className="py-2 px-3 text-[#9BAFC4]">Configurable expiration timestamp for cleanup</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[#26D6A0] font-bold">retentionDays</td>
                    <td className="py-2 px-3 text-[#38BDF8]">INTEGER</td>
                    <td className="py-2 px-3 text-[#22C55E]">YES</td>
                    <td className="py-2 px-3">7 (Default)</td>
                    <td className="py-2 px-3 text-[#9BAFC4]">Lifespan window in days (2, 7, 14, 30, 90)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[#26D6A0] font-bold">status</td>
                    <td className="py-2 px-3 text-[#38BDF8]">VARCHAR(16)</td>
                    <td className="py-2 px-3 text-[#EF4444]">NO</td>
                    <td className="py-2 px-3">'ACTIVE'</td>
                    <td className="py-2 px-3 text-[#9BAFC4]">'ACTIVE' | 'TRIGGERED' | 'EXPIRED' | 'CANCELLED'</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Developer Query Editor */}
          <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2D45] pb-3">
              <div className="flex items-center gap-2.5">
                <Terminal className="h-5 w-5 text-[#38BDF8]" />
                <h3 className="text-base font-extrabold text-white">
                  Developer SQL &amp; JSON State Query Editor
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCustomQuery(
                      'SELECT symbol, alertType, targetPrice, status, expiresAt FROM day_trader_alerts WHERE status = "ACTIVE"'
                    )
                  }
                  className="rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1 font-mono text-[11px] text-[#9BAFC4] hover:text-white"
                >
                  Active Alerts
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCustomQuery(
                      'SELECT * FROM day_trader_alerts WHERE alertType = "STOP_LOSS"'
                    )
                  }
                  className="rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1 font-mono text-[11px] text-[#9BAFC4] hover:text-white"
                >
                  Stop Losses
                </button>
                <button
                  type="button"
                  onClick={handleExecuteQuery}
                  className="flex items-center gap-1.5 rounded-lg bg-[#26D6A0] px-3.5 py-1 font-mono text-xs font-black text-[#0B1220] hover:bg-[#22C55E]"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Execute Query</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAFC4]">
                SQL Query Console
              </label>
              <textarea
                rows={3}
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3 text-xs font-mono text-[#26D6A0] focus:border-[#26D6A0] focus:outline-none"
              />
            </div>

            {queryError && (
              <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/15 p-3 text-xs text-[#EF4444] font-mono">
                {queryError}
              </div>
            )}

            {/* Query Results Inspection */}
            {queryResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#9BAFC4]">
                  <span>Query Results ({queryResult.length} rows returned)</span>
                  <span className="font-mono text-[10px]">Execution Time: &lt; 1ms</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#1E2D45] bg-[#0B1220] max-h-80 overflow-y-auto">
                  <pre className="p-3 text-[11px] font-mono text-white leading-relaxed">
                    {JSON.stringify(queryResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Alert Creation Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border-2 border-[#26D6A0] bg-[#111C2E] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-[#1E2D45] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#26D6A0]/15 text-[#26D6A0]">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Create Custom Day-Trading Alert
                  </h3>
                  <span className="text-[10px] text-[#26D6A0] font-mono font-bold">
                    CONFIGURABLE RETENTION (&gt; 2 DAYS)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-[#9BAFC4] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9BAFC4] font-bold mb-1">Symbol</label>
                  <input
                    type="text"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[#9BAFC4] font-bold mb-1">Alert Type</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as DayTraderAlertType)}
                    className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-white font-mono font-bold"
                  >
                    <option value="PRICE_ABOVE">Price Above</option>
                    <option value="PRICE_BELOW">Price Below</option>
                    <option value="STOP_LOSS">Stop Loss</option>
                    <option value="PROFIT_TARGET">Profit Target</option>
                    <option value="FLAT_BY_CLOSE">Flat By Close</option>
                    <option value="OPENING_BELL">Opening Bell</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9BAFC4] font-bold mb-1">
                    Trigger Price Level ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-[#26D6A0] font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[#38BDF8] font-bold mb-1">
                    Retention Lifespan
                  </label>
                  <select
                    value={customRetentionDays}
                    onChange={(e) => setCustomRetentionDays(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#38BDF8]/40 bg-[#0B1220] px-3 py-2 text-[#38BDF8] font-mono font-bold"
                  >
                    <option value={2}>2 Days (48h)</option>
                    <option value={7}>7 Days (1 Week)</option>
                    <option value={14}>14 Days (2 Weeks)</option>
                    <option value={30}>30 Days (1 Month)</option>
                    <option value={90}>90 Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#9BAFC4] font-bold mb-1">
                  Custom Trigger Note (Optional)
                </label>
                <input
                  type="text"
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  placeholder="e.g. Breakout above 15m high"
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E2D45]">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="rounded-xl border border-[#1E2D45] bg-[#0B1220] px-4 py-2 font-bold text-[#9BAFC4] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#26D6A0] px-5 py-2 font-black text-[#0B1220] hover:bg-[#22C55E]"
                >
                  Create Alert ({customRetentionDays}d Lifespan)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default GithubAlertsPage;
