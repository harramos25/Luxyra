"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Mode = "login" | "create"

export default function LoginPage() {
    const supabase = createClient()
    const router = useRouter()

    const [mode, setMode] = React.useState<Mode>("login")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [msg, setMsg] = React.useState<string | null>(null)

    async function handleLoginPassword(e: React.FormEvent) {
        e.preventDefault()
        setMsg(null)
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        setLoading(false)
        if (error) return setMsg(error.message)

        router.push("/dashboard")
    }

    async function handleCreateAccountPassword(e: React.FormEvent) {
        e.preventDefault()
        setMsg(null)
        setLoading(true)

        if (password !== confirmPassword) {
            setLoading(false)
            return setMsg("Passwords do not match.")
        }

        // SignUp with Email + Password + generic options
        // We set emailRedirectTo to callback?next=/verify-email just in case user clicks a link,
        // but primarily we expect them to enter code manually.
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?next=/verify-email`,
            },
        })

        setLoading(false)
        if (error) return setMsg(error.message)

        // For OTP flow, we don't wait for a link redirect.
        // We assume success means "code sent".
        // Redirect to OTP page.
        // Pass email in query param so OTP page knows who to verify.
        router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    }

    async function handleGoogle() {
        setMsg(null)
        setLoading(true)

        const redirectTo = `${window.location.origin}/auth/callback`

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo },
        })

        setLoading(false)
        if (error) setMsg(error.message)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-luxyra-plum p-6">
            <div className="relative w-full max-w-md">
                {/* Glow effect */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-luxyra-gold/20 to-luxyra-blush/20 blur-xl opacity-50" />

                <Card className="glass-card w-full max-w-md relative bg-luxyra-plum/90 border-luxyra-gold/10">
                    <CardHeader>
                        <CardTitle className="text-luxyra-gold text-2xl text-center font-serif">
                            Luxyra
                        </CardTitle>
                        <div className="mt-4 flex gap-2 justify-center">
                            <button
                                type="button"
                                onClick={() => setMode("login")}
                                className={`px-6 py-2 rounded-full text-sm transition-all duration-300 font-medium ${mode === "login"
                                    ? "bg-luxyra-gold/20 text-luxyra-gold border border-luxyra-gold/40 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                                    : "text-luxyra-blush/60 hover:text-luxyra-blush hover:bg-white/5"
                                    }`}
                            >
                                Log in
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("create")}
                                className={`px-6 py-2 rounded-full text-sm transition-all duration-300 font-medium ${mode === "create"
                                    ? "bg-luxyra-blush/20 text-luxyra-blush border border-luxyra-blush/40 shadow-[0_0_10px_rgba(242,193,209,0.2)]"
                                    : "text-luxyra-blush/60 hover:text-luxyra-blush hover:bg-white/5"
                                    }`}
                            >
                                Create account
                            </button>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {msg ? (
                            <div className="text-sm text-luxyra-gold border border-luxyra-gold/20 bg-luxyra-gold/5 rounded-xl p-3 text-center animate-pulse">
                                {msg}
                            </div>
                        ) : null}

                        <div className="space-y-3">
                            <Input
                                className="bg-luxyra-deep/50 border-luxyra-gold/20 text-luxyra-blush placeholder:text-luxyra-blush/30"
                                placeholder="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            {/* Password input moved inside specific forms for granular control */}
                        </div>

                        {mode === "login" ? (
                            <form onSubmit={handleLoginPassword} className="space-y-4">
                                <Input
                                    className="bg-luxyra-deep/50 border-luxyra-gold/20 text-luxyra-blush placeholder:text-luxyra-blush/30"
                                    placeholder="Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <Button className="btn-gold w-full mt-2" isLoading={loading}>
                                    Log in
                                </Button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        className="text-xs text-luxyra-blush/50 hover:text-luxyra-gold transition-colors"
                                        onClick={async () => {
                                            if (!email) return setMsg("Enter your email first.")
                                            setLoading(true)
                                            const redirectTo = `${window.location.origin}/auth/callback?next=/set-password`
                                            // Handle password reset
                                            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                                                redirectTo,
                                            })
                                            setLoading(false)
                                            if (error) return setMsg(error.message)
                                            setMsg("Password reset email sent.")
                                        }}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleCreateAccountPassword} className="space-y-4">
                                <Input
                                    className="bg-luxyra-deep/50 border-luxyra-gold/20 text-luxyra-blush placeholder:text-luxyra-blush/30"
                                    placeholder="Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <Input
                                    className="bg-luxyra-deep/50 border-luxyra-gold/20 text-luxyra-blush placeholder:text-luxyra-blush/30"
                                    placeholder="Confirm Password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <Button className="btn-gold w-full mt-2" isLoading={loading}>
                                    Create Account
                                </Button>
                            </form>
                        )}

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/5" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-luxyra-plum px-2 text-white/20">or</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full border-white/10 hover:bg-white/5 text-luxyra-blush"
                            onClick={handleGoogle}
                            disabled={loading}
                        >
                            Continue with Google
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
