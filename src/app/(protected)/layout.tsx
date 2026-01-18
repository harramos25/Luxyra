import { Sidebar } from "@/components/layout/Sidebar"

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-20 p-8 relative z-0">
                {/* Background glow effects could go here */}
                <div className="fixed top-0 left-0 w-full h-full pointer-events-none bg-midnight-glow -z-10" />
                {children}
            </main>
        </div>
    )
}
