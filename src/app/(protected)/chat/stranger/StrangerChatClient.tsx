"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sendMessage, deleteStrangerRoom } from "@/actions/chat"
import { Send, SkipForward } from "lucide-react"

export default function StrangerChatClient() {
    const searchParams = useSearchParams()
    const roomId = searchParams.get('roomId')
    const router = useRouter()
    const supabase = createClient()

    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [userId, setUserId] = useState<string>("")
    const [active, setActive] = useState(true)
    const [skipped, setSkipped] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!roomId) {
            router.push('/dashboard')
            return
        }

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserId(user.id)

            // Load initial history? (Ephemeral, maybe empty initially or just what's there)
            const { data } = await supabase
                .from('stranger_messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true })

            if (data) setMessages(data)

            // Subscribe
            const channel = supabase
                .channel(`room-${roomId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'stranger_messages',
                    filter: `room_id=eq.${roomId}`
                }, (payload) => {
                    setMessages(prev => [...prev, payload.new])
                    // Scroll to bottom
                })
                .on('postgres_changes', {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'stranger_rooms',
                    filter: `id=eq.${roomId}`
                }, () => {
                    // Room deleted (skipped by partner or me)
                    setActive(false)
                    setSkipped(true)
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        init()
    }, [roomId, router, supabase])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !active) return

        // Optimistic update?
        const tempMsg = {
            id: 'temp-' + Date.now(),
            content: newMessage,
            user_id: userId,
            created_at: new Date().toISOString()
        }
        // setMessages(prev => [...prev, tempMsg]) // Realtime will add it, might duplicate if not careful
        // Better to wait for realtime or just clear input
        setNewMessage("")

        await sendMessage(roomId!, tempMsg.content)
    }

    const handleSkip = async () => {
        if (!roomId) return
        if (confirm("Are you sure? This will delete the chat instantly.")) {
            await deleteStrangerRoom(roomId)
            router.push('/dashboard')
        }
    }

    if (skipped) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center">
                <div className="bg-luxyra-deep/50 p-8 rounded-2xl border border-white/5">
                    <p className="text-xl text-luxyra-blush mb-4">You let her go.</p>
                    <div className="flex gap-4">
                        <Button onClick={() => router.push('/dashboard')}>Dashboard</Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] p-4 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 bg-luxyra-deep/30 p-4 rounded-xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-luxyra-gold to-luxyra-blush animate-pulse" />
                    <div>
                        <h2 className="text-luxyra-gold font-semi-bold">Stranger</h2>
                        <span className="text-xs text-green-400 flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-green-400" />
                            Her presence is active
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">Report</Button>
                    <Button variant="secondary" onClick={handleSkip} className="flex items-center gap-2">
                        <SkipForward className="h-4 w-4" />
                        Skip
                    </Button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
                {messages.map((msg) => {
                    const isMe = msg.user_id === userId
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-2xl ${isMe
                                ? 'bg-luxyra-gold text-luxyra-plum rounded-tr-sm'
                                : 'bg-luxyra-deep text-luxyra-blush rounded-tl-sm border border-white/5'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex gap-2 relative">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Say something mysterious..."
                    className="pr-12 bg-luxyra-deep/80"
                />
                <Button
                    type="submit"
                    size="sm"
                    className="absolute right-1 top-1 h-10 w-10 rounded-lg p-0 bg-transparent text-luxyra-gold hover:bg-luxyra-gold/10 hover:text-luxyra-gold"
                    disabled={!newMessage.trim()}
                >
                    <Send className="h-5 w-5" />
                </Button>
            </form>
        </div>
    )
}
