import { NextResponse } from "next/server"

// Dev-only endpoint to check presence of critical env vars without exposing secrets.
// Returns booleans for whether each var is set. Safe to deploy but intended for debugging.
export async function GET() {
  try {
    const payload = {
      resendConfigured: !!process.env.RESEND_API_KEY,
      supabaseUrlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKeySet: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV || null,
    }

    return NextResponse.json(payload)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "unknown" }, { status: 500 })
  }
}
