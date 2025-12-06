import { NextRequest, NextResponse } from 'next/server'
import { AgentOrchestrator } from '@/lib/agent-orchestrator'
import { getAuthUser } from '@/lib/auth-utils'
import { db } from '@/lib/db'

export const maxDuration = 60 // Allow longer timeouts for multi-agent work

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json()
        const user = await getAuthUser(request)

        // 1. Try to get User's Google Token (for their Quota)
        let apiKey = process.env.GEMINI_API_KEY
        let oauthToken: string | undefined

        if (user) {
            const account = await db.account.findFirst({
                where: { userId: user.id, provider: 'google' }
            })
            if (account?.access_token) {
                oauthToken = account.access_token
                // If we want to use the access token AS the key (for some proxies) or just prefer it
                // Currently we still prioritize the Server Key for stability unless missing
                if (!apiKey) console.log("Using User OAuth Token as fallback/quota")
            }
        }

        if (!apiKey && !oauthToken) {
            return NextResponse.json({ error: 'System API Key Missing & No User OAuth' }, { status: 500 })
        }

        const orchestrator = new AgentOrchestrator(apiKey || '', oauthToken)

        // This process might take 10-20 seconds
        const siteConfig = await orchestrator.generateMultiAgentSite(prompt)

        return NextResponse.json({
            success: true,
            data: siteConfig
        })

    } catch (error) {
        console.error("Multi-Agent Gen Error:", error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Generation Failed"
        }, { status: 500 })
    }
}
