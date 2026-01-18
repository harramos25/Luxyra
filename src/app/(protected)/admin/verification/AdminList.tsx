"use client"

import * as React from "react"

type PendingProfile = {
    id: string
    alias: string | null
    selfie_path: string | null
    verification_status: string
    verification_reason: string | null
    created_at: string
}

export default function AdminListClient({ initial }: { initial: PendingProfile[] }) {
    const [rows, setRows] = React.useState(initial)
    const [loadingId, setLoadingId] = React.useState<string | null>(null)
    const [selfieUrls, setSelfieUrls] = React.useState<Record<string, string>>({})
    const [rejectReason, setRejectReason] = React.useState<Record<string, string>>({})

    async function loadSelfie(id: string, path: string) {
        const res = await fetch("/api/admin/selfie-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path }),
        })
        const json = await res.json()
        if (json.ok) {
            setSelfieUrls((prev) => ({ ...prev, [id]: json.url }))
        }
    }

    async function verify(userId: string, action: "approve" | "reject") {
        setLoadingId(userId)
        const res = await fetch("/api/admin/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                action,
                reason: action === "reject" ? rejectReason[userId] : undefined,
            }),
        })
        const json = await res.json()
        setLoadingId(null)

        if (!json.ok) {
            alert(json.error ?? "Failed")
            return
        }

        // Remove row from list
        setRows((prev) => prev.filter((r) => r.id !== userId))
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-semibold text-luxyra-gold font-serif">Admin Verification</h1>
            <p className="opacity-70 mt-1 text-luxyra-blush">Review pending users and approve/reject.</p>

            <div className="mt-6 space-y-4">
                {rows.length === 0 && (
                    <div className="glass-card text-center py-8">
                        <p className="opacity-80 text-luxyra-blush">No pending users.</p>
                    </div>
                )}

                {rows.map((p) => (
                    <div key={p.id} className="glass-card flex gap-4 items-start">
                        <div className="w-28 flex-shrink-0">
                            {p.selfie_path ? (
                                <>
                                    {selfieUrls[p.id] ? (
                                        <img
                                            src={selfieUrls[p.id]}
                                            alt="selfie"
                                            className="w-28 h-28 object-cover rounded-xl border border-luxyra-gold/20"
                                        />
                                    ) : (
                                        <button
                                            className="btn-ghost w-full h-28 flex items-center justify-center text-xs"
                                            onClick={() => loadSelfie(p.id, p.selfie_path!)}
                                        >
                                            Load selfie
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="w-28 h-28 rounded-xl bg-black/20 flex items-center justify-center opacity-70 border border-white/5 text-xs">
                                    No selfie
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="truncate">
                                    <p className="text-lg font-medium text-luxyra-gold truncate">{p.alias ?? "No alias yet"}</p>
                                    <p className="text-xs text-luxyra-blush/60 font-mono">{p.id}</p>
                                    <p className="text-sm opacity-60 text-luxyra-blush">{new Date(p.created_at).toLocaleString()}</p>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <button
                                        className="btn-gold text-sm px-4 py-2"
                                        disabled={loadingId === p.id}
                                        onClick={() => verify(p.id, "approve")}
                                    >
                                        {loadingId === p.id ? "..." : "Approve"}
                                    </button>

                                    <button
                                        className="px-4 py-2 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition-colors"
                                        disabled={loadingId === p.id}
                                        onClick={() => verify(p.id, "reject")}
                                    >
                                        {loadingId === p.id ? "..." : "Reject"}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3">
                                <label className="text-xs uppercase tracking-wider opacity-50 text-luxyra-blush">Reject reason</label>
                                <input
                                    className="input-field mt-1 text-sm py-1"
                                    placeholder="e.g. selfie unclear..."
                                    value={rejectReason[p.id] ?? ""}
                                    onChange={(e) =>
                                        setRejectReason((prev) => ({ ...prev, [p.id]: e.target.value }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
