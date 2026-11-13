import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AuditLogEntry,
  BrainFogLevel,
  DailyProfitRecord,
  DayTraderSkillAlert,
  DayTraderAlertType,
  DisciplineCheckInLog,
  DisciplineMood,
  EntryRuleConfig,
  ExitRuleConfig,
  FillModel,
  JournalEntry,
  MarketSnapshot,
  MarketStatus,
  MonitoringAction,
  NavigationSection,
  NotificationItem,
  OptionContract,
  OrderSide,
  OrderType,
  PaperAccount,
  PaperExecution,
  PaperOrder,
  PaperPosition,
  PaperPositionLeg,
  RiskSettings,
  SignalType,
  StrategyCode,
  StrategyLeg,
  TradingPermissionMode,
  TradingSignal,
} from '../types/trading';
import {
  analyzeStrategy,
  buildStrategyLegs,
  calculateBlackScholesGreeks,
  determineMoneyness,
  generateSpxOptionsChain,
  getNearestAtmStrike,
  getStrategyDefinition,
} from '../lib/optionsEngine';
import { generateSimulatedMarketTick } from '../lib/marketDataAdapter';
import {
  AutomationEventRecord,
  clearExecutionLocks,
  evaluateAutomationCycle,
  getActiveExecutionLocks,
} from '../lib/automationWorker';
import { parseRobinhoodHistoryExport } from '../lib/robinhoodMcpClient';

interface PlacePaperOrderInput {
  accountId: string;
  strategyCode: StrategyCode;
  strategyName: string;
  legs: StrategyLeg[];
  contracts: number;
  orderType: OrderType;
  limitPrice?: number;
  simulatePartialFill?: boolean;
  entryReason?: string;
  profitTargetPct?: number;
  stopLossPct?: number;
  trailingStopPct?: number;
}

interface TradingContextValue {
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  activeSymbol: string;
  selectTradingSymbol: (sym: string) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  textScale: 'compact' | 'medium' | 'large';
  setTextScale: (scale: 'compact' | 'medium' | 'large') => void;
  operatorEmail: string;
  setOperatorEmail: (email: string) => void;

  // Market & Options Chain
  market: MarketSnapshot;
  autoStreamEnabled: boolean;
  setAutoStreamEnabled: (enabled: boolean) => void;
  isQuoteStale: boolean;
  setIsQuoteStale: (stale: boolean) => void;
  selectedExpiration: string;
  setSelectedExpiration: (exp: string) => void;
  optionsChain: OptionContract[];
  simulateMarketMove: (spotDelta: number, vixDelta?: number) => void;
  setMarketStatusOverride: (status: MarketStatus) => void;

  // Strategy Lab Builder State
  selectedStrategyCode: StrategyCode;
  setSelectedStrategyCode: (code: StrategyCode) => void;
  customBuilderLegs: StrategyLeg[];
  setCustomBuilderLegs: React.Dispatch<React.SetStateAction<StrategyLeg[]>>;
  addContractToBuilder: (contract: OptionContract, side: OrderSide) => void;
  clearBuilderLegs: () => void;

  // Paper Accounts & Engine
  paperAccounts: PaperAccount[];
  activeAccountId: string;
  setActiveAccountId: (id: string) => void;
  activeAccount: PaperAccount;
  createPaperAccount: (
    name: string,
    initialCapital: number,
    fillModel: FillModel
  ) => void;
  updateAccountSettings: (
    accountId: string,
    updates: Partial<Pick<PaperAccount, 'fillModel' | 'commissionPerContract' | 'slippagePerContract'>>
  ) => void;
  positions: PaperPosition[];
  orders: PaperOrder[];
  executions: PaperExecution[];
  placePaperOrder: (input: PlacePaperOrderInput) => {
    success: boolean;
    message: string;
    order?: PaperOrder;
  };
  closePaperPosition: (
    positionId: string,
    fraction: 0.5 | 1,
    exitReason?: string
  ) => void;
  performPositionMonitoringAction: (
    positionId: string,
    action: MonitoringAction
  ) => void;
  fillPendingOrder: (orderId: string) => void;
  cancelPendingOrder: (orderId: string) => void;

  // Entry, Exit, Risk Rules & Automation Worker
  entryConfig: EntryRuleConfig;
  setEntryConfig: React.Dispatch<React.SetStateAction<EntryRuleConfig>>;
  exitConfig: ExitRuleConfig;
  setExitConfig: React.Dispatch<React.SetStateAction<ExitRuleConfig>>;
  riskSettings: RiskSettings;
  setRiskSettings: React.Dispatch<React.SetStateAction<RiskSettings>>;
  triggerEmergencyKillSwitch: () => void;
  resetKillSwitch: () => void;
  authorizeCloseAllPositions: () => void;
  automationEvents: AutomationEventRecord[];
  activeLocks: string[];
  runAutomationEvaluationPass: (autoExecuteExits?: boolean) => void;
  resetAutomationLocks: () => void;

  // Signals, Journal, Notifications, Audit Logs, Permissions
  signals: TradingSignal[];
  simulateTradingViewWebhook: (
    signalType: SignalType,
    strategyCode: StrategyCode,
    validSecret?: boolean
  ) => void;
  journalEntries: JournalEntry[];
  addManualJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  adjustAccountBalance: (
    accountId: string,
    deltaUsd: number,
    reason: string
  ) => void;
  dailyProfitRecords: DailyProfitRecord[];
  upsertDailyProfitRecord: (
    record: Omit<DailyProfitRecord, 'id' | 'updatedAt'>
  ) => void;
  deleteDailyProfitRecord: (id: string) => void;

  // Discipline & 10-Minute Mindfulness Check-In System
  disciplineLogs: DisciplineCheckInLog[];
  addDisciplineCheckIn: (
    entry: Omit<DisciplineCheckInLog, 'id' | 'timestamp' | 'tradeDate'>
  ) => void;
  deleteDisciplineCheckIn: (id: string) => void;
  checkInIntervalMinutes: number;
  setCheckInIntervalMinutes: (mins: number) => void;
  secondsUntilCheckIn: number;
  checkInTimerActive: boolean;
  setCheckInTimerActive: (active: boolean) => void;
  checkInAlertDue: boolean;
  acknowledgeCheckInAlert: () => void;
  openMindsetCheckInModal: () => void;
  isRegularMarketOpen: () => boolean;
  dailyAllowanceUsd: number;
  setDailyAllowanceUsd: (usd: number) => void;
  remainingDailyAllowanceUsd: number;

  importCsvExecutions: (csvText: string) => {
    importedTrades: number;
    reconstructedMultiLeg: number;
    errors: string[];
  };
  importRobinhoodHistoryJson: (jsonText: string) => {
    importedCount: number;
    error?: string;
  };

  // GitHub Day Trader Skill Alerts (Jakeschincariol/day-trader-skill)
  dayTraderAlerts: DayTraderSkillAlert[];
  totalAlertsCreatedCount: number;
  addDayTraderAlert: (alertInput: Omit<DayTraderSkillAlert, 'id' | 'createdAt' | 'expiresAt' | 'status' | 'sourceSkill'> & { retentionDays?: number }) => void;
  createTradePlanAlertTriad: (symbol: string, stopPrice: number, targetPrice: number, closeTimeEt?: string, retentionDays?: number) => void;
  deleteDayTraderAlert: (id: string) => void;
  clearExpiredAlerts: () => number;
  clearAllDayTraderAlerts: () => void;

  notifications: NotificationItem[];
  markAllNotificationsRead: () => void;
  auditLogs: AuditLogEntry[];
  permissionMode: TradingPermissionMode;
  setPermissionMode: (mode: TradingPermissionMode) => void;
  liveTradingAuthorized: boolean;
  setLiveTradingAuthorized: (auth: boolean) => void;
  displayTimezone: string;
  setDisplayTimezone: (tz: string) => void;
}

const STORAGE_KEY = 'tradepilot_command_center_v2';

const INITIAL_INTRADAY_SERIES: {
  time: string;
  spx: number;
  vwap: number;
  vix: number;
}[] = [];

const INITIAL_ACCOUNTS: PaperAccount[] = [
  {
    id: 'acc-primary-0dte',
    name: 'SPX 0DTE Primary Paper ($25k)',
    initialCapital: 25000,
    cashBalance: 25000,
    buyingPower: 25000,
    realizedPnl: 0,
    unrealizedPnl: 0,
    fillModel: 'MIDPOINT',
    commissionPerContract: 0.65,
    slippagePerContract: 0.1,
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-condor-income',
    name: 'SPX Defined-Risk Credit Desk ($50k)',
    initialCapital: 50000,
    cashBalance: 50000,
    buyingPower: 50000,
    realizedPnl: 0,
    unrealizedPnl: 0,
    fillModel: 'SLIPPAGE_ADJUSTED',
    commissionPerContract: 0.65,
    slippagePerContract: 0.15,
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_JOURNAL: JournalEntry[] = [];

const INITIAL_POSITIONS: PaperPosition[] = [];

const TradingContext = createContext<TradingContextValue | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeSection, setActiveSection] =
    useState<NavigationSection>('dashboard');
  const [activeSymbol, setActiveSymbol] = useState<string>('SPX');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem('tradepilot_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    } catch {
      // Ignore storage access errors
    }
    return 'dark';
  });
  const [textScale, setTextScale] = useState<'compact' | 'medium' | 'large'>(
    () => {
      try {
        const savedScale = localStorage.getItem('tradepilot_text_scale');
        if (
          savedScale === 'compact' ||
          savedScale === 'medium' ||
          savedScale === 'large'
        ) {
          return savedScale;
        }
      } catch {
        // Ignore storage access errors
      }
      return 'medium';
    }
  );
  const [operatorEmail, setOperatorEmail] = useState<string>(
    'trader@tradepilot.local'
  );
  const [displayTimezone, setDisplayTimezone] = useState<string>(
    'America/Los_Angeles'
  );
  const [autoStreamEnabled, setAutoStreamEnabled] = useState<boolean>(false);
  const [isQuoteStale, setIsQuoteStale] = useState<boolean>(false);
  const [selectedExpiration, setSelectedExpiration] =
    useState<string>('2026-11-10');

  // Market State (Initialized with Real Live SPX Quote, dynamic for any symbol)
  const [market, setMarket] = useState<MarketSnapshot>({
    symbol: 'SPX',
    spotPrice: 7520.93,
    dailyChange: -29.01,
    dailyChangePct: -0.38,
    vix: 19.46,
    vixChangePct: 1.25,
    vwap: 7525.4,
    ema9: 7524.2,
    ema21: 7528.8,
    rsi14: 48.2,
    openingRangeHigh: 7545.0,
    openingRangeLow: 7515.2,
    atmStrike: 7520,
    marketStatus: 'OPEN',
    dataSource: 'POLYGON',
    isSimulated: false,
    lastUpdated: new Date().toISOString(),
    intradaySeries: INITIAL_INTRADAY_SERIES,
  });

  // Real Live Market Data Fetcher for any selected symbol (SPX, SPY, QQQ, NVDA, AAPL, TSLA, etc.)
  const fetchRealMarketData = async (sym: string) => {
    try {
      // 1. Try local or Netlify backend market-data proxy
      const res = await fetch(
        `/.netlify/functions/market-data?symbol=${encodeURIComponent(sym)}`
      );
      if (res.ok) {
        const d = await res.json();
        if (d.spotPrice > 0) {
          setMarket((prev) => ({
            ...prev,
            symbol: d.symbol || sym,
            spotPrice: d.spotPrice,
            dailyChange: d.dailyChange,
            dailyChangePct: d.dailyChangePct,
            vix: d.vix || prev.vix,
            vixChangePct: d.vixChangePct || prev.vixChangePct,
            vwap: d.vwap || d.spotPrice,
            ema9: d.ema9 || d.spotPrice,
            ema21: d.ema21 || d.spotPrice,
            rsi14: d.rsi14 || prev.rsi14,
            openingRangeHigh: d.openingRangeHigh || d.spotPrice,
            openingRangeLow: d.openingRangeLow || d.spotPrice,
            atmStrike: getNearestAtmStrike(d.spotPrice),
            dataSource: 'POLYGON',
            isSimulated: false,
            lastUpdated: d.lastUpdated || new Date().toISOString(),
            intradaySeries:
              Array.isArray(d.intradaySeries) && d.intradaySeries.length > 0
                ? d.intradaySeries
                : prev.intradaySeries,
          }));
          return;
        }
      }
    } catch {
      // Fallback to direct public CBOE delayed quote API
    }

    try {
      const cboeSym = sym === 'SPX' ? '_SPX' : sym;
      const cboeRes = await fetch(
        `https://cdn.cboe.com/api/global/delayed_quotes/quotes/${encodeURIComponent(
          cboeSym
        )}.json`
      );
      if (cboeRes.ok) {
        const j = await cboeRes.json();
        const d = j.data;
        if (d && d.current_price > 0) {
          setMarket((prev) => ({
            ...prev,
            symbol: sym,
            spotPrice: d.current_price,
            dailyChange: d.price_change,
            dailyChangePct: d.price_change_percent,
            atmStrike: getNearestAtmStrike(d.current_price),
            dataSource: 'POLYGON',
            isSimulated: false,
            lastUpdated: new Date().toISOString(),
          }));
        }
      }
    } catch {
      // Fallback
    }
  };

  const selectTradingSymbol = (sym: string) => {
    const clean = sym.trim().toUpperCase();
    setActiveSymbol(clean);
    fetchRealMarketData(clean);
  };

  // Poll real live market quotes every 15 seconds
  useEffect(() => {
    fetchRealMarketData(activeSymbol);
    const interval = setInterval(() => {
      fetchRealMarketData(activeSymbol);
    }, 15000);
    return () => clearInterval(interval);
  }, [activeSymbol]);

  // Generate Options Chain dynamically from current real spot & IV & activeSymbol
  const optionsChain = useMemo(
    () =>
      generateSpxOptionsChain(
        market.spotPrice,
        market.vix,
        selectedExpiration,
        activeSymbol
      ),
    [market.spotPrice, market.vix, selectedExpiration, activeSymbol]
  );

  // Strategy Lab Builder State
  const [selectedStrategyCode, setSelectedStrategyCode] =
    useState<StrategyCode>('BULL_CALL_DEBIT_SPREAD');
  const [customBuilderLegs, setCustomBuilderLegs] = useState<StrategyLeg[]>([]);

  // Paper Trading State
  const [paperAccounts, setPaperAccounts] =
    useState<PaperAccount[]>(INITIAL_ACCOUNTS);
  const [activeAccountId, setActiveAccountId] = useState<string>(
    INITIAL_ACCOUNTS[0].id
  );
  const [positions, setPositions] =
    useState<PaperPosition[]>(INITIAL_POSITIONS);
  const [orders, setOrders] = useState<PaperOrder[]>([]);
  const [executions, setExecutions] = useState<PaperExecution[]>([]);

  // Entry, Exit, Risk Rules & Automation Events
  const [entryConfig, setEntryConfig] = useState<EntryRuleConfig>({
    triggerType: 'MARKET_AFTER_TIME',
    marketOpenEt: '09:30',
    evaluationTimeEt: '09:35',
    entryCutoffEt: '14:30',
    timezone: 'America/New_York',
    strikeSelection: 'ATM',
    targetDelta: 0.5,
    defaultContracts: 2,
    limitPriceOffset: 0.1,
  });

  const [exitConfig, setExitConfig] = useState<ExitRuleConfig>({
    profitTargetEnabled: true,
    profitTargetPct: 30,
    stopLossEnabled: true,
    stopLossPct: 20,
    trailingStopEnabled: true,
    trailingStopPct: 12,
    breakevenStopEnabled: true,
    breakevenTriggerPct: 15,
    timeBasedExitEnabled: true,
    maxHoldMinutes: 120,
    reviewIntervalMinutes: 30,
    reviewIntervalAction: 'REVIEW',
    eodForceCloseEnabled: true,
    eodForceCloseTimeEt: '15:45',
    tradingViewReversalExit: true,
  });

  const [riskSettings, setRiskSettings] = useState<RiskSettings>({
    maxDailyLoss: 1000,
    maxRiskPerTrade: 1500,
    maxTradesPerDay: 6,
    maxSimultaneousPositions: 4,
    maxContractsPerTrade: 5,
    maxPortfolioExposurePct: 30,
    maxBidAskSpread: 1.5,
    maxSlippage: 0.35,
    minVolume: 100,
    minOpenInterest: 250,
    entryCutoffEt: '14:45',
    maxHoldingDurationMin: 180,
    reEntryCooldownMin: 15,
    staleQuoteThresholdSec: 30,
    killSwitchActive: false,
  });

  const [automationEvents, setAutomationEvents] = useState<
    AutomationEventRecord[]
  >([]);
  const [activeLocks, setActiveLocks] = useState<string[]>([]);

  const [signals, setSignals] = useState<TradingSignal[]>([]);

  const [journalEntries, setJournalEntries] =
    useState<JournalEntry[]>(INITIAL_JOURNAL);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [permissionMode, setPermissionMode] =
    useState<TradingPermissionMode>('PAPER');
  const [liveTradingAuthorized, setLiveTradingAuthorized] =
    useState<boolean>(false);

  // Daily Profit & Manual Adjustment Records
  const [dailyProfitRecords, setDailyProfitRecords] = useState<
    DailyProfitRecord[]
  >([]);

  // Discipline & 10-Minute Check-In State
  const [dailyAllowanceUsd, setDailyAllowanceUsd] = useState<number>(500);
  const [checkInIntervalMinutes, setCheckInIntervalMinutes] =
    useState<number>(10);
  const [secondsUntilCheckIn, setSecondsUntilCheckIn] = useState<number>(600);
  const [checkInTimerActive, setCheckInTimerActive] = useState<boolean>(true);
  const [checkInAlertDue, setCheckInAlertDue] = useState<boolean>(false);

  const [disciplineLogs, setDisciplineLogs] = useState<DisciplineCheckInLog[]>([]);

  // GitHub Day Trader Skill Alerts State (Jakeschincariol/day-trader-skill)
  // Tracks created alerts and automatically purges alerts when their retention window passes (configurable > 2 days)
  const [totalAlertsCreatedCount, setTotalAlertsCreatedCount] = useState<number>(0);
  const [dayTraderAlerts, setDayTraderAlerts] = useState<DayTraderSkillAlert[]>([]);

  // Helper to determine if currently inside US Regular Market Open Hours (9:30 AM - 4:00 PM ET / 6:30 AM - 1:00 PM PT, Mon-Fri)
  const isRegularMarketOpen = (): boolean => {
    if (market.marketStatus === 'OPEN') return true;
    if (
      market.marketStatus === 'CLOSED' ||
      market.marketStatus === 'PRE-MARKET' ||
      market.marketStatus === 'AFTER-HOURS'
    ) {
      return false;
    }
    const now = new Date();
    const dayStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
    }).format(now);
    const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(dayStr);
    if (!isWeekday) return false;

    const timeOnly = now.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const [h, m] = timeOnly.split(':').map(Number);
    const etMinutes = (h || 0) * 60 + (m || 0);

    // US Regular market open: 9:30 AM ET (570) to 4:00 PM ET (960)
    return etMinutes >= 570 && etMinutes < 960;
  };

  // 10-Minute Check-In Countdown Interval
  useEffect(() => {
    if (!checkInTimerActive) return;
    const timer = setInterval(() => {
      setSecondsUntilCheckIn((prev) => {
        if (prev <= 1) {
          // USER CONSTRAINT: Popup to remind to capture mindset details works during regular market open hours only!
          if (isRegularMarketOpen()) {
            setCheckInAlertDue(true);
          }
          return checkInIntervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [checkInTimerActive, checkInIntervalMinutes, market.marketStatus]);

  const acknowledgeCheckInAlert = () => {
    setCheckInAlertDue(false);
    setSecondsUntilCheckIn(checkInIntervalMinutes * 60);
  };

  const openMindsetCheckInModal = () => {
    setCheckInAlertDue(true);
  };

  // Load persisted state if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.paperAccounts) setPaperAccounts(parsed.paperAccounts);
        if (parsed.positions) setPositions(parsed.positions);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.journalEntries) setJournalEntries(parsed.journalEntries);
        if (parsed.riskSettings) setRiskSettings(parsed.riskSettings);
        if (parsed.dailyProfitRecords)
          setDailyProfitRecords(parsed.dailyProfitRecords);
        if (parsed.disciplineLogs) setDisciplineLogs(parsed.disciplineLogs);
        if (typeof parsed.dailyAllowanceUsd === 'number')
          setDailyAllowanceUsd(parsed.dailyAllowanceUsd);
        if (Array.isArray(parsed.dayTraderAlerts))
          setDayTraderAlerts(parsed.dayTraderAlerts);
        if (typeof parsed.totalAlertsCreatedCount === 'number')
          setTotalAlertsCreatedCount(parsed.totalAlertsCreatedCount);
      }
    } catch {
      // Ignore storage parse error
    }
  }, []);

  // Persist key state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          paperAccounts,
          positions,
          orders,
          journalEntries,
          riskSettings,
          dailyProfitRecords,
          disciplineLogs,
          dailyAllowanceUsd,
          dayTraderAlerts,
          totalAlertsCreatedCount,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [
    paperAccounts,
    positions,
    orders,
    journalEntries,
    riskSettings,
    dailyProfitRecords,
    disciplineLogs,
    dailyAllowanceUsd,
    dayTraderAlerts,
    totalAlertsCreatedCount,
  ]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    try {
      localStorage.setItem('tradepilot_theme', theme);
    } catch {
      // Ignore storage error
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('scale-compact', 'scale-medium', 'scale-large');
    root.classList.add(`scale-${textScale}`);
    try {
      localStorage.setItem('tradepilot_text_scale', textScale);
    } catch {
      // Ignore storage error
    }
  }, [textScale]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const pushNotification = (
    type: NotificationItem['type'],
    severity: NotificationItem['severity'],
    title: string,
    message: string
  ) => {
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        severity,
        title,
        message,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        read: false,
      },
      ...prev,
    ]);
  };

  const pushAudit = (
    category: AuditLogEntry['category'],
    severity: AuditLogEntry['severity'],
    action: string,
    details: string
  ) => {
    setAuditLogs((prev) => [
      {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        category,
        severity,
        action,
        details,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const activeAccount = useMemo(
    () =>
      paperAccounts.find((a) => a.id === activeAccountId) || paperAccounts[0],
    [paperAccounts, activeAccountId]
  );

  // Simulate Market Move & Dynamically Revalue Open Paper Positions + Evaluate Exit Rules
  const simulateMarketMove = (spotDelta: number, vixDelta = 0) => {
    const newSpot = Number((market.spotPrice + spotDelta).toFixed(2));
    const newVix = Number(Math.max(9.5, market.vix + vixDelta).toFixed(2));
    const baseOpen = 5966.5;
    const dailyChange = Number((newSpot - baseOpen).toFixed(2));
    const dailyChangePct = Number(((dailyChange / baseOpen) * 100).toFixed(2));
    const newVwap = Number((market.vwap + spotDelta * 0.35).toFixed(2));
    const timeLabel = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    setMarket((prev) => ({
      ...prev,
      spotPrice: newSpot,
      dailyChange,
      dailyChangePct,
      vix: newVix,
      vwap: newVwap,
      ema9: Number((prev.ema9 + spotDelta * 0.5).toFixed(2)),
      ema21: Number((prev.ema21 + spotDelta * 0.25).toFixed(2)),
      rsi14: Number(
        Math.min(85, Math.max(20, prev.rsi14 + spotDelta * 0.8)).toFixed(1)
      ),
      atmStrike: getNearestAtmStrike(newSpot),
      lastUpdated: new Date().toISOString(),
      intradaySeries: [
        ...prev.intradaySeries.slice(-14),
        { time: timeLabel, spx: newSpot, vwap: newVwap, vix: newVix },
      ],
    }));

    // Re-mark all open positions using Black-Scholes & check automated exit triggers
    setPositions((prevPositions) => {
      let totalAccountUnrealized = 0;

      const updated = prevPositions.map((pos) => {
        let currentSignedSpreadPts = 0;
        const updatedLegs = pos.legs.map((leg) => {
          const bs = calculateBlackScholesGreeks(
            newSpot,
            leg.strike,
            0,
            newVix / 100,
            leg.optionType
          );
          const dir =
            leg.side === 'BUY_TO_OPEN' || leg.side === 'BUY_TO_CLOSE' ? 1 : -1;
          currentSignedSpreadPts += dir * bs.theoPrice * leg.ratio;

          return {
            ...leg,
            currentMark: bs.theoPrice,
            delta: bs.delta,
            gamma: bs.gamma,
            theta: bs.theta,
            vega: bs.vega,
          };
        });

        const currentMark = Number(
          Math.abs(currentSignedSpreadPts).toFixed(2)
        );
        const pnlPoints = pos.isCredit
          ? pos.avgEntryPremium - currentMark
          : currentMark - pos.avgEntryPremium;
        const unrealizedPnl = Number(
          (pnlPoints * 100 * pos.quantity - pos.feesPaid).toFixed(2)
        );
        const denominator = pos.isCredit
          ? pos.maxRiskUsd
          : Math.max(100, pos.totalEntryCostUsd);
        const unrealizedPnlPct = Number(
          ((unrealizedPnl / denominator) * 100).toFixed(2)
        );

        if (pos.accountId === activeAccountId) {
          totalAccountUnrealized += unrealizedPnl;
        }

        // Notify if profit target or stop loss threshold crossed
        if (
          exitConfig.profitTargetEnabled &&
          unrealizedPnlPct >= pos.profitTargetPct
        ) {
          pushNotification(
            'PROFIT_TARGET',
            'SUCCESS',
            `Profit Target Reached (+${unrealizedPnlPct}%)`,
            `${pos.strategyName} (${pos.quantity}x) reached +${unrealizedPnlPct}% ($${unrealizedPnl.toFixed(2)}). Ready for exit execution.`
          );
        } else if (
          exitConfig.stopLossEnabled &&
          unrealizedPnlPct <= -pos.stopLossPct
        ) {
          pushNotification(
            'STOP_LOSS',
            'WARNING',
            `Stop Loss Threshold Hit (${unrealizedPnlPct}%)`,
            `${pos.strategyName} (${pos.quantity}x) is at ${unrealizedPnlPct}% ($${unrealizedPnl.toFixed(2)}).`
          );
        }

        return {
          ...pos,
          legs: updatedLegs,
          currentMark,
          unrealizedPnl,
          unrealizedPnlPct,
          highWaterMarkPnlPct: Math.max(
            pos.highWaterMarkPnlPct,
            unrealizedPnlPct
          ),
        };
      });

      setPaperAccounts((accs) =>
        accs.map((a) =>
          a.id === activeAccountId
            ? { ...a, unrealizedPnl: Number(totalAccountUnrealized.toFixed(2)) }
            : a
        )
      );

      return updated;
    });
  };

  // Phase 3 Real-Time Simulated Auto-Tick Streamer
  useEffect(() => {
    if (!autoStreamEnabled || isQuoteStale) return;
    const timer = setInterval(() => {
      const { spotDelta, vixDelta } = generateSimulatedMarketTick(market);
      simulateMarketMove(spotDelta, vixDelta);
    }, 2500);
    return () => clearInterval(timer);
  });

  const setMarketStatusOverride = (status: MarketStatus) => {
    setMarket((prev) => ({ ...prev, marketStatus: status }));
  };

  const addContractToBuilder = (contract: OptionContract, side: OrderSide) => {
    setCustomBuilderLegs((prev) => {
      const existingIdx = prev.findIndex(
        (l) => l.contract.occSymbol === contract.occSymbol
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          side,
          entryPrice: contract.midpoint,
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: `${contract.occSymbol}_${side}_${Date.now()}`,
          contract,
          side,
          ratio: 1,
          contracts: 1,
          entryPrice: contract.midpoint,
        },
      ];
    });
  };

  const clearBuilderLegs = () => setCustomBuilderLegs([]);

  const createPaperAccount = (
    name: string,
    initialCapital: number,
    fillModel: FillModel
  ) => {
    const newAcc: PaperAccount = {
      id: `acc-${Date.now()}`,
      name,
      initialCapital,
      cashBalance: initialCapital,
      buyingPower: initialCapital,
      realizedPnl: 0,
      unrealizedPnl: 0,
      fillModel,
      commissionPerContract: 0.65,
      slippagePerContract: 0.1,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    setPaperAccounts((prev) => [...prev, newAcc]);
    setActiveAccountId(newAcc.id);
    pushAudit(
      'SETTINGS',
      'INFO',
      'PAPER_ACCOUNT_CREATED',
      `Created paper account "${name}" with $${initialCapital.toLocaleString()} virtual capital.`
    );
  };

  const updateAccountSettings = (
    accountId: string,
    updates: Partial<
      Pick<
        PaperAccount,
        'fillModel' | 'commissionPerContract' | 'slippagePerContract'
      >
    >
  ) => {
    setPaperAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, ...updates } : acc))
    );
  };

  // Core Paper Order Execution Engine with Risk & Buying Power Validation
  const placePaperOrder = (input: PlacePaperOrderInput) => {
    const account =
      paperAccounts.find((a) => a.id === input.accountId) || activeAccount;

    if (riskSettings.killSwitchActive) {
      const reason =
        'REJECTED: Emergency Kill Switch is active. All new entries are blocked.';
      pushNotification(
        'ORDER_REJECTED',
        'CRITICAL',
        'Order Rejected by Kill Switch',
        reason
      );
      pushAudit('RISK', 'CRITICAL', 'ORDER_BLOCKED_KILL_SWITCH', reason);
      return { success: false, message: reason };
    }

    if (isQuoteStale) {
      const reason =
        'REJECTED: Market quotes are flagged STALE (>30s). Stale-data protection blocked entry.';
      pushNotification(
        'MARKET_DATA_STALE',
        'WARNING',
        'Stale Quote Protection Triggered',
        reason
      );
      pushAudit('RISK', 'WARN', 'ORDER_BLOCKED_STALE_DATA', reason);
      return { success: false, message: reason };
    }

    if (input.contracts > riskSettings.maxContractsPerTrade) {
      const reason = `REJECTED: Requested ${input.contracts} contracts exceeds Max Contracts per Trade (${riskSettings.maxContractsPerTrade}).`;
      pushNotification(
        'ORDER_REJECTED',
        'WARNING',
        'Risk Limit Exceeded',
        reason
      );
      return { success: false, message: reason };
    }

    if (positions.length >= riskSettings.maxSimultaneousPositions) {
      const reason = `REJECTED: Open positions (${positions.length}) reached Max Simultaneous Positions limit (${riskSettings.maxSimultaneousPositions}).`;
      pushNotification(
        'ORDER_REJECTED',
        'WARNING',
        'Position Limit Reached',
        reason
      );
      return { success: false, message: reason };
    }

    const analysis = analyzeStrategy(
      input.strategyCode,
      input.legs,
      market.spotPrice,
      input.contracts,
      account.buyingPower,
      account.commissionPerContract,
      account.slippagePerContract
    );

    if (!analysis.buyingPowerValid) {
      pushNotification(
        'ORDER_REJECTED',
        'WARNING',
        'Buying Power Validation Failed',
        analysis.buyingPowerMessage
      );
      pushAudit(
        'RISK',
        'WARN',
        'BUYING_POWER_REJECTED',
        analysis.buyingPowerMessage
      );
      return { success: false, message: analysis.buyingPowerMessage };
    }

    if (analysis.maxLoss > riskSettings.maxRiskPerTrade) {
      const reason = `REJECTED: Strategy max risk ($${analysis.maxLoss.toFixed(2)}) exceeds Max Risk Per Trade ($${riskSettings.maxRiskPerTrade}).`;
      pushNotification(
        'ORDER_REJECTED',
        'WARNING',
        'Max Risk Per Trade Exceeded',
        reason
      );
      pushAudit('RISK', 'WARN', 'MAX_RISK_EXCEEDED', reason);
      return { success: false, message: reason };
    }

    let fillPricePerSpread = analysis.netPremiumPerSpread;
    if (account.fillModel === 'NATURAL_BID_ASK') {
      fillPricePerSpread = Number(
        (
          analysis.netPremiumPerSpread +
          (analysis.isCredit ? -0.15 : 0.15) * input.legs.length
        ).toFixed(2)
      );
    } else if (account.fillModel === 'SLIPPAGE_ADJUSTED') {
      fillPricePerSpread = Number(
        (
          analysis.netPremiumPerSpread +
          (analysis.isCredit ? -1 : 1) *
            account.slippagePerContract *
            input.legs.length
        ).toFixed(2)
      );
    }
    fillPricePerSpread = Math.max(0.05, fillPricePerSpread);

    const isPendingLimit =
      input.orderType === 'LIMIT' &&
      input.limitPrice !== undefined &&
      ((!analysis.isCredit && input.limitPrice < fillPricePerSpread) ||
        (analysis.isCredit && input.limitPrice > fillPricePerSpread));

    const filledQty = isPendingLimit
      ? 0
      : input.simulatePartialFill && input.contracts > 1
        ? Math.ceil(input.contracts / 2)
        : input.contracts;

    const orderStatus: PaperOrder['status'] = isPendingLimit
      ? 'PENDING'
      : filledQty < input.contracts
        ? 'PARTIALLY_FILLED'
        : 'FILLED';

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const posLegs: PaperPositionLeg[] = input.legs.map((l) => ({
      occSymbol: l.contract.occSymbol,
      optionType: l.contract.optionType,
      strike: l.contract.strike,
      expirationDate: l.contract.expirationDate,
      side: l.side,
      ratio: l.ratio,
      entryPrice: l.entryPrice,
      currentMark: l.contract.midpoint,
      delta: l.contract.delta,
      gamma: l.contract.gamma,
      theta: l.contract.theta,
      vega: l.contract.vega,
    }));

    const legsSummary = input.legs
      .map(
        (l) =>
          `${l.side.startsWith('BUY') ? 'BUY' : 'SELL'} ${filledQty || input.contracts}x ${l.contract.strike}${l.contract.optionType[0]} @ $${l.entryPrice.toFixed(2)}`
      )
      .join(' / ');

    const newOrder: PaperOrder = {
      id: orderId,
      accountId: account.id,
      strategyCode: input.strategyCode,
      strategyName: input.strategyName,
      orderType: input.orderType,
      action: 'OPEN',
      status: orderStatus,
      isCredit: analysis.isCredit,
      requestedQty: input.contracts,
      filledQty,
      limitPrice: input.limitPrice,
      naturalMidpoint: analysis.netPremiumPerSpread,
      filledAvgPrice: isPendingLimit ? undefined : fillPricePerSpread,
      fillModelUsed: account.fillModel,
      fees: analysis.estimatedFees,
      slippage: analysis.estimatedSlippage,
      legsSummary,
      legs: posLegs,
      isSimulated: true,
      submittedAt: nowIso,
      executedAt: isPendingLimit ? undefined : nowIso,
    };

    setOrders((prev) => [newOrder, ...prev]);

    if (!isPendingLimit && filledQty > 0) {
      const newExecs: PaperExecution[] = input.legs.map((leg, idx) => ({
        id: `EXEC-${Date.now()}-${idx}`,
        orderId,
        accountId: account.id,
        occSymbol: leg.contract.occSymbol,
        side: leg.side,
        fillQty: filledQty * leg.ratio,
        fillPrice: leg.entryPrice,
        fee: Number(
          (filledQty * leg.ratio * account.commissionPerContract).toFixed(2)
        ),
        slippage: Number(
          (filledQty * leg.ratio * account.slippagePerContract * 100).toFixed(2)
        ),
        fillModel: account.fillModel,
        isSimulated: true,
        executedAt: nowIso,
      }));
      setExecutions((prev) => [...newExecs, ...prev]);

      const totalEntryCostUsd = Number(
        (
          fillPricePerSpread * 100 * filledQty +
          analysis.estimatedFees
        ).toFixed(2)
      );

      const newPos: PaperPosition = {
        id: `pos-${Date.now()}`,
        accountId: account.id,
        strategyCode: input.strategyCode,
        strategyName: input.strategyName,
        underlyingSymbol: 'SPX',
        isCredit: analysis.isCredit,
        quantity: filledQty,
        legs: posLegs,
        avgEntryPremium: fillPricePerSpread,
        currentMark: analysis.netPremiumPerSpread,
        totalEntryCostUsd,
        maxRiskUsd: analysis.maxLoss,
        maxRewardUsd: analysis.maxProfit,
        unrealizedPnl: Number((-analysis.estimatedFees).toFixed(2)),
        unrealizedPnlPct: -0.2,
        feesPaid: analysis.estimatedFees,
        slippageIncurred: analysis.estimatedSlippage,
        profitTargetPct: input.profitTargetPct ?? exitConfig.profitTargetPct,
        stopLossPct: input.stopLossPct ?? exitConfig.stopLossPct,
        trailingStopPct: input.trailingStopPct ?? exitConfig.trailingStopPct,
        highWaterMarkPnlPct: 0,
        monitoringIntervalMin: exitConfig.reviewIntervalMinutes,
        monitoringAction: exitConfig.reviewIntervalAction,
        forceCloseTimeEt: exitConfig.eodForceCloseTimeEt,
        entryReason:
          input.entryReason || 'Manual Strategy Lab Execution (SIMULATED)',
        openedAt: nowIso,
        lastReviewedAt: nowIso,
      };

      setPositions((prev) => [newPos, ...prev]);

      setPaperAccounts((prev) =>
        prev.map((acc) =>
          acc.id === account.id
            ? {
                ...acc,
                buyingPower: Number(
                  Math.max(
                    0,
                    acc.buyingPower - analysis.buyingPowerRequired
                  ).toFixed(2)
                ),
              }
            : acc
        )
      );

      pushNotification(
        'PAPER_TRADE_OPENED',
        'SUCCESS',
        `Simulated ${orderStatus === 'PARTIALLY_FILLED' ? 'Partial ' : ''}Fill: ${input.strategyName}`,
        `${orderId}: Filled ${filledQty}/${input.contracts}x @ $${fillPricePerSpread.toFixed(2)} (${account.fillModel} model).`
      );
      pushAudit(
        'ORDER',
        'INFO',
        'PAPER_POSITION_OPENED',
        `${orderId} opened ${filledQty}x ${input.strategyName} (${legsSummary})`
      );

      return {
        success: true,
        message: `SIMULATED FILL: ${filledQty}x ${input.strategyName} filled @ $${fillPricePerSpread.toFixed(2)} (${account.fillModel})`,
        order: newOrder,
      };
    }

    pushNotification(
      'ENTRY_SIGNAL',
      'INFO',
      `Paper Limit Order Queued (${orderId})`,
      `Working LIMIT order for ${input.contracts}x ${input.strategyName} @ $${input.limitPrice?.toFixed(2)}.`
    );
    return {
      success: true,
      message: `LIMIT order ${orderId} placed in PENDING queue @ $${input.limitPrice?.toFixed(2)}.`,
      order: newOrder,
    };
  };

  // Close or Partially Close an Open Paper Position & Automatically Log to Journal
  const closePaperPosition = (
    positionId: string,
    fraction: 0.5 | 1 = 1,
    exitReason = 'Manual Exit (SIMULATED)'
  ) => {
    const pos = positions.find((p) => p.id === positionId);
    if (!pos) return;

    const closeQty =
      fraction === 1 ? pos.quantity : Math.max(1, Math.floor(pos.quantity / 2));
    const ratioClosed = closeQty / pos.quantity;
    const realizedPortion = Number((pos.unrealizedPnl * ratioClosed).toFixed(2));
    const releasedBp = Number((pos.maxRiskUsd * ratioClosed).toFixed(2));
    const closeOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const closeOrder: PaperOrder = {
      id: closeOrderId,
      accountId: pos.accountId,
      strategyCode: pos.strategyCode,
      strategyName: pos.strategyName,
      orderType: 'MARKET',
      action: closeQty === pos.quantity ? 'CLOSE' : 'PARTIAL_CLOSE',
      status: 'FILLED',
      isCredit: !pos.isCredit,
      requestedQty: closeQty,
      filledQty: closeQty,
      naturalMidpoint: pos.currentMark,
      filledAvgPrice: pos.currentMark,
      fillModelUsed: activeAccount.fillModel,
      fees: Number((pos.feesPaid * ratioClosed).toFixed(2)),
      slippage: Number((pos.slippageIncurred * ratioClosed).toFixed(2)),
      legsSummary: `CLOSE ${closeQty}x ${pos.strategyName} @ $${pos.currentMark.toFixed(2)}`,
      legs: pos.legs,
      isSimulated: true,
      submittedAt: nowIso,
      executedAt: nowIso,
    };
    setOrders((prev) => [closeOrder, ...prev]);

    if (closeQty >= pos.quantity) {
      setPositions((prev) => prev.filter((p) => p.id !== positionId));
    } else {
      const remQty = pos.quantity - closeQty;
      setPositions((prev) =>
        prev.map((p) =>
          p.id === positionId
            ? {
                ...p,
                quantity: remQty,
                unrealizedPnl: Number(
                  (p.unrealizedPnl - realizedPortion).toFixed(2)
                ),
                maxRiskUsd: Number((p.maxRiskUsd - releasedBp).toFixed(2)),
                lastReviewedAt: nowIso,
              }
            : p
        )
      );
    }

    setPaperAccounts((prev) =>
      prev.map((acc) =>
        acc.id === pos.accountId
          ? {
              ...acc,
              cashBalance: Number(
                (acc.cashBalance + realizedPortion).toFixed(2)
              ),
              buyingPower: Number(
                (acc.buyingPower + releasedBp + realizedPortion).toFixed(2)
              ),
              realizedPnl: Number(
                (acc.realizedPnl + realizedPortion).toFixed(2)
              ),
              unrealizedPnl: Number(
                Math.max(0, acc.unrealizedPnl - realizedPortion).toFixed(2)
              ),
            }
          : acc
      )
    );

    const strikesText = pos.legs
      .map((l) => `${l.strike}${l.optionType[0]}`)
      .join(' / ');
    const newJournal: JournalEntry = {
      id: `j-${Date.now()}`,
      tradeDate: nowIso.slice(0, 10),
      symbol: 'SPX',
      instrumentType:
        pos.legs.length > 1 ? 'MULTI_LEG_OPTION' : pos.legs[0].optionType,
      optionType:
        pos.legs.length > 1 ? 'MULTI-LEG' : pos.legs[0].optionType,
      strikeSummary: strikesText,
      expirationDate: pos.legs[0]?.expirationDate || selectedExpiration,
      contracts: closeQty,
      entryPrice: pos.avgEntryPremium,
      exitPrice: pos.currentMark,
      entryTime: new Date(pos.openedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      exitTime: new Date(nowIso).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      fees: Number((pos.feesPaid * ratioClosed * 2).toFixed(2)),
      slippage: Number((pos.slippageIncurred * ratioClosed).toFixed(2)),
      realizedPnl: realizedPortion,
      returnPct: pos.unrealizedPnlPct,
      strategy: pos.strategyName,
      moneyness: determineMoneyness(
        market.spotPrice,
        pos.legs[0]?.strike || market.atmStrike,
        pos.legs[0]?.optionType || 'CALL'
      ),
      tradingMode: 'PAPER',
      entryReason: pos.entryReason,
      exitReason,
      notes: `Auto-journaled from Paper Trading Engine (${closeOrderId}).`,
      orderIds: [closeOrderId],
      executionIds: [`EXEC-${Date.now()}`],
      legsCount: pos.legs.length,
      isVerified: true,
    };
    setJournalEntries((prev) => [newJournal, ...prev]);

    pushNotification(
      'EXIT_SIGNAL',
      realizedPortion >= 0 ? 'SUCCESS' : 'WARNING',
      `Position ${closeQty === pos.quantity ? 'Closed' : 'Partially Closed'}: ${pos.strategyName}`,
      `Realized P&L: ${realizedPortion >= 0 ? '+' : ''}$${realizedPortion.toFixed(2)} (${pos.unrealizedPnlPct}%). Logged to Trading Journal.`
    );
    pushAudit(
      'ORDER',
      'INFO',
      'PAPER_POSITION_CLOSED',
      `${closeOrderId} closed ${closeQty}x ${pos.strategyName} for ${realizedPortion >= 0 ? '+' : ''}$${realizedPortion.toFixed(2)} (${exitReason})`
    );
  };

  const performPositionMonitoringAction = (
    positionId: string,
    action: MonitoringAction
  ) => {
    const pos = positions.find((p) => p.id === positionId);
    if (!pos) return;

    if (action === 'HOLD' || action === 'REVIEW') {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === positionId
            ? {
                ...p,
                monitoringAction: action,
                lastReviewedAt: new Date().toISOString(),
              }
            : p
        )
      );
      pushAudit(
        'ORDER',
        'INFO',
        `POSITION_MONITOR_${action}`,
        `30-minute review checkpoint marked as ${action} for ${pos.strategyName}. Position kept open.`
      );
      pushNotification(
        'ENTRY_SIGNAL',
        'INFO',
        `Position Checkpoint: ${action}`,
        `${pos.strategyName} reviewed at 30-min interval — Action: ${action} (No automatic exit forced).`
      );
    } else if (action === 'PARTIAL_CLOSE') {
      closePaperPosition(
        positionId,
        0.5,
        '30-Minute Review: 50% Partial Close Action'
      );
    } else if (action === 'FULL_CLOSE') {
      closePaperPosition(
        positionId,
        1,
        '30-Minute Review: 100% Full Close Action'
      );
    }
  };

  const fillPendingOrder = (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId && o.status === 'PENDING');
    if (!ord) return;
    const fillPx = ord.limitPrice || ord.naturalMidpoint;
    const nowIso = new Date().toISOString();

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'FILLED',
              filledQty: o.requestedQty,
              filledAvgPrice: fillPx,
              executedAt: nowIso,
            }
          : o
      )
    );

    const newPos: PaperPosition = {
      id: `pos-${Date.now()}`,
      accountId: ord.accountId,
      strategyCode: ord.strategyCode,
      strategyName: ord.strategyName,
      underlyingSymbol: 'SPX',
      isCredit: ord.isCredit,
      quantity: ord.requestedQty,
      legs: ord.legs,
      avgEntryPremium: fillPx,
      currentMark: ord.naturalMidpoint,
      totalEntryCostUsd: fillPx * 100 * ord.requestedQty + ord.fees,
      maxRiskUsd: fillPx * 100 * ord.requestedQty,
      maxRewardUsd: 'UNLIMITED',
      unrealizedPnl: -ord.fees,
      unrealizedPnlPct: -0.2,
      feesPaid: ord.fees,
      slippageIncurred: ord.slippage,
      profitTargetPct: exitConfig.profitTargetPct,
      stopLossPct: exitConfig.stopLossPct,
      trailingStopPct: exitConfig.trailingStopPct,
      highWaterMarkPnlPct: 0,
      monitoringIntervalMin: exitConfig.reviewIntervalMinutes,
      monitoringAction: 'REVIEW',
      forceCloseTimeEt: exitConfig.eodForceCloseTimeEt,
      entryReason: `Limit Order ${ord.id} Filled @ $${fillPx.toFixed(2)}`,
      openedAt: nowIso,
      lastReviewedAt: nowIso,
    };

    setPositions((prev) => [newPos, ...prev]);
    pushNotification(
      'PAPER_TRADE_OPENED',
      'SUCCESS',
      `Limit Order Filled (${ord.id})`,
      `Filled ${ord.requestedQty}x ${ord.strategyName} @ limit price $${fillPx.toFixed(2)}.`
    );
  };

  const cancelPendingOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId && o.status === 'PENDING'
          ? { ...o, status: 'CANCELLED' }
          : o
      )
    );
    pushAudit(
      'ORDER',
      'INFO',
      'ORDER_CANCELLED',
      `Cancelled pending order ${orderId}`
    );
  };

  const triggerEmergencyKillSwitch = () => {
    const nowIso = new Date().toISOString();
    setAutoStreamEnabled(false);
    setRiskSettings((prev) => ({
      ...prev,
      killSwitchActive: true,
      killSwitchActivatedAt: nowIso,
    }));

    let cancelledCount = 0;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.status === 'PENDING') {
          cancelledCount++;
          return {
            ...o,
            status: 'CANCELLED',
            rejectionReason: 'Cancelled by Emergency Kill Switch',
          };
        }
        return o;
      })
    );

    pushNotification(
      'KILL_SWITCH',
      'CRITICAL',
      'EMERGENCY KILL SWITCH ACTIVATED',
      `New entries disabled. ${cancelledCount} pending order(s) cancelled. ${positions.length} open position(s) await explicit closing authorization.`
    );
    pushAudit(
      'KILL_SWITCH',
      'CRITICAL',
      'KILL_SWITCH_TRIGGERED',
      `Disabled new entries, cancelled ${cancelledCount} pending orders. Open positions (${positions.length}) displayed for separately authorized liquidation.`
    );
  };

  const resetKillSwitch = () => {
    setRiskSettings((prev) => ({
      ...prev,
      killSwitchActive: false,
      killSwitchActivatedAt: undefined,
    }));
    pushAudit(
      'KILL_SWITCH',
      'WARN',
      'KILL_SWITCH_RESET',
      'Operator manually reset Emergency Kill Switch. Paper trading re-enabled.'
    );
  };

  const authorizeCloseAllPositions = () => {
    const openIds = positions.map((p) => p.id);
    openIds.forEach((id) =>
      closePaperPosition(id, 1, 'Authorized Emergency Kill Switch Liquidation')
    );
    pushAudit(
      'KILL_SWITCH',
      'CRITICAL',
      'AUTHORIZED_CLOSE_ALL',
      `Operator separately authorized closing ${openIds.length} open paper position(s).`
    );
  };

  // Phase 5 Idempotent Automation Worker Pass
  const runAutomationEvaluationPass = (autoExecuteExits = false) => {
    const { events, recommendedPositionActions } = evaluateAutomationCycle(
      market,
      positions,
      entryConfig,
      exitConfig,
      riskSettings,
      isQuoteStale
    );

    setAutomationEvents((prev) => [...events, ...prev]);
    setActiveLocks(getActiveExecutionLocks());

    if (autoExecuteExits) {
      recommendedPositionActions.forEach((rec) => {
        if (rec.action === 'FULL_CLOSE') {
          closePaperPosition(rec.positionId, 1, `Automation Worker: ${rec.reason}`);
        } else if (rec.action === 'PARTIAL_CLOSE') {
          closePaperPosition(
            rec.positionId,
            0.5,
            `Automation Worker: ${rec.reason}`
          );
        }
      });
    }

    pushAudit(
      'ORDER',
      'INFO',
      'AUTOMATION_WORKER_CYCLE',
      `Evaluated ${events.length} idempotent rule event(s). Active execution locks: ${getActiveExecutionLocks().length}.`
    );
  };

  const resetAutomationLocks = () => {
    clearExecutionLocks();
    setActiveLocks([]);
    pushAudit(
      'SETTINGS',
      'INFO',
      'EXECUTION_LOCKS_CLEARED',
      'Cleared idempotency execution lock registry.'
    );
  };

  const simulateTradingViewWebhook = (
    signalType: SignalType,
    strategyCode: StrategyCode,
    validSecret = true
  ) => {
    const idempotencyKey = `${signalType}_SPX_${Math.floor(Date.now() / 1000)}`;
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (!validSecret) {
      const rejectedSig: TradingSignal = {
        id: `sig-${Date.now()}`,
        idempotencyKey,
        source: 'TRADINGVIEW',
        signalType,
        symbol: 'SPX',
        mappedStrategyCode: strategyCode,
        tradingMode: 'PAPER',
        validationStatus: 'REJECTED_AUTH',
        rejectionReason: 'Invalid HMAC Webhook Secret',
        receivedAt: nowTime,
        payloadSummary: `{"signal_type":"${signalType}","symbol":"SPX","secret":"INVALID"}`,
      };
      setSignals((prev) => [rejectedSig, ...prev]);
      pushAudit(
        'WEBHOOK',
        'WARN',
        'WEBHOOK_AUTH_FAILED',
        `Rejected TradingView signal ${signalType}: invalid secret.`
      );
      return;
    }

    if (riskSettings.killSwitchActive || isQuoteStale) {
      const reason = riskSettings.killSwitchActive
        ? 'Blocked by active Emergency Kill Switch'
        : 'Blocked by Stale Market Data protection';
      const rejectedRiskSig: TradingSignal = {
        id: `sig-${Date.now()}`,
        idempotencyKey,
        source: 'TRADINGVIEW',
        signalType,
        symbol: 'SPX',
        mappedStrategyCode: strategyCode,
        tradingMode: 'PAPER',
        validationStatus: 'REJECTED_RISK',
        rejectionReason: reason,
        receivedAt: nowTime,
        payloadSummary: `{"signal_type":"${signalType}","symbol":"SPX","price":${market.spotPrice}}`,
      };
      setSignals((prev) => [rejectedRiskSig, ...prev]);
      pushAudit(
        'WEBHOOK',
        'WARN',
        'WEBHOOK_RISK_BLOCKED',
        `${signalType} blocked: ${reason}`
      );
      return;
    }

    if (signalType === 'CLOSE_ALL' || signalType === 'EXIT_POSITION') {
      if (positions.length > 0) {
        closePaperPosition(
          positions[0].id,
          1,
          `TradingView Webhook Signal: ${signalType}`
        );
      }
      setSignals((prev) => [
        {
          id: `sig-${Date.now()}`,
          idempotencyKey,
          source: 'TRADINGVIEW',
          signalType,
          symbol: 'SPX',
          mappedStrategyCode: strategyCode,
          tradingMode: 'PAPER',
          validationStatus: 'EXECUTED_PAPER',
          receivedAt: nowTime,
          payloadSummary: `{"signal_type":"${signalType}","symbol":"SPX","action":"EXIT"}`,
        },
        ...prev,
      ]);
      return;
    }

    const strategyDef = getStrategyDefinition(strategyCode);
    const legs = buildStrategyLegs(
      strategyCode,
      optionsChain,
      market.spotPrice,
      entryConfig.defaultContracts
    );
    const res = placePaperOrder({
      accountId: activeAccount.id,
      strategyCode,
      strategyName: strategyDef.name,
      legs,
      contracts: entryConfig.defaultContracts,
      orderType: 'MARKET',
      entryReason: `TradingView Webhook: ${signalType}`,
    });

    setSignals((prev) => [
      {
        id: `sig-${Date.now()}`,
        idempotencyKey,
        source: 'TRADINGVIEW',
        signalType,
        symbol: 'SPX',
        mappedStrategyCode: strategyCode,
        tradingMode: 'PAPER',
        validationStatus: res.success ? 'EXECUTED_PAPER' : 'REJECTED_RISK',
        rejectionReason: res.success ? undefined : res.message,
        receivedAt: nowTime,
        payloadSummary: `{"signal_type":"${signalType}","symbol":"SPX","strategy":"${strategyCode}","spot":${market.spotPrice}}`,
      },
      ...prev,
    ]);
  };

  const addManualJournalEntry = (entry: Omit<JournalEntry, 'id'>) => {
    setJournalEntries((prev) => [
      { ...entry, id: `j-manual-${Date.now()}` },
      ...prev,
    ]);
    pushNotification(
      'JOURNAL_COMPLETED',
      'INFO',
      'Trade Logged to Journal',
      `Added ${entry.strategy} (${entry.symbol}) with P&L $${entry.realizedPnl.toFixed(2)}.`
    );
  };

  const importCsvExecutions = (csvText: string) => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return {
        importedTrades: 0,
        reconstructedMultiLeg: 0,
        errors: ['CSV must contain a header row and at least one execution row.'],
      };
    }

    const errors: string[] = [];
    const groups = new Map<string, string[][]>();

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length < 8) {
        errors.push(`Row ${i + 1}: Expected at least 8 columns.`);
        continue;
      }
      const groupKey = cols[0] || `ROW-${i}`;
      const existing = groups.get(groupKey) || [];
      existing.push(cols);
      groups.set(groupKey, existing);
    }

    const newEntries: JournalEntry[] = [];
    let reconstructedMultiLeg = 0;

    groups.forEach((rows, groupKey) => {
      const first = rows[0];
      const isMulti = rows.length > 1;
      if (isMulti) reconstructedMultiLeg++;

      const totalPnl = rows.reduce((sum, r) => {
        const qty = Number(r[6]) || 1;
        const entry = Number(r[7]) || 0;
        const exit = Number(r[8]) || 0;
        const fees = Number(r[9]) || 0;
        return sum + (exit - entry) * 100 * qty - fees;
      }, 0);

      const totalFees = rows.reduce((s, r) => s + (Number(r[9]) || 0), 0);
      const strikes = rows.map((r) => `${r[4]}${r[3]?.[0] || ''}`).join(' / ');
      const avgEntry =
        rows.reduce((s, r) => s + (Number(r[7]) || 0), 0) / rows.length;
      const avgExit =
        rows.reduce((s, r) => s + (Number(r[8]) || 0), 0) / rows.length;

      newEntries.push({
        id: `j-csv-${Date.now()}-${groupKey}`,
        tradeDate: first[1] || '2026-11-09',
        symbol: first[2] || 'SPX',
        instrumentType: isMulti
          ? 'MULTI_LEG_OPTION'
          : (first[3] as 'CALL' | 'PUT' | 'STOCK') || 'CALL',
        optionType: isMulti ? 'MULTI-LEG' : first[3] || 'CALL',
        strikeSummary: strikes,
        expirationDate: first[5] || '2026-11-09',
        contracts: Number(first[6]) || 1,
        entryPrice: Number(avgEntry.toFixed(2)),
        exitPrice: Number(avgExit.toFixed(2)),
        entryTime: '09:35 ET',
        exitTime: '11:15 ET',
        fees: Number(totalFees.toFixed(2)),
        slippage: 0,
        realizedPnl: Number(totalPnl.toFixed(2)),
        returnPct:
          avgEntry > 0
            ? Number((((avgExit - avgEntry) / avgEntry) * 100).toFixed(2))
            : 0,
        strategy:
          first[10] || (isMulti ? 'Custom Multi-Leg Spread' : 'Single Option'),
        moneyness: 'ATM',
        tradingMode: 'CSV_IMPORT',
        entryReason: 'CSV Execution Import',
        exitReason: 'CSV Execution Import',
        notes: first[11] || `Reconstructed from ${rows.length} execution leg(s).`,
        orderIds: [groupKey],
        executionIds: rows.map((_, idx) => `${groupKey}-LEG-${idx + 1}`),
        legsCount: rows.length,
        isVerified: true,
      });
    });

    if (newEntries.length > 0) {
      setJournalEntries((prev) => [...newEntries, ...prev]);
      pushAudit(
        'ORDER',
        'INFO',
        'CSV_JOURNAL_IMPORT',
        `Imported ${newEntries.length} strategy trades (${reconstructedMultiLeg} multi-leg reconstructed).`
      );
    }

    return {
      importedTrades: newEntries.length,
      reconstructedMultiLeg,
      errors,
    };
  };

  // Phase 4 Robinhood Historical Account JSON Importer
  const importRobinhoodHistoryJson = (jsonText: string) => {
    const { entries, error } = parseRobinhoodHistoryExport(jsonText);
    if (error) {
      return { importedCount: 0, error };
    }
    const created: JournalEntry[] = entries.map((e, idx) => ({
      ...e,
      id: `j-rh-${Date.now()}-${idx}`,
    }));
    setJournalEntries((prev) => [...created, ...prev]);
    pushAudit(
      'BROKER_MCP',
      'INFO',
      'ROBINHOOD_HISTORY_IMPORTED',
      `Reconstructed ${created.length} strategy trade(s) from Robinhood option history export.`
    );
    pushNotification(
      'JOURNAL_COMPLETED',
      'SUCCESS',
      'Robinhood History Synchronized',
      `Imported ${created.length} multi-leg/option strategy record(s) into Trading Journal.`
    );
    return { importedCount: created.length };
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Update or delete existing journal entry
  const updateJournalEntry = (id: string, updates: Partial<JournalEntry>) => {
    setJournalEntries((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
    );
    pushAudit(
      'ORDER',
      'INFO',
      'JOURNAL_ENTRY_UPDATED',
      `Adjusted journal entry ${id} (P&L / notes updated).`
    );
  };

  const deleteJournalEntry = (id: string) => {
    setJournalEntries((prev) => prev.filter((j) => j.id !== id));
  };

  // Adjust Paper/Tracked Account Balance directly (e.g. syncing manual daily profit)
  const adjustAccountBalance = (
    accountId: string,
    deltaUsd: number,
    reason: string
  ) => {
    setPaperAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              cashBalance: Number((acc.cashBalance + deltaUsd).toFixed(2)),
              buyingPower: Number((acc.buyingPower + deltaUsd).toFixed(2)),
              realizedPnl: Number((acc.realizedPnl + deltaUsd).toFixed(2)),
            }
          : acc
      )
    );
    pushNotification(
      'JOURNAL_COMPLETED',
      deltaUsd >= 0 ? 'SUCCESS' : 'WARNING',
      'Manual Daily P&L Adjusted',
      `Applied ${deltaUsd >= 0 ? '+' : ''}$${deltaUsd.toFixed(2)} to account (${reason}).`
    );
  };

  const upsertDailyProfitRecord = (
    record: Omit<DailyProfitRecord, 'id' | 'updatedAt'>
  ) => {
    setDailyProfitRecords((prev) => {
      const existingIdx = prev.findIndex(
        (r) => r.tradeDate === record.tradeDate
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...record,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }
      return [
        {
          ...record,
          id: `dp-${Date.now()}`,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  };

  const deleteDailyProfitRecord = (id: string) => {
    setDailyProfitRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const addDisciplineCheckIn = (
    entry: Omit<DisciplineCheckInLog, 'id' | 'timestamp' | 'tradeDate'>
  ) => {
    const now = new Date();
    const newLog: DisciplineCheckInLog = {
      ...entry,
      id: `disc-${Date.now()}`,
      timestamp: now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      tradeDate: now.toISOString().slice(0, 10),
    };
    setDisciplineLogs((prev) => [newLog, ...prev]);
    setCheckInAlertDue(false);
    setSecondsUntilCheckIn(checkInIntervalMinutes * 60);

    const isDangerMood =
      entry.mood === 'REVENGE' ||
      entry.mood === 'CLEAR_ALL_DEBT_ONE_TRADE' ||
      entry.mood === 'AVERAGING_DOWN_URGE' ||
      entry.brainFog === 'BRAIN_FOG' ||
      entry.brainFog === 'EXHAUSTED';

    pushNotification(
      isDangerMood ? 'DAILY_LOSS_LIMIT' : 'JOURNAL_COMPLETED',
      isDangerMood ? 'CRITICAL' : 'SUCCESS',
      isDangerMood
        ? '🚨 Discipline Alert: Step Away & Protect Family Capital'
        : '✅ 10-Min Discipline Check-In Logged',
      `Mood: ${entry.mood.replace(/_/g, ' ')} • Brain Fog: ${entry.brainFog} • Action: ${entry.actionTaken}`
    );
  };

  const deleteDisciplineCheckIn = (id: string) => {
    setDisciplineLogs((prev) => prev.filter((d) => d.id !== id));
  };

  // ============================================================================
  // GitHub Day Trader Skill Alerts Management (Jakeschincariol/day-trader-skill)
  // Automatically tracks total alerts and clears alerts after 2 days (48 hours)
  // ============================================================================
  const addDayTraderAlert = (
    alertInput: Omit<DayTraderSkillAlert, 'id' | 'createdAt' | 'expiresAt' | 'status' | 'sourceSkill'> & { retentionDays?: number }
  ) => {
    const now = new Date();
    const days = alertInput.retentionDays || 7;
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    const newAlert: DayTraderSkillAlert = {
      ...alertInput,
      retentionDays: days,
      id: `gt-alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now.toISOString(),
      expiresAt,
      status: 'ACTIVE',
      sourceSkill: 'trader-alerts (Jakeschincariol/day-trader-skill)',
    };

    setDayTraderAlerts((prev) => [newAlert, ...prev]);
    setTotalAlertsCreatedCount((prev) => prev + 1);

    pushNotification(
      'ENTRY_SIGNAL',
      'INFO',
      `GitHub Alert Created: ${newAlert.symbol} (${newAlert.alertType})`,
      `${newAlert.triggerCondition} • Retention: ${days} days (Expires ${new Date(expiresAt).toLocaleDateString()})`
    );
  };

  // Convert trade plan into a 3-alert triad: Stop Loss, Profit Target, Flat by Close
  const createTradePlanAlertTriad = (
    symbol: string,
    stopPrice: number,
    targetPrice: number,
    closeTimeEt: string = '15:55',
    retentionDays: number = 7
  ) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const currentPrice = market.spotPrice;

    const triad: DayTraderSkillAlert[] = [
      {
        id: `gt-alert-${Date.now()}-stop`,
        symbol,
        alertType: 'STOP_LOSS',
        targetPrice: stopPrice,
        triggerCondition: `${symbol} <= $${stopPrice.toFixed(2)} (Stop Loss)`,
        createdAt: now.toISOString(),
        expiresAt,
        retentionDays,
        status: 'ACTIVE',
        currentPriceAtCreation: currentPrice,
        sourceSkill: 'trader-alerts (Jakeschincariol/day-trader-skill)',
        notes: `Trade plan stop loss alert at $${stopPrice.toFixed(2)}`,
      },
      {
        id: `gt-alert-${Date.now()}-target`,
        symbol,
        alertType: 'PROFIT_TARGET',
        targetPrice,
        triggerCondition: `${symbol} >= $${targetPrice.toFixed(2)} (Profit Target)`,
        createdAt: now.toISOString(),
        expiresAt,
        retentionDays,
        status: 'ACTIVE',
        currentPriceAtCreation: currentPrice,
        sourceSkill: 'trader-alerts (Jakeschincariol/day-trader-skill)',
        notes: `Trade plan profit target alert at $${targetPrice.toFixed(2)}`,
      },
      {
        id: `gt-alert-${Date.now()}-flat`,
        symbol,
        alertType: 'FLAT_BY_CLOSE',
        triggerCondition: `${closeTimeEt} ET Mandatory Flatten (Avoid Assignment)`,
        createdAt: now.toISOString(),
        expiresAt,
        retentionDays,
        status: 'ACTIVE',
        currentPriceAtCreation: currentPrice,
        sourceSkill: 'trader-alerts (Jakeschincariol/day-trader-skill)',
        notes: `Close all positions before the bell at ${closeTimeEt} ET`,
      },
    ];

    setDayTraderAlerts((prev) => [...triad, ...prev]);
    setTotalAlertsCreatedCount((prev) => prev + 3);

    pushNotification(
      'ENTRY_SIGNAL',
      'SUCCESS',
      `GitHub Day Trader Alert Triad Created (${symbol})`,
      `Created 3 synchronized alerts: Stop @ $${stopPrice.toFixed(2)}, Target @ $${targetPrice.toFixed(2)}, and ${closeTimeEt} ET Flatten. (Retention: ${retentionDays} days)`
    );
  };

  const deleteDayTraderAlert = (id: string) => {
    setDayTraderAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Routine to clear alerts older than 2 days (48 hours)
  const clearExpiredAlerts = (): number => {
    const nowMs = Date.now();
    let purgedCount = 0;
    setDayTraderAlerts((prev) => {
      const remaining = prev.filter((alert) => {
        const isExpired = new Date(alert.expiresAt).getTime() <= nowMs;
        if (isExpired) purgedCount += 1;
        return !isExpired;
      });
      return remaining;
    });
    return purgedCount;
  };

  const clearAllDayTraderAlerts = () => {
    setDayTraderAlerts([]);
  };

  // Background check: purge alerts that have exceeded the 2-day lifespan every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const purged = clearExpiredAlerts();
      if (purged > 0) {
        pushNotification(
          'ENTRY_SIGNAL',
          'INFO',
          'Cleaned 2-Day Expired Alerts',
          `Auto-purged ${purged} GitHub alert(s) that reached their 48-hour expiration window.`
        );
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute remaining daily allowance based on dailyAllowanceUsd and today's drawdown
  const todayDrawdown = Math.max(
    0,
    -(activeAccount.realizedPnl + activeAccount.unrealizedPnl)
  );
  const remainingDailyAllowanceUsd = Math.max(
    0,
    Number((dailyAllowanceUsd - todayDrawdown).toFixed(2))
  );

  return (
    <TradingContext.Provider
      value={{
        activeSection,
        setActiveSection,
        activeSymbol,
        selectTradingSymbol,
        theme,
        setTheme,
        toggleTheme,
        textScale,
        setTextScale,
        operatorEmail,
        setOperatorEmail,
        market,
        autoStreamEnabled,
        setAutoStreamEnabled,
        isQuoteStale,
        setIsQuoteStale,
        selectedExpiration,
        setSelectedExpiration,
        optionsChain,
        simulateMarketMove,
        setMarketStatusOverride,
        selectedStrategyCode,
        setSelectedStrategyCode,
        customBuilderLegs,
        setCustomBuilderLegs,
        addContractToBuilder,
        clearBuilderLegs,
        paperAccounts,
        activeAccountId,
        setActiveAccountId,
        activeAccount,
        createPaperAccount,
        updateAccountSettings,
        positions,
        orders,
        executions,
        placePaperOrder,
        closePaperPosition,
        performPositionMonitoringAction,
        fillPendingOrder,
        cancelPendingOrder,
        entryConfig,
        setEntryConfig,
        exitConfig,
        setExitConfig,
        riskSettings,
        setRiskSettings,
        triggerEmergencyKillSwitch,
        resetKillSwitch,
        authorizeCloseAllPositions,
        automationEvents,
        activeLocks,
        runAutomationEvaluationPass,
        resetAutomationLocks,
        signals,
        simulateTradingViewWebhook,
        journalEntries,
        addManualJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        adjustAccountBalance,
        dailyProfitRecords,
        upsertDailyProfitRecord,
        deleteDailyProfitRecord,
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
        openMindsetCheckInModal,
        isRegularMarketOpen,
        dailyAllowanceUsd,
        setDailyAllowanceUsd,
        remainingDailyAllowanceUsd,
        importCsvExecutions,
        importRobinhoodHistoryJson,
        dayTraderAlerts,
        totalAlertsCreatedCount,
        addDayTraderAlert,
        createTradePlanAlertTriad,
        deleteDayTraderAlert,
        clearExpiredAlerts,
        clearAllDayTraderAlerts,
        notifications,
        markAllNotificationsRead,
        auditLogs,
        permissionMode,
        setPermissionMode,
        liveTradingAuthorized,
        setLiveTradingAuthorized,
        displayTimezone,
        setDisplayTimezone,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = (): TradingContextValue => {
  const ctx = useContext(TradingContext);
  if (!ctx) {
    throw new Error('useTrading must be used inside a TradingProvider');
  }
  return ctx;
};
