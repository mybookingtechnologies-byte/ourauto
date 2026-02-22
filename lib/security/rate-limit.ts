import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function consumeDbRateLimit(
  userId: string,
  action: "listing_create" | "chat_initiate",
  limit: number,
  windowSeconds: number
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("consume_api_rate_limit", {
    p_user_id: userId,
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error || !Array.isArray(data) || !data[0]) {
    return {
      allowed: false,
      currentCount: limit,
      resetAt: new Date(Date.now() + windowSeconds * 1000).toISOString(),
      error: error?.message ?? "Rate limit service unavailable",
    };
  }

  const row = data[0] as { allowed: boolean; current_count: number; reset_at: string };
  return {
    allowed: row.allowed,
    currentCount: row.current_count,
    resetAt: row.reset_at,
    error: null,
  };
}