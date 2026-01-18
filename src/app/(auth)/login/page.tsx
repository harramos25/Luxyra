"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")

        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        })

        if (error) {
            setMessage("Error: " + error.message)
        } else {
            setMessage("Check your email for the magic link!")
        }
        setLoading(false)
    }

    const handleGoogleLogin = async () => {
        const supabase = createClient()
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        })
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-luxyra-plum p-4">
            <div className="relative w-full max-w-md">
                {/* Glow effect */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-luxyra-gold/20 to-luxyra-blush/20 blur-xl opacity-50" />

                <Card className="relative bg-luxyra-plum/90 border-luxyra-gold/10">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-luxyra-gold/10 ring-1 ring-luxyra-gold/50">
                            <Lock className="h-8 w-8 text-luxyra-gold" />
                        </div>
                        <CardTitle className="text-3xl font-serif text-luxyra-gold">Luxyra</CardTitle>
                        <p className="text-luxyra-blush/60 mt-2">Enter the sanctuary.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input
                                type="email"
                                placeholder="yours@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-luxyra-deep/50 border-luxyra-gold/20"
                            />
                            <Button type="submit" className="w-full" isLoading={loading}>
                                Send Magic Link
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-luxyra-plum px-2 text-white/30">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            type="button"
                            className="w-full"
                            onClick={handleGoogleLogin}
                        >
                            Google
                        </Button>

                        {message && (
                            <p className="text-center text-sm text-luxyra-gold mt-4 animate-pulse">
                                {message}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
