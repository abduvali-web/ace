import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { db } from "@/lib/db"

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email) return false

            // Check if user exists in Admin table
            const admin = await db.admin.findUnique({
                where: { email: user.email },
            })

            if (admin && admin.isActive) {
                return true
            }

            // Optional: Check if user exists in Customer table if you want customers to login via Google
            // const customer = await db.customer.findUnique({ where: { email: user.email } })
            // if (customer && customer.isActive) return true

            return false // Deny login if email not found or inactive
        },
        async jwt({ token, user, account }) {
            if (user) {
                const admin = await db.admin.findUnique({
                    where: { email: user.email! },
                })

                if (admin) {
                    token.id = admin.id
                    token.role = admin.role
                }
            }
            return token
        },
        async session({ session, token }) {
            if (session.user && token.role) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
        error: '/login', // Error code passed in query string as ?error=
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
