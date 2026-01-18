"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck } from "lucide-react"

interface ProfileModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    alias: string
    bio?: string
    isStranger?: boolean
    viewerIsPremium?: boolean
}

export function ProfileModal({ isOpen, onClose, userId, alias, bio, isStranger, viewerIsPremium }: ProfileModalProps) {
    const [requestSent, setRequestSent] = useState(false)

    const handleAddFriend = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check if already friends or requested? 
        // For MVP, just insert request. Unique constraint handles duplicates.
        const { error } = await supabase
            .from('friend_requests')
            .insert({
                sender_id: user.id,
                receiver_id: userId
            })

        if (!error) {
            setRequestSent(true)
        } else {
            alert("Could not send request: " + error.message)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={alias}>
            <div className="space-y-6">
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-luxyra-gold to-luxyra-blush animate-pulse" />
                </div>

                <div className="text-center space-y-2">
                    <p className="text-luxyra-blush/80 italic">"{bio || 'Currently thinking...'}"</p>
                </div>

                {isStranger && (
                    <div className="pt-4 border-t border-white/10">
                        {requestSent ? (
                            <Button className="w-full" disabled variant="secondary">
                                <UserCheck className="mr-2 h-4 w-4" />
                                Request Sent
                            </Button>
                        ) : (
                            <Button className="w-full" onClick={handleAddFriend}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Friend
                            </Button>
                        )}
                        <p className="text-xs text-center text-luxyra-blush/40 mt-2">
                            {viewerIsPremium ? "You can see her interests." : "Upgrade to see more details."}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    )
}
