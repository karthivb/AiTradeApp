import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TradingProvider, useTrading } from './context/TradingContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { DashboardPage } from './pages/DashboardPage';
import { DisciplinePage } from './pages/DisciplinePage';
import { StrategyLabPage } from './pages/StrategyLabPage';
import { OptionsChainPage } from './pages/OptionsChainPage';
import { ScreenerPage } from './pages/ScreenerPage';
import { PaperTradingPage } from './pages/PaperTradingPage';
import { LiveTradingPage } from './pages/LiveTradingPage';
import { AutomationPage } from './pages/AutomationPage';
import { SignalsPage } from './pages/SignalsPage';
import { JournalPage } from './pages/JournalPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { BacktestingPage } from './pages/BacktestingPage';
import { BrokerConnectionsPage } from './pages/BrokerConnectionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { MindsetReminderModal } from './components/discipline/MindsetReminderModal';

const MainShell: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    checkInAlertDue,
    acknowledgeCheckInAlert,
  } = useTrading();
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return <LoginPage />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardPage />;
      case 'discipline':
        return <DisciplinePage />;
      case 'strategy-lab':
        return <StrategyLabPage />;
      case 'options-chain':
        return <OptionsChainPage />;
      case 'screener':
        return <ScreenerPage />;
      case 'paper-trading':
        return <PaperTradingPage />;
      case 'live-trading':
        return <LiveTradingPage />;
      case 'automation':
        return <AutomationPage />;
      case 'signals':
        return <SignalsPage />;
      case 'journal':
        return <JournalPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'backtesting':
        return <BacktestingPage />;
      case 'brokers':
        return <BrokerConnectionsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B1220] text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-[1600px]">
            <ProtectedRoute
              route={activeSection}
              onNavigateFallback={setActiveSection}
            >
              {renderSection()}
            </ProtectedRoute>
          </div>
        </main>
      </div>

      {/* Trader Discipline Mindset Reminder Pop-Up (Triggered during Regular Market Hours) */}
      <MindsetReminderModal
        isOpen={checkInAlertDue}
        onClose={acknowledgeCheckInAlert}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <TradingProvider>
        <MainShell />
      </TradingProvider>
    </AuthProvider>
  );
}

export default App;
