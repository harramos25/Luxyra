import { Suspense } from "react"
import StrangerChatClient from "./StrangerChatClient"

export default function StrangerChatPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-luxyra-gold">Connecting to secure frequency...</div>}>
            <StrangerChatClient />
        </Suspense>
    )
}
