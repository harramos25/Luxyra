"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Sparkles, Home, Bell, MessageSquare, LogOut, Settings, User } from "lucide-react"

export function Sidebar() {
    const pathname = usePathname()
    const [friendRooms, setFriendRooms] = useState<any[]>([])
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchChats = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUser(user)

            // Fetch active friend rooms
            // User SQL: friend_rooms has user_a, user_b
            const { data } = await supabase
                .from('friend_rooms')
                .select('*')
                .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

            if (data) {
                // For each room, fetch the *other* user's details for display
                // This is N+1 but fine for MVP length list
                const enriched = await Promise.all(data.map(async (room) => {
                    const otherId = room.user_a === user.id ? room.user_b : room.user_a
                    const { data: otherProfile } = await supabase
                        .from('profiles')
                        .select('alias, avatar_url')
                        .eq('id', otherId)
                        .single()
                    return { ...room, otherProfile }
                }))
                setFriendRooms(enriched)
            }
        }
        fetchChats()
    }, [])

    const links = [
        { href: "/dashboard", label: "Sanctuary", icon: Home },
        { href: "/notifications", label: "Notifications", icon: Bell },
        { href: "/settings", label: "Settings", icon: Settings },
        // { href: "/messages", label: "Messages", icon: MessageSquare }, // Replaced by dynamic list
    ]

    return (
        <aside className="w-64 border-r border-white/5 bg-luxyra-deep/90 backdrop-blur-xl h-screen flex flex-col fixed left-0 top-0 z-50">
            {/* Brand */}
            <div className="p-6">
                <h1 className="text-2xl font-serif tracking-widest text-luxyra-gold">LUXYRA</h1>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 space-y-2">
                {links.map(link => {
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                                isActive
                                    ? "bg-luxyra-gold/10 text-luxyra-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                                    : "text-luxyra-blush/60 hover:text-luxyra-blush hover:bg-white/5"
                            )}
                        >
                            <link.icon className="h-5 w-5" />
                            <span className="text-sm font-medium">{link.label}</span>
                        </Link>
                    )
                })}

                <div className="pt-6 pb-2">
                    <p className="px-4 text-xs uppercase tracking-widest text-luxyra-blush/30 mb-2">Private Chats</p>
                    <div className="space-y-1">
                        {friendRooms.length === 0 && (
                            <p className="px-4 text-xs text-luxyra-blush/20 italic">No connections yet.</p>
                        )}
                        {friendRooms.map(room => (
                            <Link
                                key={room.id}
                                href={`/chat/friend/${room.id}`}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all",
                                    pathname === `/chat/friend/${room.id}`
                                        ? "bg-luxyra-gold/5 text-luxyra-champagne"
                                        : "text-luxyra-blush/50 hover:text-luxyra-blush hover:bg-white/5"
                                )}
                            >
                                <div className="h-8 w-8 rounded-full bg-luxyra-plum border border-white/10 overflow-hidden relative">
                                    {/* Avatar placeholder */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-luxyra-gold/20 to-transparent" />
                                </div>
                                <span className="text-sm truncate">{room.otherProfile?.alias || 'Unknown'}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Footer / User */}
            <div className="p-4 border-t border-white/5">
                <Link href="/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="h-10 w-10 rounded-full border border-luxyra-gold/30 bg-luxyra-plum flex items-center justify-center">
                        <User className="h-5 w-5 text-luxyra-gold" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-luxyra-blush">My Profile</p>
                        <p className="text-xs text-luxyra-gold/60">Premium Member</p>
                    </div>
                </Link>
            </div>
        </aside>
    )
}
