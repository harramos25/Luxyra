"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallbackInner() {
    const router = useRouter()
    const params = useSearchParams()
    const supabase = createClient()
    const hasRun = React.useRef(false)

    React.useEffect(() => {
        if (hasRun.current) return
        hasRun.current = true

            ; (async () => {
                const { data, error } = await supabase.auth.getSession()

                if (error) {
                    console.error("Auth Callback Error:", error)
                    router.replace(`/login?error=auth_callback_failed&reason=${encodeURIComponent(error.message)}`)
                    return
                }

                if (!data.session) {
                    // Retry logic or hard fail? 
                    // If getting session failed without error, it implies no session found in storage/URL.
                    console.warn("No session found in callback")
                    // router.replace("/login?error=no_session")
                    // return
                }

                // ✅ CRITICAL: Sync Server state
                // router.refresh() forces Next.js to re-run middleware and server components
                // with the newly set cookies/session.
                router.refresh()

                // Short delay to ensure cookies stick? 
                // Sometimes helpful but router.refresh typically handles the server sync roundtrip.
                await new Promise(r => setTimeout(r, 100))

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
