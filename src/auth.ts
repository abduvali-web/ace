import NextAuth from "next-auth"
import authConfig from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        ...authConfig.providers,
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const identifier = credentials.email as string
                const password = credentials.password as string

                // 1. Try to find Admin by Email
                const admin = await db.admin.findUnique({
                    where: { email: identifier }
                })

                if (admin && admin.password) {
                    const passwordMatch = await bcrypt.compare(password, admin.password)
                    if (passwordMatch) {
                        // Check if trial has expired
                        if (admin.trialEndsAt && new Date() > admin.trialEndsAt && !admin.isActive) {
                            throw new Error("Your trial period has expired. Please contact an administrator.")
                        }
                        // Check if account is active
                        if (!admin.isActive) {
                            throw new Error("Your account has been disabled. Please contact an administrator.")
                        }

                        return {
                            id: admin.id,
                            email: admin.email,
                            name: admin.name,
                            role: admin.role,
                        }
                    }
                }

                // 2. Try to find Customer by Phone (mapped to 'email' field in credentials)
                const customer = await db.customer.findUnique({
                    where: { phone: identifier }
                })

                if (customer && customer.password) {
                    const passwordMatch = await bcrypt.compare(password, customer.password)
                    if (passwordMatch) {
                        if (!customer.isActive) {
                            throw new Error("Your account has been disabled.")
                        }
                        return {
                            id: customer.id,
                            email: customer.phone, // Use phone as email identifier
                            name: customer.name,
                            role: "CUSTOMER",
                        }
                    }
                }

                return null
            }
        })
    ],
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account, profile }) {
            console.log("SignIn Callback:", { provider: account?.provider, email: user.email })
            if (account?.provider === "google") {
                try {
                    // Check if user exists
                    let admin = await db.admin.findUnique({
                        where: { email: user.email! }
                    })
                    console.log("Admin found:", !!admin)

                    if (!admin) {
                        console.log("Creating new Google user...")
                        // Create new user with Google OAuth
                        const trialEndsAt = new Date()
                        trialEndsAt.setDate(trialEndsAt.getDate() + 30)

                        admin = await db.admin.create({
                            data: {
                                email: user.email!,
                                name: user.name || "Google User",
                                googleId: account.providerAccountId,
                                password: null,
                                hasPassword: false,
                                role: "MIDDLE_ADMIN",
                                trialEndsAt,
                                isActive: true, // Will be disabled after 30 days by cron
                            }
                        })
                        console.log("New user created:", admin.id)
                    } else if (!admin.googleId) {
                        console.log("Linking Google account...")
                        // Link Google account to existing user
                        await db.admin.update({
                            where: { id: admin.id },
                            data: { googleId: account.providerAccountId }
                        })
                    }

                    // Manually save the Account to persist tokens (replaces PrismaAdapter)
                    await db.account.upsert({
                        where: {
                            provider_providerAccountId: {
                                provider: account.provider,
                                providerAccountId: account.providerAccountId
                            }
                        },
                        update: {
                            access_token: account.access_token,
                            refresh_token: account.refresh_token,
                            expires_at: account.expires_at,
                            token_type: account.token_type,
                            scope: account.scope,
                            id_token: account.id_token,
                            session_state: account.session_state as string,
                        },
                        create: {
                            userId: admin.id,
                            type: account.type,
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                            access_token: account.access_token,
                            refresh_token: account.refresh_token,
                            expires_at: account.expires_at,
                            token_type: account.token_type,
                            scope: account.scope,
                            id_token: account.id_token,
                            session_state: account.session_state as string,
                        }
                    })

                    // Check if trial has expired
                    if (admin.trialEndsAt && new Date() > admin.trialEndsAt && !admin.isActive) {
                        console.log("Trial expired")
                        return false
                    }

                    // Check if account is active
                    if (!admin.isActive) {
                        console.log("Account inactive")
                        return false
                    }

                    return true
                } catch (error) {
                    console.error("Error in signIn callback:", error)
                    return false
                }
            }
            return true
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.role = user.role as string
                token.id = user.id as string
            }

            // If we have an email but no role/id (or to ensure fresh data), fetch from DB
            if (token.email && (!token.role || !token.id)) {
                // Try Admin first
                const dbAdmin = await db.admin.findUnique({
                    where: { email: token.email }
                })
                if (dbAdmin) {
                    token.role = dbAdmin.role
                    token.id = dbAdmin.id
                } else {
                    // Try Customer (token.email holds phone)
                    const dbCustomer = await db.customer.findUnique({
                        where: { phone: token.email }
                    })
                    if (dbCustomer) {
                        token.role = "CUSTOMER"
                        token.id = dbCustomer.id
                    }
                }
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string
                session.user.id = token.id as string
            }
            return session
        }
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})
