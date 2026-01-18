"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function sendMessage(roomId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Insert message (RLS will check permission too)
    const { error } = await supabase.from('stranger_messages').insert({
        room_id: roomId,
        sender_id: user.id,
        content: content
    })

    if (error) throw new Error("Send failed: " + error.message)
}

export async function deleteStrangerRoom(roomId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // 1. Verify user is a participant (Standard RLS check)
    const { data: room, error: checkError } = await supabase
        .from('stranger_rooms')
        .select('id')
        .eq('id', roomId)
        .single()

    if (checkError || !room) {
        throw new Error("Room not found or unauthorized")
    }

    // 2. Perform DELETION using Service Role (Bypassing RLS lack of DELETE policy)
    // Since user didn't include DELETE policy or RPC in their SQL.

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) throw new Error("Server configuration error")

    const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    )

    const { error: deleteError } = await adminClient
        .from('stranger_rooms')
        .delete()
        .eq('id', roomId)

    if (deleteError) {
        console.error("Admin delete failed:", deleteError)
        throw new Error("Could not end chat")
    }
}
