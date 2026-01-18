"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminVerificationPage() {
    const [profiles, setProfiles] = useState<any[]>([])

    const supabase = createClient()

    useEffect(() => {
        fetchPending()
    }, [])

    const fetchPending = async () => {
        // This query assumes RLS allows admin to see this. 
        // In reality, we need a Service Role client or Admin RLS policy.
        // For MVP, if the logged-in user is 'admin', they can see.
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('verification_status', 'pending')

        if (data) setProfiles(data)
    }

    const handleVerdict = async (id: string, status: 'approved' | 'rejected') => {
        await supabase.from('profiles').update({ verification_status: status }).eq('id', id)
        fetchPending()
    }

    return (
        <div className="p-8 bg-luxyra-plum min-h-screen">
            <h1 className="text-3xl text-luxyra-gold mb-6">Verification Queue</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map(p => (
                    <Card key={p.id}>
                        <CardHeader>
                            <CardTitle>{p.alias || 'No Alias'}</CardTitle>
                            <p className="text-xs text-gray-400">{p.birthday}</p>
                        </CardHeader>
                        <CardContent>
                            {/* Verification Image - needs signed URL if private bucket */}
                            {/* For MVP we might need a helper to get signed url. 
                       This is the tricky part of "private" buckets in client-side admin. 
                       Ideally valid implementation fetches signed URL via server action.
                   */}
                            <div className="bg-black/50 h-48 mb-4 flex items-center justify-center">
                                <span className="text-xs text-center p-2">Image: {p.verification_image_url}</span>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={() => handleVerdict(p.id, 'approved')} className="flex-1 bg-green-600 hover:bg-green-700">Approve</Button>
                                <Button onClick={() => handleVerdict(p.id, 'rejected')} className="flex-1" variant="danger">Reject</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {profiles.length === 0 && <p className="text-luxyra-blush">No pending profiles.</p>}
            </div>
        </div>
    )
}
