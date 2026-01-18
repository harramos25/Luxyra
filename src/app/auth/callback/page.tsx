import { Suspense } from "react"
import AuthCallbackInner from "./inner"

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-luxyra-plum">
                <div className="glass-card text-center p-8">
                    <p className="text-luxyra-gold opacity-80 text-lg font-serif">Loading sanctuary...</p>
                </div>
            </div>
        }>
            <AuthCallbackInner />
        </Suspense>
    )
}
