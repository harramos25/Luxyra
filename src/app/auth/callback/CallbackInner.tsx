"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function CallbackInner() {
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
                    console.warn("No session found in callback")
                    // router.replace("/login?error=no_session")
                    // return
                }

                // Sync Server state
                router.refresh()

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
