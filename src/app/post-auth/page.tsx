"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function PostAuthPage() {
    const router = useRouter()
    const supabase = createClient()
    const [status, setStatus] = useState("Checking account status...")

    useEffect(() => {
        async function decideRoute() {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                // Not authenticated, back to login
                return router.replace("/login")
            }

            // Check profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            if (!profile) {
                // If no profile exists, create one (or handle it)
                // Assuming triggers might handle it, but if manual:
                // For now, let's assume if no profile, we need to init one or send to onboarding
                setStatus("Initializing profile...")
                // Insert basic profile row here if not auto-created by triggers
                // But usually, we just redirect to onboarding which handles profile completion.
                // If triggers are robust, profile exists. If not, we might fail here.
                // Let's assume we proceed to onboarding.
                return router.replace("/onboarding")
            }

            if (!profile.onboarding_completed) {
                setStatus("Redirecting to onboarding...")
                return router.replace("/onboarding")
            }

            if (profile.verification_status !== "approved") {
                setStatus("Redirecting to verification...")
                return router.replace("/verify-selfie")
            }

            setStatus("Redirecting to dashboard...")
            router.replace("/dashboard")
        }

        decideRoute()
    }, [router, supabase])

    return (
        <div className="min-h-screen flex items-center justify-center bg-luxyra-plum text-luxyra-gold font-serif animate-pulse">
            {status}
        </div>
    )
}
