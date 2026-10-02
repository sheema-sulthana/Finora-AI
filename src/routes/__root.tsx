import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>

        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * IMPORTANT DEVELOPMENT ERROR SCREEN
 *
 * The previous version hid the actual exception and only showed:
 *
 * "This page didn't load"
 *
 * That made it impossible to diagnose dashboard failures.
 *
 * This version displays the real error during development.
 */
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("FINORA DASHBOARD ERROR:", error);

  const router = useRouter();

  const message = error instanceof Error ? error.message : String(error);

  const stack = error instanceof Error ? error.stack : undefined;

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-6 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-400">
              !
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold">Finora AI encountered an error</h1>

              <p className="mt-1 text-sm text-muted-foreground">
                The page crashed while loading. The exact error is shown below.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-red-500/20 bg-black/30 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-400">
              Error message
            </p>

            <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-red-200">
              {message}
            </pre>
          </div>

          {stack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                Show technical stack
              </summary>

              <pre className="mt-3 max-h-[400px] overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-[11px] leading-relaxed text-muted-foreground">
                {stack}
              </pre>
            </details>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => {
                router.invalidate();
                reset();
              }}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Try again
            </button>

            <a
              href="/"
              className="rounded-xl border border-white/10 bg-background px-4 py-2 text-sm font-medium"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },

      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },

      {
        title: "Finora AI",
      },

      {
        name: "description",
        content: "AI-powered personal finance platform.",
      },

      {
        name: "author",
        content: "Finora AI",
      },

      {
        property: "og:type",
        content: "website",
      },

      {
        name: "twitter:card",
        content: "summary_large_image",
      },

      {
        property: "og:title",
        content: "Finora AI",
      },

      {
        name: "twitter:title",
        content: "Finora AI",
      },

      {
        property: "og:description",
        content: "AI-powered personal finance platform.",
      },

      {
        name: "twitter:description",
        content: "AI-powered personal finance platform.",
      },

      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/5770352c-4f02-46b9-b29e-c3f9007baf7e",
      },

      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/5770352c-4f02-46b9-b29e-c3f9007baf7e",
      },
    ],

    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },

      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },

      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap",
      },

      {
        rel: "stylesheet",
        href: appCss,
      },

      {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
  }),

  shellComponent: RootShell,

  component: RootComponent,

  notFoundComponent: NotFoundComponent,

  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>

      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  const router = useRouter();

  useEffect(() => {
    void supabase.auth.getSession();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") {
        return;
      }

      void router.invalidate();

      if (event !== "SIGNED_OUT") {
        void queryClient.invalidateQueries();
      }
    });

    return () => data.subscription.unsubscribe();
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
