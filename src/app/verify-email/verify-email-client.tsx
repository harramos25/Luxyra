"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyEmailClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const emailParam = searchParams.get("email")

    const [email, setEmail] = React.useState(emailParam ?? "")
    const [otp, setOtp] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [msg, setMsg] = React.useState<string | null>(
        "We sent a 6-digit code to your email."
    )

    const supabase = createClient()

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault()
        setMsg(null)
        setLoading(true)

        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: "signup",
        })

        if (error) {
            setLoading(false)
            setMsg(error.message)
            return
        }

        // Success!
        // Redirect to post-auth routing logic
        router.push("/post-auth")
    }

    async function handleResend() {
        setMsg("Resending...")
        setLoading(true)
        const { error } = await supabase.auth.resend({
            type: "signup",
            email,
        })
        setLoading(false)
        if (error) setMsg(error.message)
        else setMsg("Code resent. Check your email again.")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-luxyra-plum p-6">
            <div className="relative w-full max-w-md">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-luxyra-gold/20 to-luxyra-blush/20 blur-xl opacity-50" />
                <Card className="glass-card w-full max-w-md relative bg-luxyra-plum/90 border-luxyra-gold/10">
                    <CardHeader>
                        <CardTitle className="text-luxyra-gold text-2xl text-center font-serif">
                            Verify Email
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {msg && (
                            <div className="text-sm text-luxyra-gold border border-luxyra-gold/20 bg-luxyra-gold/5 rounded-xl p-3 text-center">
                                {msg}
                            </div>
                        )}

                        <form onSubmit={handleVerify} className="space-y-4">
                            <Input
                                className="bg-luxyra-deep/50 border-luxyra-gold/20 text-luxyra-blush placeholder:text-luxyra-blush/30"
                                placeholder="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Input
                                className="bg-luxyra-deep/50 border-luxyra-gold/20 text-luxyra-blush placeholder:text-luxyra-blush/30 tracking-widest text-center text-lg"
                                placeholder="000000"
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                            <Button className="btn-gold w-full mt-2" isLoading={loading}>
                                Verify Code
                            </Button>
                        </form>

                        <div className="text-center">
                            <button
                                type="button"
                                className="text-xs text-luxyra-blush/50 hover:text-luxyra-gold transition-colors"
                                onClick={handleResend}
                                disabled={loading}
                            >
                                Didn't receive code? Resend
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
