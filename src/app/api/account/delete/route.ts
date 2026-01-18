import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function POST() {
    // 1) Get session from request cookies (user must be logged in)
    const cookieStore = await cookies()

    const supabaseAnon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Cookie: cookieStore
                        .getAll()
                        .map((c) => `${c.name}=${c.value}`)
                        .join("; "),
                },
            },
        }
    )

    const { data: authData, error: authErr } = await supabaseAnon.auth.getUser()
    if (authErr || !authData?.user) {
        return new NextResponse("Not authenticated", { status: 401 })
    }

    const userId = authData.user.id

    // 2) Service role client (admin)
    // This key must be in your Server Env Vars (Vercel)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
        return new NextResponse("Server configuration error", { status: 500 })
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    // 3) Clean your tables first (avoid FK errors)
    // Using explicit cleanups for clarity, though cascading deletes might handle some if configured.
    // Friendships and Rooms should ideally cascade, but manual cleanup is safer here.
    await supabaseAdmin.from("match_queue").delete().eq("user_id", userId)
    await supabaseAdmin.from("stranger_rooms").delete().or(`user_a.eq.${userId},user_b.eq.${userId}`)
    await supabaseAdmin.from("friendships").delete().or(`user_a.eq.${userId},user_b.eq.${userId}`)
    await supabaseAdmin.from("profiles").delete().eq("id", userId)

    // 4) Delete auth user
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (delErr) return new NextResponse(delErr.message, { status: 500 })

    return NextResponse.json({ ok: true })
}
