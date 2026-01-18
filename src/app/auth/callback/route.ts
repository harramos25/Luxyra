import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/dashboard"

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Check if user has profile, if not redirect to verify-selfie or onboarding
            // For now, redirect to next (which might check middleware or page logic)

            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Check profile
                const { data: profile } = await supabase.from('profiles').select('verification_status').eq('id', user.id).single()

                // If no profile, they need to verify selfie first
                if (!profile) {
                    return NextResponse.redirect(`${origin}/verify-selfie`)
                }
                if (profile.verification_status === 'pending' || profile.verification_status === 'rejected') {
                    // Usually dashboard handles pending state, but if strictly enforcing:
                    // return NextResponse.redirect(`${origin}/dashboard`) 
                    // We'll let dashboard handle it.
                }
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
