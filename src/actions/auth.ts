"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function signInWithMagicLink(email: string) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    } catch (error) {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    // Use the origin from the request headers or fall back to a default (though server actions run on server)
    // We can't easily get window.location in server action.
    // We'll rely on NEXT_PUBLIC_SITE_URL or vercel env, or hardcode relative path if supported?
    // Supabase needs absolute URL.
    // Best practice: Pass the origin from the client or use env var. 
    // For now, let's assume one of the standard Vercel URLs or localhost.

    let origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    if (process.env.VERCEL_URL) origin = `https://${process.env.VERCEL_URL}`
    // Better: Let the client pass the origin? No, security.
    // Let's rely on a robust env var or just constructed localhost for dev / production URL.
    // Actually, we can assume the user has configured Site URL in Supabase, but emailRedirectTo overrides.

    // Determine the base URL for the redirect
    // We prefer the explicit NEXT_PUBLIC_SITE_URL if set, otherwise fallback
    // Note: On Vercel, usage of 'window.location' on client is best, but on server we need env vars.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://luxyra-chat.vercel.app"

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
        },
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}
