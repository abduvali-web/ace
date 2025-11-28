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

            try {
                // Check if user exists in Admin table
                let admin = await db.admin.findUnique({
                    where: { email: user.email },
                })

                // If admin doesn't exist, create a new MIDDLE_ADMIN
                if (!admin) {
                    admin = await db.admin.create({
                        data: {
                            email: user.email,
                            name: user.name || user.email.split('@')[0],
                            role: 'MIDDLE_ADMIN',
                            isActive: true,
                        },
                    })
                }

                // Allow login if admin is active
                if (admin && admin.isActive) {
                    return true
                }

                return false // Deny login if inactive
            } catch (error) {
                console.error('Error in signIn callback:', error)
                return false
            }
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
        async redirect({ url, baseUrl }) {
            // If url is provided and is on the same site, use it
            if (url.startsWith(baseUrl)) return url

            // Default redirect based on role (fallback)
            return `${baseUrl}/middle-admin`
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
