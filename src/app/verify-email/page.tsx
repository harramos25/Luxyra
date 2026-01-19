import { Suspense } from "react"
import VerifyEmailClient from "./verify-email-client"

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-luxyra-plum text-luxyra-gold">Loading...</div>}>
            <VerifyEmailClient />
        </Suspense>
    )
}
