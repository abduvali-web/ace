import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai'

// --- TOOLS DEFINITION ---
const writeFileTool: FunctionDeclaration = {
    name: "write_file",
    description: "Write code to a file in the project. Use this to build the website components.",
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            path: { type: SchemaType.STRING, description: "File path (e.g., 'src/components/Hero.tsx')" },
            content: { type: SchemaType.STRING, description: "The full code content for the file." }
        },
        required: ["path", "content"]
    }
}

const readFileTool: FunctionDeclaration = {
    name: "read_template",
    description: "Read a template file to understand the structure.",
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            path: { type: SchemaType.STRING, description: "Path to read" }
        },
        required: ["path"]
    }
}

// --- ORCHESTRATOR ---
export class AgentOrchestrator {
    private genAI: GoogleGenerativeAI
    private modelName = 'gemini-1.5-pro-latest' // Or 'gemini-1.5-flash' for speed
    private requestOptions: any = {}

    constructor(apiKey: string, oauthToken?: string) {
        this.genAI = new GoogleGenerativeAI(apiKey)
        if (oauthToken) {
            // If OAuth token provided, we might need to intercept requests or use specific SDK options
            // Current SDK version might not support direct OAuth easily without wrapping fetch.
            // For now, we will rely on API Key.
            // If user absolutely needs OAuth token usage, we would need to manually fetch.
            console.log("OAuth Token provided (experimental support)")
        }
    }

    // WORKER AGENT: Proposes a solution
    async runWorker(id: number, prompt: string): Promise<{ id: number, files: Record<string, string>, rationale: string }> {
        const model = this.genAI.getGenerativeModel({
            model: this.modelName,
            tools: [{ functionDeclarations: [writeFileTool, readFileTool] }]
        })

        const chat = model.startChat()
        const files: Record<string, string> = {}

        const systemUserMsg = `
        You are Agent #${id}, an expert React/Next.js developer.
        Task: Create a website configuration based on this request: "${prompt}".
        
        You have a visible "write_file" tool. 
        Instead of physically writing, calling this tool allows you to Submit the code for that file.
        
        GOAL: Submit a 'site-config.json' file that matches this structure: 
        {
            "hero": { ... },
            "features": [...],
            "themeColor": "...",
            "chatEnabled": boolean
        }
        
        Also optionally submit 'instructions.md' explaining your design choices.
        `

        try {
            const result = await chat.sendMessage(systemUserMsg)
            const response = result.response
            const functionCalls = response.functionCalls()

            if (functionCalls) {
                for (const call of functionCalls) {
                    if (call.name === 'write_file') {
                        const args = call.args as any
                        files[args.path] = args.content
                    }
                }
            } else {
                // Fallback if model just returns text (try to parse json from text block)
                const text = response.text()
                // Simple heuristic to extract JSON block
                const jsonMatch = text.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                    files['site-config.json'] = jsonMatch[0]
                }
            }

            return {
                id,
                files,
                rationale: files['instructions.md'] || 'No rationale provided.'
            }

        } catch (e) {
            console.error(`Agent ${id} failed:`, e)
            return { id, files: {}, rationale: 'Failed' }
        }
    }

    // JUDGE AGENT: Picks the best proposal
    async judge(prompt: string, proposals: Array<{ id: number, files: Record<string, string>, rationale: string }>) {
        const model = this.genAI.getGenerativeModel({ model: this.modelName })

        // Filter out failed proposals
        const validProposals = proposals.filter(p => p.files['site-config.json'])
        if (validProposals.length === 0) throw new Error("All agents failed to generate valid config.")

        const candidatesText = validProposals.map(p => `
        --- Proposal #${p.id} ---
        Rationale: ${p.rationale}
        Config: ${p.files['site-config.json']}
        `).join('\n')

        const judgePrompt = `
        You are the Lead Architect.
        User Request: "${prompt}"
        
        We have ${validProposals.length} proposals from the team.
        Review them and choose the ABSOLUTE BEST one that fits the user's request perfectly.
        
        Return ONLY the raw JSON of the best 'site-config.json'. 
        Do not wrap in markdown.
        `

        const result = await model.generateContent([judgePrompt, candidatesText])
        const text = result.response.text()

        // Clean and Parse
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
        try {
            return JSON.parse(jsonStr)
        } catch (e) {
            // Fallback: use first valid proposal
            return JSON.parse(validProposals[0].files['site-config.json'])
        }
    }

    // MAIN ENTRY
    async generateMultiAgentSite(prompt: string) {
        // 1. Run 5 Workers in Parallel
        const workerPromises = Array(5).fill(0).map((_, i) => this.runWorker(i + 1, prompt))
        const proposals = await Promise.all(workerPromises)

        // 2. Judge Matches
        const winnerConfig = await this.judge(prompt, proposals)
        return winnerConfig
    }
}
