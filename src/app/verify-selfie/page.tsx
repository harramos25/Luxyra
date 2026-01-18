"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload } from "lucide-react"

export default function VerifySelfiePage() {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0]
            setFile(selected)
            setPreview(URL.createObjectURL(selected))
        }
    }

    const handleUpload = async () => {
        if (!file) return
        setLoading(true)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            // Should handle error / redirect to login
            return
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        // Upload to 'verification_selfies' bucket (Private)
        const { error: uploadError } = await supabase.storage
            .from('verification_selfies')
            .upload(filePath, file)

        if (uploadError) {
            alert("Upload failed: " + uploadError.message)
            setLoading(false)
            return
        }

        // Get public URL (Wait, it's private, admin needs signed URL or just path)
        // We store the path.
        // Update profile
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                verification_image_url: filePath,
                verification_status: 'pending'
                // Alias and other info set in next step
            })

        if (updateError) {
            alert("Profile update failed: " + updateError.message)
        } else {
            router.push('/onboarding')
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-luxyra-plum p-4">
            <Card className="max-w-md w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-luxyra-gold to-luxyra-blush" />
                <CardHeader>
                    <CardTitle className="text-center flex flex-col items-center gap-2">
                        <Camera className="h-10 w-10 text-luxyra-gold" />
                        <span>Verify Your Beauty</span>
                    </CardTitle>
                    <p className="text-center text-luxyra-blush/60 text-sm">
                        To keep Luxyra exclusive and safe, we require a quick selfie verification. This photo is private and only seen by admins.
                    </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-48 h-64 border-2 border-dashed border-luxyra-gold/30 rounded-xl flex items-center justify-center bg-luxyra-deep/30 relative overflow-hidden">
                            {preview ? (
                                <img src={preview} alt="Selfie preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-luxyra-blush/40">
                                    <Upload className="h-8 w-8 mb-2" />
                                    <span className="text-xs">Tap to upload</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                capture="user"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                            />
                        </div>

                        <Button
                            onClick={handleUpload}
                            disabled={!file}
                            isLoading={loading}
                            className="w-full"
                        >
                            Submit Verification
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
