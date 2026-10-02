import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatedBackground } from "@/components/landing/AnimatedBackground";
import { AppSidebar } from "@/components/app/AppSidebar";
import { useProfile, useRealtimeSync, useUser } from "@/lib/finora-data";
import { Loader2 } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile, isLoading } = useProfile();
  useUser();
  useRealtimeSync();

  useEffect(() => {
    if (isLoading) return;
    if (!profile) {
      navigate({ to: "/onboarding", replace: true });
      return;
    }
    if (!profile.onboarding_completed && pathname !== "/onboarding") {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profile, isLoading, pathname, navigate]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="grid place-items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your finances…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-background">
      <AnimatedBackground />
      <AppSidebar />
      <main className="relative z-10 min-w-0 flex-1 px-4 pb-16 pt-20 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
