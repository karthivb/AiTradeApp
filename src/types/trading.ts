// ============================================================================
// TradePilot – Intelligent Options Trading Command Center
// Core TypeScript Interfaces & Domain Models
// ============================================================================

export type NavigationSection =
  | 'dashboard'
  | 'discipline'
  | 'strategy-lab'
  | 'options-chain'
  | 'paper-trading'
  | 'live-trading'
  | 'automation'
  | 'signals'
  | 'journal'
  | 'analytics'
  | 'backtesting'
  | 'brokers'
  | 'settings';

export type MarketStatus = 'PRE-MARKET' | 'OPEN' | 'CLOSED' | 'AFTER-HOURS';

export type DataSourceMode = 'SIMULATED_DEMO' | 'POLYGON' | 'TRADIER' | 'ROBINHOOD_MCP';

export type OptionType = 'CALL' | 'PUT';

export type Moneyness = 'ATM' | 'ITM' | 'OTM';

export type OrderSide = 'BUY_TO_OPEN' | 'SELL_TO_OPEN' | 'BUY_TO_CLOSE' | 'SELL_TO_CLOSE';

export type FillModel = 'MIDPOINT' | 'NATURAL_BID_ASK' | 'SLIPPAGE_ADJUSTED';

export type OrderType = 'MARKET' | 'LIMIT';

export type OrderStatus = 'PENDING' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export type TradingPermissionMode = 'READ_ONLY' | 'PAPER' | 'LIVE';

export type MonitoringAction = 'HOLD' | 'REVIEW' | 'PARTIAL_CLOSE' | 'FULL_CLOSE';

export type StrategyCategory =
  | 'DIRECTIONAL'
  | 'VOLATILITY'
  | 'DEBIT_SPREAD'
  | 'CREDIT_SPREAD'
  | 'MULTI_LEG';

export type StrategyCode =
  | 'ATM_LONG_CALL'
  | 'ITM_LONG_CALL'
  | 'OTM_LONG_CALL'
  | 'ATM_LONG_PUT'
  | 'ITM_LONG_PUT'
  | 'OTM_LONG_PUT'
  | 'ATM_LONG_STRADDLE'
  | 'OTM_LONG_STRANGLE'
  | 'BULL_CALL_DEBIT_SPREAD'
  | 'BEAR_PUT_DEBIT_SPREAD'
  | 'BULL_PUT_CREDIT_SPREAD'
  | 'BEAR_CALL_CREDIT_SPREAD'
  | 'IRON_CONDOR'
  | 'IRON_BUTTERFLY'
  | 'CUSTOM_MULTI_LEG';

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface OptionContract {
  id: string;
  occSymbol: string;
  underlyingSymbol: string;
  expirationDate: string; // YYYY-MM-DD
  dte: number;
  strike: number;
  optionType: OptionType;
  multiplier: 100;
  bid: number;
  ask: number;
  midpoint: number;
  lastPrice: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number; // e.g., 0.164 for 16.4%
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  moneyness: Moneyness;
  dataSource: DataSourceMode;
  quoteTimestamp: string;
}

export interface StrategyLeg {
  id: string;
  contract: OptionContract;
  side: OrderSide;
  ratio: number; // 1 for standard legs
  contracts: number;
  entryPrice: number;
}

export interface StrategyDefinition {
  code: StrategyCode;
  name: string;
  category: StrategyCategory;
  marketOutlook: string;
  idealCondition: string;
  unsuitableWarning: string;
  description: string;
  isCreditStrategy: boolean;
  isDefinedRisk: boolean;
  defaultLegsCount: number;
}

export interface PayoffPoint {
  underlyingPrice: number;
  expirationPnl: number;
  currentTheoPnl: number;
  zeroLine: number;
}

export interface StrategyAnalysis {
  strategy: StrategyDefinition;
  legs: StrategyLeg[];
  contracts: number;
  isCredit: boolean;
  netPremiumPerSpread: number; // Positive for debit paid, negative for credit received (or signed)
  netDebitOrCreditTotal: number; // In USD (multiplier 100 * contracts)
  maxProfit: number | 'UNLIMITED';
  maxLoss: number;
  breakevens: number[];
  riskRewardRatio: string;
  buyingPowerRequired: number;
  buyingPowerValid: boolean;
  buyingPowerMessage: string;
  netGreeks: OptionGreeks;
  estimatedFees: number;
  estimatedSlippage: number;
  payoffCurve: PayoffPoint[];
}

export interface PaperAccount {
  id: string;
  name: string;
  initialCapital: number;
  cashBalance: number;
  buyingPower: number;
  realizedPnl: number;
  unrealizedPnl: number;
  fillModel: FillModel;
  commissionPerContract: number;
  slippagePerContract: number;
  isDefault: boolean;
  createdAt: string;
}

export interface PaperPositionLeg {
  occSymbol: string;
  optionType: OptionType;
  strike: number;
  expirationDate: string;
  side: OrderSide;
  ratio: number;
  entryPrice: number;
  currentMark: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface PaperPosition {
  id: string;
  accountId: string;
  strategyCode: StrategyCode;
  strategyName: string;
  underlyingSymbol: string;
  isCredit: boolean;
  quantity: number;
  legs: PaperPositionLeg[];
  avgEntryPremium: number; // Per spread/contract in points
  currentMark: number; // Current mark in points
  totalEntryCostUsd: number; // Total USD debit paid or credit received (with fees)
  maxRiskUsd: number;
  maxRewardUsd: number | 'UNLIMITED';
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  feesPaid: number;
  slippageIncurred: number;
  profitTargetPct: number;
  stopLossPct: number;
  trailingStopPct: number;
  highWaterMarkPnlPct: number;
  monitoringIntervalMin: number;
  monitoringAction: MonitoringAction;
  forceCloseTimeEt: string;
  entryReason: string;
  openedAt: string;
  lastReviewedAt: string;
}

export interface PaperOrder {
  id: string;
  accountId: string;
  strategyCode: StrategyCode;
  strategyName: string;
  orderType: OrderType;
  action: 'OPEN' | 'CLOSE' | 'PARTIAL_CLOSE';
  status: OrderStatus;
  isCredit: boolean;
  requestedQty: number;
  filledQty: number;
  limitPrice?: number;
  naturalMidpoint: number;
  filledAvgPrice?: number;
  fillModelUsed: FillModel;
  fees: number;
  slippage: number;
  legsSummary: string;
  legs: PaperPositionLeg[];
  rejectionReason?: string;
  isSimulated: true;
  submittedAt: string;
  executedAt?: string;
}

export interface PaperExecution {
  id: string;
  orderId: string;
  accountId: string;
  occSymbol: string;
  side: OrderSide;
  fillQty: number;
  fillPrice: number;
  fee: number;
  slippage: number;
  fillModel: FillModel;
  isSimulated: true;
  executedAt: string;
}

export interface EntryRuleConfig {
  triggerType:
    | 'MARKET_OPEN'
    | 'MARKET_AFTER_TIME'
    | 'LIMIT_PRICE'
    | 'VWAP_BREAKOUT'
    | 'EMA_CROSSOVER'
    | 'ORB_15M'
    | 'RSI_CONFIRMATION'
    | 'TRADINGVIEW_WEBHOOK'
    | 'MANUAL';
  marketOpenEt: string;
  evaluationTimeEt: string;
  entryCutoffEt: string;
  timezone: 'America/New_York';
  strikeSelection:
    | 'ATM'
    | 'ITM_1'
    | 'ITM_2'
    | 'OTM_1'
    | 'OTM_2'
    | 'DELTA_BASED';
  targetDelta: number;
  defaultContracts: number;
  limitPriceOffset: number;
}

export interface ExitRuleConfig {
  profitTargetEnabled: boolean;
  profitTargetPct: number;
  stopLossEnabled: boolean;
  stopLossPct: number;
  trailingStopEnabled: boolean;
  trailingStopPct: number;
  breakevenStopEnabled: boolean;
  breakevenTriggerPct: number;
  timeBasedExitEnabled: boolean;
  maxHoldMinutes: number;
  reviewIntervalMinutes: number;
  reviewIntervalAction: MonitoringAction;
  eodForceCloseEnabled: boolean;
  eodForceCloseTimeEt: string;
  tradingViewReversalExit: boolean;
}

export interface RiskSettings {
  maxDailyLoss: number;
  maxRiskPerTrade: number;
  maxTradesPerDay: number;
  maxSimultaneousPositions: number;
  maxContractsPerTrade: number;
  maxPortfolioExposurePct: number;
  maxBidAskSpread: number;
  maxSlippage: number;
  minVolume: number;
  minOpenInterest: number;
  entryCutoffEt: string;
  maxHoldingDurationMin: number;
  reEntryCooldownMin: number;
  staleQuoteThresholdSec: number;
  killSwitchActive: boolean;
  killSwitchActivatedAt?: string;
}

export type SignalType =
  | 'BUY_CALL'
  | 'BUY_PUT'
  | 'BUY_STRADDLE'
  | 'BUY_STRANGLE'
  | 'EXIT_POSITION'
  | 'CLOSE_ALL'
  | 'VWAP_BULLISH'
  | 'VWAP_BEARISH'
  | 'EMA_BULLISH'
  | 'EMA_BEARISH';

export interface TradingSignal {
  id: string;
  idempotencyKey: string;
  source: 'TRADINGVIEW' | 'INTERNAL_INDICATOR' | 'MANUAL_TEST';
  signalType: SignalType;
  symbol: string;
  mappedStrategyCode: StrategyCode;
  tradingMode: 'PAPER' | 'LIVE_BLOCKED';
  validationStatus: 'VALIDATED' | 'EXECUTED_PAPER' | 'REJECTED_RISK' | 'REJECTED_AUTH' | 'DUPLICATE';
  rejectionReason?: string;
  receivedAt: string;
  payloadSummary: string;
}

export interface JournalEntry {
  id: string;
  tradeDate: string; // YYYY-MM-DD
  symbol: string;
  instrumentType: 'STOCK' | 'CALL' | 'PUT' | 'MULTI_LEG_OPTION';
  optionType: string;
  strikeSummary: string;
  expirationDate: string;
  contracts: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  fees: number;
  slippage: number;
  realizedPnl: number;
  returnPct: number;
  strategy: string;
  moneyness: Moneyness;
  tradingMode: 'PAPER' | 'LIVE' | 'CSV_IMPORT' | 'ROBINHOOD_SYNC';
  entryReason: string;
  exitReason: string;
  notes: string;
  orderIds: string[];
  executionIds: string[];
  legsCount: number;
  isVerified: boolean;
}

export interface NotificationItem {
  id: string;
  type:
    | 'ENTRY_SIGNAL'
    | 'PAPER_TRADE_OPENED'
    | 'PROFIT_TARGET'
    | 'STOP_LOSS'
    | 'EXIT_SIGNAL'
    | 'DAILY_LOSS_LIMIT'
    | 'BROKER_DISCONNECTED'
    | 'MARKET_DATA_STALE'
    | 'ORDER_REJECTED'
    | 'JOURNAL_COMPLETED'
    | 'KILL_SWITCH';
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface AuditLogEntry {
  id: string;
  category: 'ORDER' | 'RISK' | 'KILL_SWITCH' | 'BROKER_MCP' | 'WEBHOOK' | 'AUTH' | 'SETTINGS';
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  action: string;
  details: string;
  timestamp: string;
}

export interface MarketSnapshot {
  symbol: string;
  spotPrice: number;
  dailyChange: number;
  dailyChangePct: number;
  vix: number;
  vixChangePct: number;
  vwap: number;
  ema9: number;
  ema21: number;
  rsi14: number;
  openingRangeHigh: number;
  openingRangeLow: number;
  atmStrike: number;
  marketStatus: MarketStatus;
  dataSource: DataSourceMode;
  isSimulated: boolean;
  lastUpdated: string;
  intradaySeries: {
    time: string;
    spx: number;
    vwap: number;
    vix: number;
  }[];
}

export type BrainFogLevel =
  | 'CLEAR'
  | 'MILD_FATIGUE'
  | 'BRAIN_FOG'
  | 'EXHAUSTED';

export type DisciplineMood =
  | 'CALM_DISCIPLINED'
  | 'PROFIT_CONFIDENT'
  | 'OVER_TRADE'
  | 'REVENGE'
  | 'FOMO'
  | 'CLEAR_ALL_DEBT_ONE_TRADE'
  | 'AVERAGING_DOWN_URGE'
  | 'HOLDING_TOO_LONG';

export interface DisciplineCheckInLog {
  id: string;
  timestamp: string;
  tradeDate: string;
  brainFog: BrainFogLevel;
  mood: DisciplineMood;
  secondaryMoods: DisciplineMood[];
  urgeIntensity: number; // 1-10
  remainingDailyBudgetUsd: number;
  actionTaken: string;
  familyReminderChecked: boolean;
  notes: string;
}

export interface DailyProfitRecord {
  id: string;
  tradeDate: string; // YYYY-MM-DD
  manualProfitUsd: number; // Manual daily profit/loss or broker adjustment
  accountAdjustmentUsd: number; // Optional cash deposit/withdrawal/adjustment
  brokerSource: 'ROBINHOOD_LIVE' | 'PAPER_ENGINE' | 'COMBINED';
  tradesCount: number;
  dominantMood: DisciplineMood;
  followedPlan: boolean;
  notes: string;
  updatedAt: string;
}

