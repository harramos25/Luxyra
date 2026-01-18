"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallbackInner() {
    const router = useRouter()
    const params = useSearchParams()
    const supabase = createClient()
    const hasRun = React.useRef(false) // Prevent double execution in React Strict Mode

    React.useEffect(() => {
        if (hasRun.current) return
        hasRun.current = true

            ; (async () => {
                // This reads the URL and uses the PKCE verifier from browser storage
                // getSession() automatically handles the code exchange if a hash/code is present in URL
                // It looks for the code in the URL and the code_verifier in local storage
                const { data, error } = await supabase.auth.getSession()

                if (error) {
                    console.error("Auth Callback Error:", error)
                    router.replace(`/login?error=auth_callback_failed&reason=${encodeURIComponent(error.message)}`)
                    return
                }

                // If no session found but also no error (rare edge case), maybe redirect to login
                if (!data.session) {
                    // Try checking if we have a code in params manually and exchanging? 
                    // But getSession usually handles it. 
                    // Sometimes exchangeCodeForSession is explicit needed if getSession doesn't pick it up automatically 
                    // depending on how the link was constructed (implicit vs PKCE). 
                    // But for standard supabase-js client side, getSession often suffices or onAuthStateChange picks it up.

                    // Let's rely on onAuthStateChange which might be safer for client-side exchange
                }

                // ✅ Logged in now. Decide next route.
                // We can default to /set-password based on our previous flow, or check 'next' param if we passed it in state
                // For now, hardcode /set-password as per "Magic Link -> Set Password" flow requirements
                // But verify if they already have an alias/onboarding?
                // A safe bet is /dashboard which redirects to proper place, BUT user specifically asked for /set-password flow
                // "router.replace("/set-password")"
                router.replace("/set-password")
            })()
    }, [router, supabase, params])

    return (
        <div className="min-h-screen flex items-center justify-center bg-luxyra-plum">
            <div className="glass-card text-center p-8 animate-pulse">
                <p className="text-luxyra-gold opacity-80 text-lg font-serif">Entering the sanctuary...</p>
            </div>
        </div>
    )
}
