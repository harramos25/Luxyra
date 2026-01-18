"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, differenceInYears } from "date-fns"

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        alias: "",
        birthday: "",
        gender_identity: "",
        bio: "",
        interests: [] as string[]
    })

    const [interestInput, setInterestInput] = useState("")

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleAddInterest = () => {
        if (interestInput && formData.interests.length < 3 && !formData.interests.includes(interestInput)) {
            setFormData(prev => ({ ...prev, interests: [...prev.interests, interestInput] }))
            setInterestInput("")
        }
    }

    const removeInterest = (interest: string) => {
        setFormData(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        // Age Check
        const age = differenceInYears(new Date(), new Date(formData.birthday))
        if (age < 18) {
            alert("Luxyra is for 18+ only.")
            setLoading(false)
            return
        }

        // Update Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                alias: formData.alias,
                birthday: formData.birthday,
                gender_identity: formData.gender_identity,
                bio: formData.bio,
                // verification_status remains pending/approved based on selfie step
            })
            .eq('id', user.id)

        if (profileError) {
            alert("Error updating profile: " + profileError.message)
            setLoading(false)
            return
        }

        // Insert Interests
        const interestsData = formData.interests.map(i => ({
            user_id: user.id,
            interest: i
        }))

        if (interestsData.length > 0) {
            const { error: interestError } = await supabase.from('interests').insert(interestsData)
            if (interestError) {
                alert("Error saving interests: " + interestError.message)
            }
        }

        router.push('/dashboard')
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-luxyra-plum p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-center text-luxyra-gold">Complete Your Profile</CardTitle>
                    <div className="flex justify-center gap-2 mt-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`h-1 w-8 rounded-full ${step >= s ? 'bg-luxyra-gold' : 'bg-white/10'}`} />
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-luxyra-blush/70 mb-1 block">Alias (Unique)</label>
                                <Input
                                    value={formData.alias}
                                    onChange={e => handleChange('alias', e.target.value)}
                                    placeholder="MysticRose"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-luxyra-blush/70 mb-1 block">Birthday (Private, 18+ only)</label>
                                <Input
                                    type="date"
                                    value={formData.birthday}
                                    onChange={e => handleChange('birthday', e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={() => setStep(2)} disabled={!formData.alias || !formData.birthday}>Next</Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-luxyra-blush/70 mb-1 block">Gender Identity</label>
                                <Input
                                    value={formData.gender_identity}
                                    onChange={e => handleChange('gender_identity', e.target.value)}
                                    placeholder="Female, Non-binary..."
                                />
                            </div>
                            <div>
                                <label className="text-xs text-luxyra-blush/70 mb-1 block">Bio</label>
                                <Input
                                    value={formData.bio}
                                    onChange={e => handleChange('bio', e.target.value)}
                                    placeholder="A little mystery..."
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
                                <Button onClick={() => setStep(3)} className="flex-1" disabled={!formData.gender_identity}>Next</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-luxyra-blush/70 mb-1 block">Interests (Max 3)</label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={interestInput}
                                        onChange={e => setInterestInput(e.target.value)}
                                        placeholder="Travel, Art, Wine..."
                                        disabled={formData.interests.length >= 3}
                                    />
                                    <Button onClick={handleAddInterest} disabled={!interestInput || formData.interests.length >= 3}>Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.interests.map(int => (
                                        <span key={int} className="bg-luxyra-gold/20 text-luxyra-gold px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                            {int}
                                            <button onClick={() => removeInterest(int)} className="hover:text-white">&times;</button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">Back</Button>
                                <Button onClick={handleSubmit} className="flex-1" isLoading={loading}>Enter Luxyra</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
