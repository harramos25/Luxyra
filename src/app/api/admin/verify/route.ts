import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function isAdmin(email: string | null | undefined) {
    if (!email) return false
    const admins = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    return admins.includes(email.toLowerCase())
}

export async function POST(req: Request) {
    const cookieStore = await cookies()

    // Verify requester session (anon + cookies)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll() { },
            },
        }
    )

    const { data } = await supabase.auth.getUser()
    const user = data.user

    if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 })
    if (!isAdmin(user.email)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })

    const body = await req.json()
    const { userId, action, reason } = body as {
        userId: string
        action: "approve" | "reject"
        reason?: string
    }

    if (!userId || !["approve", "reject"].includes(action)) {
        return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 })
    }

    // Admin DB client (service role)
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const update =
        action === "approve"
            ? {
                verification_status: "approved",
                verification_reason: null,
                verified_at: new Date().toISOString(),
            }
            : {
                verification_status: "rejected",
                verification_reason: reason ?? "Rejected by admin",
                verified_at: null,
            }

    const { error } = await supabaseAdmin.from("profiles").update(update).eq("id", userId)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
}
