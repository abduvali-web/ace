import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export default {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        })
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith('/middle-admin') ||
                nextUrl.pathname.startsWith('/super-admin') ||
                nextUrl.pathname.startsWith('/low-admin') ||
                nextUrl.pathname.startsWith('/courier')
            const isOnLogin = nextUrl.pathname === '/login'
            const isOnHomePage = nextUrl.pathname === '/'
            const isOnSignup = nextUrl.pathname === '/signup'

            // Allow everyone to access home page and signup page
            if (isOnHomePage || isOnSignup) {
                return true
            }

            // If logged in and trying to access login page, redirect to dashboard
            if (isLoggedIn && isOnLogin) {
                const role = (auth.user as any).role
                switch (role) {
                    case 'SUPER_ADMIN':
                        return Response.redirect(new URL('/super-admin', nextUrl))
                    case 'MIDDLE_ADMIN':
                        return Response.redirect(new URL('/middle-admin', nextUrl))
                    case 'LOW_ADMIN':
                        return Response.redirect(new URL('/low-admin', nextUrl))
                    case 'COURIER':
                        return Response.redirect(new URL('/courier', nextUrl))
                    default:
                        return Response.redirect(new URL('/middle-admin', nextUrl))
                }
            }

            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            }
            return true
        },
    }
} satisfies NextAuthConfig
