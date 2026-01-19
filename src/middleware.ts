import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
    const response = NextResponse.next()
    const pathname = request.nextUrl.pathname

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const { data } = await supabase.auth.getUser()
    const user = data.user

    const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/chat") ||
        pathname.startsWith("/notifications") ||
        pathname.startsWith("/onboarding") ||
        pathname.startsWith("/verify-selfie") ||
        pathname.startsWith("/post-auth") ||
        pathname.startsWith("/admin")

    if (isProtected && !user) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        url.searchParams.set("next", pathname)
        return NextResponse.redirect(url)
    }

    // Admin gate
    if (pathname.startsWith("/admin")) {
        const adminEmails = (process.env.ADMIN_EMAILS ?? "")
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean)

        const userEmail = (user?.email ?? "").toLowerCase()

        if (!adminEmails.includes(userEmail)) {
            const url = request.nextUrl.clone()
            url.pathname = "/dashboard"
            return NextResponse.redirect(url)
        }
    }

    return response
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
