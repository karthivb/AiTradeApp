import React from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavigationSection } from '../../types/trading';
import { LoginPage } from '../../pages/LoginPage';

interface ProtectedRouteProps {
  route: NavigationSection;
  children: React.ReactNode;
  onNavigateFallback?: (section: NavigationSection) => void;
}

/**
 * Enforces both Authentication (Supabase Auth session or explicit Demo Sandbox session)
 * and Route/Role-based authorization checks before rendering any TradePilot view.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  route,
  children,
  onNavigateFallback,
}) => {
  const { isLoading, isAuthenticated, canAccessRoute } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B1220] text-white">
        <div className="flex items-center gap-3 rounded-xl border border-[#1E2D45] bg-[#111C2E] px-5 py-4 text-xs">
          <Lock className="h-4 w-4 animate-pulse text-[#26D6A0]" />
          <span>Verifying TradePilot session & RLS permissions...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const access = canAccessRoute(route);
  if (!access.allowed) {
    return (
      <div className="rounded-xl border border-[#EF4444]/40 bg-[#111C2E] p-8 text-center space-y-3">
        <ShieldAlert className="mx-auto h-8 w-8 text-[#EF4444]" />
        <h2 className="text-sm font-bold text-white">
          Protected Route Access Restricted
        </h2>
        <p className="text-xs text-[#9BAFC4] max-w-md mx-auto">
          {access.reason}
        </p>
        {onNavigateFallback && (
          <button
            onClick={() => onNavigateFallback('dashboard')}
            className="rounded-lg bg-[#26D6A0] px-4 py-2 text-xs font-bold text-[#0B1220]"
          >
            Return to Command Dashboard
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
