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

    const { path } = (await req.json()) as { path: string }
    if (!path) return NextResponse.json({ ok: false, error: "Missing path" }, { status: 400 })

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: signed, error } = await supabaseAdmin.storage
        .from("verification_selfies")
        .createSignedUrl(path, 60) // 60 seconds

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true, url: signed.signedUrl })
}
