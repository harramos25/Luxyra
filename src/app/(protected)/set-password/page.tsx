"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SetPasswordPage() {
    const supabase = createClient()
    const router = useRouter()

    const [pw1, setPw1] = React.useState("")
    const [pw2, setPw2] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [msg, setMsg] = React.useState<string | null>(null)

    React.useEffect(() => {
        ; (async () => {
            const { data } = await supabase.auth.getUser()
            if (!data.user) router.push("/login")
        })()
    }, [router, supabase])

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setMsg(null)

        if (pw1.length < 8) return setMsg("Password must be at least 8 characters.")
        if (pw1 !== pw2) return setMsg("Passwords do not match.")

        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password: pw1 })
        setLoading(false)

        if (error) return setMsg(error.message)

        router.push("/onboarding")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-luxyra-plum p-6">
            <div className="relative w-full max-w-md">
                {/* Glow effect */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-luxyra-gold/20 to-luxyra-blush/20 blur-xl opacity-50" />

                <Card className="glass-card w-full max-w-md bg-luxyra-plum/90 border-luxyra-gold/10">
                    <CardHeader>
                        <CardTitle className="text-luxyra-gold text-2xl text-center font-serif">Set your password</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {msg ? (
                            <div className="text-sm text-luxyra-gold border border-luxyra-gold/20 bg-luxyra-gold/5 rounded-xl p-3 text-center">
                                {msg}
                            </div>
                        ) : null}

                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-3">
                                <Input
                                    className="bg-luxyra-deep/50 border-luxyra-gold/20 text-luxyra-blush placeholder:text-luxyra-blush/30"
                                    placeholder="New password"
                                    type="password"
                                    value={pw1}
                                    onChange={(e) => setPw1(e.target.value)}
                                    required
                                />
                                <Input
                                    className="bg-luxyra-deep/50 border-luxyra-gold/20 text-luxyra-blush placeholder:text-luxyra-blush/30"
                                    placeholder="Confirm password"
                                    type="password"
                                    value={pw2}
                                    onChange={(e) => setPw2(e.target.value)}
                                    required
                                />
                            </div>

                            <Button className="btn-gold w-full" isLoading={loading}>
                                Continue
                            </Button>
                        </form>

                        <div className="text-xs text-center text-luxyra-blush/50">
                            Next: Onboarding & Verification
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
