"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, ArrowLeft } from "lucide-react"

export default function FriendChatPage() {
    const params = useParams()
    const roomId = params.roomId as string
    const router = useRouter()
    const supabase = createClient()

    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [userId, setUserId] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)

            // RPC call to enforce history limits (Updated parameters for User SQL)
            // p_room_id, p_viewer_id
            const { data, error } = await supabase.rpc('get_friend_messages', {
                p_room_id: roomId,
                p_viewer_id: user.id
            })

            if (data) setMessages(data)
            if (error) console.error("Error fetching messages:", error)

            setLoading(false)

            // Subscribe to NEW messages
            const channel = supabase
                .channel(`friend-room-${roomId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'friend_messages',
                    filter: `room_id=eq.${roomId}`
                }, (payload) => {
                    setMessages(prev => [...prev, payload.new])
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        if (roomId) init()
    }, [roomId, supabase])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        // Insert
        // Using direct insert (RLS allows participants to insert)
        const { error } = await supabase.from('friend_messages').insert({
            room_id: roomId,
            sender_id: userId,
            content: newMessage
        })

        if (error) {
            alert("Failed to send: " + error.message)
        } else {
            setNewMessage("")
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] p-4 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4 bg-luxyra-deep/30 p-4 rounded-xl backdrop-blur-md">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-luxyra-gold font-semi-bold">Friend Chat</h2>
                    <span className="text-xs text-luxyra-blush/60">Persistent connection</span>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-luxyra-blush/40 animate-pulse">
                    Decrypting conversations...
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
                    {messages.length === 0 && (
                        <p className="text-center text-luxyra-blush/30 text-sm mt-10">
                            No messages visible. (Older messages might be hidden for free users).
                        </p>
                    )}
                    {messages.map((msg) => {
                        const isMe = msg.sender_id === userId // matched RPC response col name
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
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="flex gap-2 relative">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Whisper to a friend..."
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
