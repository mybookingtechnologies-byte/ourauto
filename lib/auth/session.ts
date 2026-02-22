import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      errorResponse: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
      user: null,
      supabase,
    };
  }

  return { errorResponse: null, user, supabase };
}