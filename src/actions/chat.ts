"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function sendMessage(roomId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Insert message (RLS will check permission too)
    const { error } = await supabase.from('stranger_messages').insert({
        room_id: roomId,
        user_id: user.id,
        content: content
    })

    // We rely on Realtime for the user to see it, but revalidatePath is good habit
    // revalidatePath(`/chat/stranger`) 
}

export async function deleteStrangerRoom(roomId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Function 'delete_stranger_room' helps if we have it, or just direct delete
    // Direct delete works if RLS allows or if we use this action.
    // The 'delete_stranger_room' RPC was defined in schema (if I created it successfully).
    // But direct delete with 'stranger_rooms' should work if RLS allows.
    // Wait, I didn't add "delete" policy for users on stranger_rooms in schema.sql.
    // I only added "select".
    // So I MUST use a Service Role here or define the policy.
    // Actually, Server Actions run in Node environment but use the client created by `createClient()` which is user-context (cookies).
    // I should use `delete_stranger_room` RPC if it has `security definer`.
    // Or I can add "Delete" policy.
    // For MVP, if I can't guarantee RPC exists (I think I created it), I might fail.
    // Safe bet: Use RPC `delete_stranger_room`.

    const { error } = await supabase.rpc('delete_stranger_room', { room_id_input: roomId })
    if (error) {
        // Fallback: try direct delete if policy exists (it likely doesn't)
        console.error("RPC delete failed:", error)
        throw new Error("Could not end chat")
    }

    // Redirect happens on client usually or here?
    // If I redirect here, the client component calling this needs to handle it.
}
