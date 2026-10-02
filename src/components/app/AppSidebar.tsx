import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  BotMessageSquare,
  ChevronLeft,
  CreditCard,
  FileUp,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  PieChart,
  Receipt,
  Settings,
  Target,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { supabase } from "@/integrations/supabase/client";

export const NAV_ITEMS = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    to: "/transactions",
    icon: CreditCard,
  },
  {
    label: "Upload Statement",
    to: "/upload",
    icon: FileUp,
  },
  {
    label: "Budget Planner",
    to: "/budget",
    icon: PieChart,
  },
  {
    label: "Goals",
    to: "/goals",
    icon: Target,
  },
  {
    label: "Reports & Analytics",
    to: "/reports",
    icon: LineChart,
  },
  {
    label: "AI Financial Coach",
    to: "/coach",
    icon: BotMessageSquare,
  },
  {
    label: "Accounts",
    to: "/accounts",
    icon: Wallet,
  },
  {
    label: "Bills & Subscriptions",
    to: "/bills",
    icon: Receipt,
  },
  {
    label: "Notifications",
    to: "/notifications",
    icon: Bell,
  },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
  },
  {
    label: "Help & Support",
    to: "/help",
    icon: HelpCircle,
  },
] as const;

function NavList({ collapsed, onPick }: { collapsed: boolean; onPick: () => void }) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2"
    >
      {NAV_ITEMS.map(({ label, to, icon: Icon }) => {
        const active = pathname === to;

        return (
          <Link
            key={label}
            to={to}
            onClick={onPick}
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
            className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-300 ${
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            } ${collapsed ? "justify-center" : ""}`}
          >
            {active && (
              <motion.span
                layoutId="sidebar-active"
                className="absolute inset-0 -z-10 rounded-2xl border border-primary/40 bg-primary/12"
              />
            )}

            <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary" : ""}`} />

            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  /*
   * LOGOUT
   *
   * 1. Sign out from Supabase
   * 2. Clear React Query cached data
   * 3. Navigate to the landing page
   */
  const logout = () => {
    if (loggingOut) return;

    setLoggingOut(true);

    // Start local Supabase logout without waiting for the network.
    void supabase.auth.signOut({ scope: "local" }).catch((error) => {
      console.error("Finora AI logout error:", error);
    });

    // Leave the dashboard immediately.
    window.location.replace("/");
  };

  /*
   * Shared sidebar content.
   * This is used by both desktop and mobile sidebars.
   */
  const Shell = (
    <>
      {/* =========================
          SIDEBAR HEADER
          ========================= */}
      <div
        className={`flex items-center px-4 py-5 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {/* Logo always remains visible */}
        <Link to="/dashboard" aria-label="Go to dashboard" className="shrink-0">
          {collapsed ? <Logo className="h-9 w-9" showText={false} /> : <Logo />}
        </Link>

        {/* Collapse / Expand button */}
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          className="hidden h-8 w-8 place-items-center rounded-xl glass text-muted-foreground transition-colors hover:text-foreground lg:grid"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* =========================
          NAVIGATION
          ========================= */}
      <NavList collapsed={collapsed} onPick={() => setMobileOpen(false)} />

      {/* =========================
          LOGOUT
          ========================= */}
      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        title={collapsed ? "Logout" : undefined}
        aria-label="Logout"
        className={`mx-3 mb-4 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" />

        {!collapsed && <span>{loggingOut ? "Logging out…" : "Logout"}</span>}
      </button>
    </>
  );

  return (
    <>
      {/* =========================
          DESKTOP SIDEBAR
          ========================= */}
      <aside
        className={`sticky top-0 z-20 hidden h-screen shrink-0 flex-col border-r border-glass-border bg-foreground/[0.03] backdrop-blur-xl transition-[width] duration-300 lg:flex ${
          collapsed ? "w-[86px]" : "w-[268px]"
        }`}
      >
        {Shell}
      </aside>

      {/* =========================
          MOBILE MENU BUTTON
          ========================= */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 grid h-11 w-11 place-items-center rounded-2xl glass-strong lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* =========================
          MOBILE SIDEBAR
          ========================= */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 34,
              }}
              className="fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-glass-border bg-background/95 backdrop-blur-2xl lg:hidden"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-5 grid h-8 w-8 place-items-center rounded-xl glass"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>

              {Shell}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
