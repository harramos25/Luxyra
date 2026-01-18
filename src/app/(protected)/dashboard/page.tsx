"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { findMatch, cancelMatch } from "@/actions/match"
import { Sparkles, Users, Lock, Clock } from "lucide-react"

export default function DashboardPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [matching, setMatching] = useState(false)
    const [matchStatus, setMatchStatus] = useState("")

    useEffect(() => {
        const supabase = createClient()
        const getProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                setProfile(data)
            }
            setLoading(false)
        }
        getProfile()
    }, [])

    const handleStartChat = async () => {
        if (matching) return
        setMatching(true)
        setMatchStatus("Looking for someone special...")

        try {
            // Loop to retry or wait? MVP: just call once.
            // In real app: loop every few seconds or use realtime queue updates.
            // For MVP: simple polling loop for 10s?

            let attempts = 0
            const maxAttempts = 5

            const attemptMatch = async () => {
                const result = await findMatch()

                if (result.roomId) {
                    setMatchStatus("Match found!")
                    router.push(`/chat/stranger?roomId=${result.roomId}`)
                    return true
                } else if (result.status === 'waiting') {
                    setMatchStatus("Waiting for a partner...")
                    return false
                }
                return false
            }

            // Initial try
            if (await attemptMatch()) return

            // Polling
            const interval = setInterval(async () => {
                attempts++
                if (attempts >= maxAttempts) {
                    clearInterval(interval)
                    setMatching(false)
                    setMatchStatus("No one is available right now. Try again?")
                    await cancelMatch() // Clean up
                } else {
                    if (await attemptMatch()) {
                        clearInterval(interval)
                    }
                }
            }, 2000)

        } catch (err: any) {
            setMatching(false)
            setMatchStatus("Error: " + err.message)
        }
    }

    if (loading) return <div className="p-8 text-center text-luxyra-blush animate-pulse">Loading sanctuary...</div>

    const isVerified = profile?.verification_status === 'approved'
    const isPending = profile?.verification_status === 'pending'
    const isRejected = profile?.verification_status === 'rejected'

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Welcome Header */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-serif text-luxyra-gold">
                    Welcome, {profile?.alias || 'Mystery'}
                </h1>
                <p className="text-luxyra-blush/60">Your sanctuary awaits.</p>
            </div>

            {/* Verification Status Banner */}
            {isPending && (
                <Card className="border-yellow-500/30 bg-yellow-900/10">
                    <CardContent className="flex items-center gap-4 p-4">
                        <Clock className="h-6 w-6 text-yellow-500" />
                        <div>
                            <h3 className="text-yellow-500 font-semibold">Verification Pending</h3>
                            <p className="text-sm text-yellow-200/60">An admin is reviewing your selfie. You can browse, but chats are locked.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {isRejected && (
                <Card className="border-red-500/30 bg-red-900/10">
                    <CardContent className="flex items-center gap-4 p-4">
                        <Lock className="h-6 w-6 text-red-500" />
                        <div>
                            <h3 className="text-red-500 font-semibold">Verification Rejected</h3>
                            <p className="text-sm text-red-200/60">Your profile was not approved. Only women 18+ are allowed.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Action Area */}
            {isVerified ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gradient-to-br from-luxyra-deep to-luxyra-plum border-luxyra-gold/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-luxyra-gold/5 group-hover:bg-luxyra-gold/10 transition-all" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-luxyra-gold" />
                                Stranger Chat
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-luxyra-blush/70 mb-6">
                                Connect instantly with a stranger. Ephemeral, safe, and exciting.
                            </p>
                            <Button
                                className="w-full h-12 text-lg shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                                onClick={handleStartChat}
                                disabled={matching}
                            >
                                {matching ? matchStatus : "Start New Chat"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-luxyra-deep/30 border-white/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white/50">
                                <Users className="h-5 w-5" />
                                Friends (Coming Soon)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-luxyra-blush/40 mb-6">
                                Build your circle. Message your connections here.
                            </p>
                            <Button variant="secondary" className="w-full opacity-50 cursor-not-allowed">
                                View Friends
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex justify-center p-12 opacity-50">
                    <div className="text-center">
                        <Lock className="h-12 w-12 text-luxyra-blush/20 mx-auto mb-4" />
                        <p className="text-luxyra-blush/40">Complete verification to unlock chats.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
