"use server"

import { createClient } from "@/lib/supabase/server"
import { differenceInYears } from "date-fns"

export async function findMatch() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // 1. Strict Access Control Check
    const { data: profile } = await supabase
        .from('profiles')
        .select('verification_status, birthday')
        .eq('id', user.id)
        .single()

    if (!profile) throw new Error("Profile not found")

    // Check 18+ (Double check server side)
    const age = differenceInYears(new Date(), new Date(profile.birthday))
    if (age < 18) throw new Error("Age requirement not met")

    // Check Verification
    if (profile.verification_status !== 'approved') {
        throw new Error("Verification pending or rejected")
    }

    // 2. Queue Cleanup (Remove stale and OWN old entries)
    await supabase.from('match_queue').delete().eq('user_id', user.id)

    // 3. Find Match (Avoid Self, Avoid Recent? - MVP just avoids self)
    // We want someone who is NOT me.
    const { data: potentialMatches } = await supabase
        .from('match_queue')
        .select('user_id, created_at')
        .neq('user_id', user.id)
        .order('created_at', { ascending: true }) // Oldest first (FIFO)
        .limit(5) // Fetch a few to filter

    let partnerId = null

    // Filter stale matches in memory if we can't delete them easily
    const validMatches = potentialMatches?.filter(m => {
        const isFresh = new Date(m.created_at).getTime() > (Date.now() - 60000)
        return isFresh
    })

    if (validMatches && validMatches.length > 0) {
        partnerId = validMatches[0].user_id
    }

    if (partnerId) {
        // MATCH FOUND

        // Attempt to remove partner from queue (Atomic lock ideal, but delete works for MVP)
        const { error: deleteError } = await supabase
            .from('match_queue')
            .delete()
            .eq('user_id', partnerId)

        if (deleteError) {
            // Someone else snatched them or they left. Retry?
            return { status: 'retry' }
        }

        // Create Room using user_a / user_b structure (Updated for User SQL)
        const { data: room, error: roomError } = await supabase
            .from('stranger_rooms')
            .insert({
                user_a: user.id,
                user_b: partnerId,
                is_active: true
            })
            .select()
            .single()

        if (roomError || !room) throw new Error("Failed to create room: " + roomError?.message)

        return { roomId: room.id }

    } else {
        // NO MATCH -> Join Queue
        await supabase
            .from('match_queue')
            .insert({ user_id: user.id }) // Timestamp default now()

        return { status: 'waiting' }
    }
}

export async function cancelMatch() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        await supabase.from('match_queue').delete().eq('user_id', user.id)
    }
}
