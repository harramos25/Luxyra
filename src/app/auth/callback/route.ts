import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")

    // Default to /set-password if no next param (common for signup/recovery)
    // But if 'next' is provided (e.g. from Google login default), respect it or default to dashboard?
    // User's prompt: "const next = url.searchParams.get("next") ?? "/set-password""
    // But for Google Login or returning users, we might not want /set-password every time?
    // Actually, for returning users (Login), we don't use this callback unless it's OAuth.
    // If magic link is used for signup, we set ?next=/set-password explicitly in login page.
    // So defaulting to /set-password here acts as a catch-all for "create account" flow if param missing.
    // For OAuth, we should probably check if they need to set a password?
    // Let's stick to the user's requested logic for predictability.
    const next = url.searchParams.get("next") ?? "/set-password"

    if (!code) {
        return NextResponse.redirect(new URL("/login", url.origin))
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                },
            },
        }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        console.error("Auth exchange error:", error)
        return NextResponse.redirect(new URL("/login?error=auth_exchange_failed", url.origin))
    }

    return NextResponse.redirect(new URL(next, url.origin))
}
