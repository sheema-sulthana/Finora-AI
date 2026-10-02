import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthDestination = "/dashboard" | "/onboarding";

const AUTH_TIMEOUT_MS = 20_000;

export async function withAuthTimeout<T>(promise: PromiseLike<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("AUTH_TIMEOUT")), AUTH_TIMEOUT_MS);
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function authErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("invalid login credentials")) return "Invalid email or password.";
  if (message.includes("email not confirmed")) return "Your email has not been verified.";
  if (
    message.includes("auth_timeout") ||
    message.includes("failed to fetch") ||
    message.includes("network")
  ) {
    return "Unable to connect to the authentication service. Please try again.";
  }
  if (message.includes("user already registered"))
    return "An account with this email already exists.";
  return error instanceof Error ? error.message : "Authentication failed. Please try again.";
}

export async function ensureProfileAndGetDestination(user: User): Promise<AuthDestination> {
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing.onboarding_completed ? "/dashboard" : "/onboarding";

  const metadata = user.user_metadata ?? {};
  const fullName = String(metadata["full_name"] ?? metadata["name"] ?? "");
  const avatarUrl = typeof metadata["avatar_url"] === "string" ? metadata["avatar_url"] : null;
  const { error: createError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      email: user.email ?? "",
      avatar_url: avatarUrl,
      onboarding_completed: false,
    },
    { onConflict: "id" },
  );
  if (createError) throw createError;
  return "/onboarding";
}
