// ============================================================================
// TradePilot – Phase 5: Idempotent Automation Worker & Execution Lock Engine
// ============================================================================

import {
  EntryRuleConfig,
  ExitRuleConfig,
  MarketSnapshot,
  MonitoringAction,
  PaperPosition,
  RiskSettings,
} from '../types/trading';

export interface AutomationEventRecord {
  id: string;
  idempotencyKey: string;
  executionLockKey: string;
  eventType:
    | 'ENTRY_EVALUATION'
    | 'EXIT_EVALUATION'
    | 'INTERVAL_30M_CHECKPOINT'
    | 'FORCE_CLOSE_CUTOFF'
    | 'DUPLICATE_LOCK_BLOCKED'
    | 'RISK_GATE_BLOCKED';
  strategyName: string;
  actionTaken:
    | 'HOLD'
    | 'REVIEW'
    | 'PARTIAL_CLOSE'
    | 'FULL_CLOSE'
    | 'ENTRY_SIGNAL_READY'
    | 'BLOCKED';
  reason: string;
  occurredAt: string;
}

const activeExecutionLocks = new Set<string>();

export function acquireExecutionLock(lockKey: string): boolean {
  if (activeExecutionLocks.has(lockKey)) {
    return false;
  }
  activeExecutionLocks.add(lockKey);
  return true;
}

export function getActiveExecutionLocks(): string[] {
  return Array.from(activeExecutionLocks);
}

export function clearExecutionLocks(): void {
  activeExecutionLocks.clear();
}

/**
 * Runs a single idempotent evaluation pass over market entry conditions and open paper positions.
 */
export function evaluateAutomationCycle(
  market: MarketSnapshot,
  positions: PaperPosition[],
  entryConfig: EntryRuleConfig,
  exitConfig: ExitRuleConfig,
  riskSettings: RiskSettings,
  isQuoteStale: boolean
): {
  events: AutomationEventRecord[];
  recommendedPositionActions: {
    positionId: string;
    action: MonitoringAction;
    reason: string;
  }[];
} {
  const nowIso = new Date().toISOString();
  const minuteBucket = nowIso.slice(0, 16); // YYYY-MM-DDTHH:mm idempotency bucket
  const events: AutomationEventRecord[] = [];
  const recommendedPositionActions: {
    positionId: string;
    action: MonitoringAction;
    reason: string;
  }[] = [];

  // 1. Global Risk & Stale Quote Gate
  if (riskSettings.killSwitchActive || isQuoteStale) {
    const lockKey = `lock:risk_block:${minuteBucket}`;
    events.push({
      id: `auto-${Date.now()}-risk`,
      idempotencyKey: `idem_${lockKey}`,
      executionLockKey: lockKey,
      eventType: 'RISK_GATE_BLOCKED',
      strategyName: 'GLOBAL_ENGINE',
      actionTaken: 'BLOCKED',
      reason: riskSettings.killSwitchActive
        ? 'Kill Switch is active — automated entries halted.'
        : 'Market quotes flagged STALE (>30s) — automated entries halted.',
      occurredAt: nowIso,
    });
    return { events, recommendedPositionActions };
  }

  // 2. Entry Condition Check
  const entryLockKey = `lock:entry:${entryConfig.triggerType}:${minuteBucket}`;
  const isEntryLocked = !acquireExecutionLock(entryLockKey);

  if (isEntryLocked) {
    events.push({
      id: `auto-${Date.now()}-dup`,
      idempotencyKey: `idem_${entryLockKey}`,
      executionLockKey: entryLockKey,
      eventType: 'DUPLICATE_LOCK_BLOCKED',
      strategyName: entryConfig.triggerType,
      actionTaken: 'BLOCKED',
      reason: `Idempotent execution lock (${entryLockKey}) already acquired for this minute window. Duplicate entry prevented.`,
      occurredAt: nowIso,
    });
  } else {
    let signalMet = false;
    let detail = '';

    if (entryConfig.triggerType === 'VWAP_BREAKOUT') {
      signalMet = market.spotPrice > market.vwap + 1.5;
      detail = `SPX (${market.spotPrice}) vs VWAP (${market.vwap})`;
    } else if (entryConfig.triggerType === 'EMA_CROSSOVER') {
      signalMet = market.ema9 > market.ema21;
      detail = `EMA9 (${market.ema9}) vs EMA21 (${market.ema21})`;
    } else if (entryConfig.triggerType === 'ORB_15M') {
      signalMet = market.spotPrice >= market.openingRangeHigh;
      detail = `SPX (${market.spotPrice}) vs ORB High (${market.openingRangeHigh})`;
    } else if (entryConfig.triggerType === 'RSI_CONFIRMATION') {
      signalMet = market.rsi14 >= 55 && market.rsi14 <= 72;
      detail = `RSI(14) = ${market.rsi14}`;
    } else {
      signalMet = true;
      detail = `Scheduled evaluation window (${entryConfig.evaluationTimeEt} ET)`;
    }

    events.push({
      id: `auto-${Date.now()}-entry`,
      idempotencyKey: `idem_${entryLockKey}`,
      executionLockKey: entryLockKey,
      eventType: 'ENTRY_EVALUATION',
      strategyName: `${entryConfig.triggerType} (${entryConfig.strikeSelection})`,
      actionTaken: signalMet ? 'ENTRY_SIGNAL_READY' : 'HOLD',
      reason: signalMet
        ? `Condition MET: ${detail}. Ready for Paper Engine execution.`
        : `Condition NOT MET: ${detail}. Waiting for next cycle.`,
      occurredAt: nowIso,
    });
  }

  // 3. Evaluate All Open Paper Positions against Exit & 30m Monitoring Rules
  positions.forEach((pos, idx) => {
    const posLockKey = `lock:exit:${pos.id}:${minuteBucket}`;
    acquireExecutionLock(posLockKey);

    // Check Fixed Profit Target
    if (
      exitConfig.profitTargetEnabled &&
      pos.unrealizedPnlPct >= pos.profitTargetPct
    ) {
      const reason = `Fixed Profit Target reached (+${pos.unrealizedPnlPct.toFixed(1)}% >= +${pos.profitTargetPct}%).`;
      recommendedPositionActions.push({
        positionId: pos.id,
        action: 'FULL_CLOSE',
        reason,
      });
      events.push({
        id: `auto-${Date.now()}-pos-${idx}`,
        idempotencyKey: `idem_${posLockKey}`,
        executionLockKey: posLockKey,
        eventType: 'EXIT_EVALUATION',
        strategyName: pos.strategyName,
        actionTaken: 'FULL_CLOSE',
        reason,
        occurredAt: nowIso,
      });
      return;
    }

    // Check Fixed Stop Loss
    if (
      exitConfig.stopLossEnabled &&
      pos.unrealizedPnlPct <= -pos.stopLossPct
    ) {
      const reason = `Fixed Stop Loss reached (${pos.unrealizedPnlPct.toFixed(1)}% <= -${pos.stopLossPct}%).`;
      recommendedPositionActions.push({
        positionId: pos.id,
        action: 'FULL_CLOSE',
        reason,
      });
      events.push({
        id: `auto-${Date.now()}-pos-${idx}`,
        idempotencyKey: `idem_${posLockKey}`,
        executionLockKey: posLockKey,
        eventType: 'EXIT_EVALUATION',
        strategyName: pos.strategyName,
        actionTaken: 'FULL_CLOSE',
        reason,
        occurredAt: nowIso,
      });
      return;
    }

    // Check Trailing Stop from High-Water Mark
    if (
      exitConfig.trailingStopEnabled &&
      pos.highWaterMarkPnlPct >= 12 &&
      pos.highWaterMarkPnlPct - pos.unrealizedPnlPct >= pos.trailingStopPct
    ) {
      const reason = `Trailing Stop triggered: P&L pulled back ${(pos.highWaterMarkPnlPct - pos.unrealizedPnlPct).toFixed(1)}% from peak +${pos.highWaterMarkPnlPct.toFixed(1)}%.`;
      recommendedPositionActions.push({
        positionId: pos.id,
        action: 'FULL_CLOSE',
        reason,
      });
      events.push({
        id: `auto-${Date.now()}-pos-${idx}`,
        idempotencyKey: `idem_${posLockKey}`,
        executionLockKey: posLockKey,
        eventType: 'EXIT_EVALUATION',
        strategyName: pos.strategyName,
        actionTaken: 'FULL_CLOSE',
        reason,
        occurredAt: nowIso,
      });
      return;
    }

    // Otherwise log 30-Minute Interval Checkpoint (does NOT force exit unless configured)
    const checkpointAction = exitConfig.reviewIntervalAction;
    const reason = `30-Min Monitoring Checkpoint: Unrealized P&L ${pos.unrealizedPnlPct >= 0 ? '+' : ''}${pos.unrealizedPnlPct.toFixed(1)}%. Configured Interval Action: ${checkpointAction}.`;
    recommendedPositionActions.push({
      positionId: pos.id,
      action: checkpointAction,
      reason,
    });
    events.push({
      id: `auto-${Date.now()}-pos-${idx}`,
      idempotencyKey: `idem_${posLockKey}`,
      executionLockKey: posLockKey,
      eventType: 'INTERVAL_30M_CHECKPOINT',
      strategyName: pos.strategyName,
      actionTaken: checkpointAction,
      reason,
      occurredAt: nowIso,
    });
  });

  return { events, recommendedPositionActions };
}
