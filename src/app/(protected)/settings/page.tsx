"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSignOut() {
        setLoading(true)
        await supabase.auth.signOut()
        router.push("/login")
        setLoading(false)
    }

    async function handleDeleteAccount() {
        // Safety confirm
        const ok = confirm(
            "Delete account permanently?\n\nThis will remove your profile + authentication user. This cannot be undone."
        )
        if (!ok) return

        setLoading(true)

        // Call server action / api route
        const res = await fetch("/api/account/delete", { method: "POST" })
        if (!res.ok) {
            const text = await res.text()
            alert("Delete failed: " + text)
            setLoading(false)
            return
        }

        router.push("/goodbye")
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-semibold text-luxyra-gold">Settings</h1>

            <Card className="glass-card bg-luxyra-deep/50 border-white/5">
                <CardHeader>
                    <CardTitle className="text-luxyra-gold">Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-luxyra-blush hover:text-white"
                        onClick={handleSignOut}
                        disabled={loading}
                    >
                        Sign out
                    </Button>

                    <div className="pt-2 border-t border-white/10" />

                    <Button
                        className="w-full bg-red-900/10 border border-red-500/30 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                        onClick={handleDeleteAccount}
                        disabled={loading}
                    >
                        Delete account
                    </Button>

                    <p className="text-sm opacity-70 text-luxyra-blush/60">
                        This is permanent. Your profile and auth account will be deleted.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
