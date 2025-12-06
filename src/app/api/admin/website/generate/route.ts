import { NextRequest, NextResponse } from 'next/server'
import { AgentOrchestrator } from '@/lib/agent-orchestrator'

export const maxDuration = 60 // Allow longer timeouts for multi-agent work

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json()
        const apiKey = process.env.GEMINI_API_KEY

        if (!apiKey) {
            return NextResponse.json({ error: 'System API Key Missing' }, { status: 500 })
        }

        const orchestrator = new AgentOrchestrator(apiKey)
        
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
