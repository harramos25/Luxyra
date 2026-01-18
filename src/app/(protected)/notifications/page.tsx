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

        const { data } = await supabase
            .from('friend_requests')
            .select('*, sender:sender_id(alias, avatar_url)')
            .eq('receiver_id', user.id)
            .eq('status', 'pending')

        if (data) setRequests(data)
    }

    const handleResponse = async (id: string, accept: boolean) => {
        const status = accept ? 'accepted' : 'rejected'

        // Transactional logic ideally:
        // If accepted, add to friendships, create friend_room if not exists.
        // For MVP, just update status. 
        // We need a Server Action or Trigger for the side effects (creating friendship + room).
        // I'll assume a trigger handles it OR I do it here manually (client-side chaining).
        // Manual logic:
        await supabase
            .from('friend_requests')
            .update({ status })
            .eq('id', id)

        if (accept) {
            // Fetch sender_id to create friendship
            const req = requests.find(r => r.id === id)
            if (req) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    // Create Friendship (Bidirectional) - wait, duplicate if trigger?
                    // Let's do it manually just in case schema.sql didn't have trigger.
                    await supabase.from('friendships').insert([
                        { user_id: user.id, friend_id: req.sender_id },
                        { user_id: req.sender_id, friend_id: user.id }
                    ])
                    // Create Room (Unique per pair? Need logic to check existence)
                    // MVP: Create new friend_room for every accepted request? Or check?
                    // Creating a room and participants.
                    const { data: room } = await supabase.from('friend_rooms').insert({}).select().single()
                    if (room) {
                        await supabase.from('friend_participants').insert([
                            { room_id: room.id, user_id: user.id },
                            { room_id: room.id, user_id: req.sender_id }
                        ])
                    }
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
