import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
        return NextResponse.redirect(new URL("/login", request.url))
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

    // Exchange magic-link / OAuth code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        console.error("Auth exchange error:", error)
        return NextResponse.redirect(new URL("/login?error=auth_exchange_failed", request.url))
    }

    // Redirect to dashboard after auth
    return NextResponse.redirect(new URL("/dashboard", request.url))
}
