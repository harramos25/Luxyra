"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageCircle, Bell, User, Settings, Video, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Sidebar() {
    const pathname = usePathname()

    // TODO: Get active chat state from context/store
    const hasActiveChat = false
    const activeChatId = "temp-id"

    // TODO: Get user profile for VIP ring
    const isPremium = false

    const navItems = [
        { icon: Home, label: "Dashboard", href: "/dashboard" },
        { icon: MessageCircle, label: "Messages", href: "/messages" }, // Friend messages
        { icon: Bell, label: "Notifications", href: "/notifications" },
        { icon: User, label: "Profile", href: "/profile" },
    ]

    return (
        <aside className="fixed left-0 top-0 h-screen w-20 flex flex-col items-center py-8 bg-luxyra-plum border-r border-white/5 z-40">
            <div className="mb-8">
                <div className={cn("h-10 w-10 rounded-full bg-luxyra-gold/20 flex items-center justify-center text-luxyra-gold font-bold", isPremium && "vip-ring")}>
                    L
                </div>
            </div>

            <nav className="flex-1 flex flex-col gap-6 w-full px-2">
                {hasActiveChat && (
                    <Link href={`/chat/stranger`} title="Active Chat">
                        <Button variant="primary" size="sm" className="w-full h-12 rounded-xl bg-luxyra-gold animate-pulse-slow p-0 flex items-center justify-center">
                            <Video className="h-5 w-5 text-luxyra-plum" />
                        </Button>
                    </Link>
                )}

                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all w-full",
                                isActive
                                    ? "bg-luxyra-deep text-luxyra-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                                    : "text-luxyra-blush/50 hover:text-luxyra-blush hover:bg-white/5"
                            )}
                        >
                            <item.icon className="h-6 w-6" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-auto flex flex-col gap-4 w-full px-2">
                <Link
                    href="/settings"
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all w-full text-luxyra-blush/50 hover:text-luxyra-blush hover:bg-white/5",
                        pathname === "/settings" && "bg-luxyra-deep text-luxyra-gold"
                    )}
                >
                    <Settings className="h-6 w-6" />
                </Link>

                <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all w-full text-red-400/50 hover:text-red-400 hover:bg-red-900/10">
                    <LogOut className="h-6 w-6" />
                </button>
            </div>
        </aside>
    )
}
