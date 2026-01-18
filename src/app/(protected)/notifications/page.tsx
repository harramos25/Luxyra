"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

export default function NotificationsPage() {
    const [requests, setRequests] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Select sender info (assuming 'sender' alias isn't setup via foreign key automatically in pure TS)
        // With schema provided, 'from_user' refs 'profiles'.
        // So query should follow 'from_user' FK if Supabase inferred it, OR just fetch manually.
        // User's SQL: `from_user uuid not null references public.profiles(id)`
        // Supabase often aliases as `profiles` unless named.
        const { data, error } = await supabase
            .from('friend_requests')
            .select('*, sender:from_user(alias, avatar_url)') // Changed 'sender_id' to 'from_user'
            .eq('to_user', user.id) // Changed 'receiver_id' to 'to_user'
            .eq('status', 'pending')

        if (data) setRequests(data)
    }

    const handleResponse = async (id: string, accept: boolean) => {
        const status = accept ? 'accepted' : 'declined' // User's Enum: 'accepted', 'declined' (not rejected)

        const { error } = await supabase
            .from('friend_requests')
            .update({ status })
            .eq('id', id)

        if (error) {
            alert("Error: " + error.message)
            return
        }

        if (accept) {
            const req = requests.find(r => r.id === id)
            if (req) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    // Create Friendship (Bidirectional)
                    // User's SQL: `insert into friendships(user_id, friend_id) ...`
                    // Their SQL table `friendships` has `user_id` and `friend_id` and `unique`.
                    // We typically insert BOTH ways for easier select.
                    await supabase.from('friendships').insert([
                        { user_id: user.id, friend_id: req.from_user }, // Changed sender_id to from_user
                        { user_id: req.from_user, friend_id: user.id }
                    ])

                    // Create Room
                    // User's SQL: `friend_rooms` with `user_a` and `user_b` and `unique(user_a, user_b)`
                    // We need to order them (e.g. alphanumeric) or just insert and let Unique constraint fail if exists.
                    // Or try inserting.
                    const [u1, u2] = [user.id, req.from_user].sort()
                    await supabase.from('friend_rooms').upsert({ // Upsert safe for unique constraint
                        user_a: u1,
                        user_b: u2
                    }, { onConflict: 'user_a,user_b' })
                }
            }
        }

        setRequests(prev => prev.filter(r => r.id !== id))
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl text-luxyra-gold font-serif">Notifications</h1>

            <div className="space-y-4">
                <h2 className="text-luxyra-blush uppercase text-xs tracking-widest">Friend Requests</h2>
                {requests.length === 0 && <p className="text-luxyra-blush/40 italic">No new desires.</p>}

                {requests.map(req => (
                    <Card key={req.id} className="bg-luxyra-deep/40 border-luxyra-gold/10">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-luxyra-plum" />
                                <div>
                                    <CardTitle className="text-base">{req.sender?.alias}</CardTitle>
                                    <p className="text-xs text-luxyra-blush/60">Wants to connect.</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleResponse(req.id, true)} className="bg-luxyra-gold/20 text-luxyra-gold hover:bg-luxyra-gold hover:text-luxyra-plum">
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleResponse(req.id, false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
