import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminListClient from "./AdminList"

function isAdminEmail(email: string | null | undefined) {
    if (!email) return false
    const admins = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    return admins.includes(email.toLowerCase())
}

export default async function AdminVerificationPage() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()

    if (!data.user) redirect("/login")
    if (!isAdminEmail(data.user.email)) redirect("/dashboard")

    const { data: pending, error } = await supabase
        .from("profiles")
        .select("id, alias, selfie_path, verification_status, verification_reason, created_at")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: true })

    if (error) {
        return (
            <div className="p-8">
                <h1 className="text-xl font-semibold text-red-400">Error Loading Verification</h1>
                <p className="mt-4 opacity-80">{error.message}</p>
            </div>
        )
    }

    return <AdminListClient initial={pending ?? []} />
}
