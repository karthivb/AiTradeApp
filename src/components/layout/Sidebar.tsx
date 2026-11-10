import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  Cpu,
  FlaskConical,
  HeartHandshake,
  History,
  Layers,
  LayoutDashboard,
  Link2,
  Radio,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { NavigationSection } from '../../types/trading';
import { useTrading } from '../../context/TradingContext';
import { TradePilotLogo } from './Logo';

interface NavItem {
  id: NavigationSection;
  label: string;
  icon: React.FC<{ className?: string }>;
  phaseBadge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'discipline', label: 'Discipline & 10m', icon: HeartHandshake, phaseBadge: '10M' },
  { id: 'strategy-lab', label: 'Strategy Lab', icon: FlaskConical, phaseBadge: 'CORE' },
  { id: 'options-chain', label: 'Options Chain', icon: Layers, phaseBadge: '0DTE' },
  { id: 'paper-trading', label: 'Paper Trading', icon: Cpu, phaseBadge: 'SIM' },
  { id: 'automation', label: 'Automation', icon: Bot },
  { id: 'signals', label: 'Signals', icon: Radio },
  { id: 'journal', label: 'Trade Journal', icon: BookOpen },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'backtesting', label: 'Backtesting', icon: History },
  { id: 'brokers', label: 'Brokers & MCP', icon: Link2 },
  { id: 'live-trading', label: 'Live Trading', icon: Activity, phaseBadge: 'LOCKED' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    positions,
    customBuilderLegs,
    riskSettings,
    orders,
  } = useTrading();

  const [collapsed, setCollapsed] = useState(false);
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-[#1E2D45] bg-[#111C2E] select-none transition-all duration-200 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-[#1E2D45] px-4 py-3.5">
        <TradePilotLogo compact={collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white transition"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {!collapsed && (
          <div className="px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9BAFC4]">
            Command Modules
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          let dynamicBadge: string | number | null = null;
          if (item.id === 'paper-trading' && positions.length > 0) {
            dynamicBadge = `${positions.length} OPEN`;
          } else if (item.id === 'strategy-lab' && customBuilderLegs.length > 0) {
            dynamicBadge = `${customBuilderLegs.length} LEGS`;
          } else if (item.id === 'automation' && pendingOrdersCount > 0) {
            dynamicBadge = pendingOrdersCount;
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              title={collapsed ? item.label : undefined}
              className={`group flex w-full items-center ${
                collapsed ? 'justify-center px-2' : 'justify-between px-3'
              } rounded-xl py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#26D6A0]/15 text-[#26D6A0] border border-[#26D6A0]/40 shadow-sm'
                  : 'text-[#9BAFC4] hover:bg-[#0B1220] hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive
                      ? 'text-[#26D6A0]'
                      : 'text-[#9BAFC4] group-hover:text-white'
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed &&
                (dynamicBadge ? (
                  <span className="rounded-md bg-[#26D6A0]/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                    {dynamicBadge}
                  </span>
                ) : item.phaseBadge ? (
                  <span
                    className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                      item.phaseBadge === 'LOCKED'
                        ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        : 'bg-[#0B1220] text-[#9BAFC4] border border-[#1E2D45]'
                    }`}
                  >
                    {item.phaseBadge}
                  </span>
                ) : null)}
            </button>
          );
        })}
      </div>

      {/* Bottom Risk & Execution Mode Status Box */}
      {!collapsed && (
        <div className="border-t border-[#1E2D45] p-3">
          <div
            className={`rounded-xl border p-3 ${
              riskSettings.killSwitchActive
                ? 'border-[#EF4444]/60 bg-[#EF4444]/15'
                : 'border-[#1E2D45] bg-[#0B1220]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldAlert
                  className={`h-4 w-4 ${
                    riskSettings.killSwitchActive
                      ? 'text-[#EF4444]'
                      : 'text-[#26D6A0]'
                  }`}
                />
                {riskSettings.killSwitchActive
                  ? 'KILL SWITCH ON'
                  : 'PAPER MODE SAFE'}
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-[#26D6A0] animate-pulse" />
            </div>
            <p className="mt-1 text-[11px] text-[#9BAFC4]">
              {riskSettings.killSwitchActive
                ? 'New entries blocked.'
                : 'All fills routed to Paper Engine.'}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
