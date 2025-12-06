'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Globe, Sparkles, ExternalLink, Eye, Rocket, BookOpen, Check, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { SiteContent } from '@/components/site/SiteContent'
import { signIn } from 'next-auth/react'

const EXAMPLE_PROMPT = `Create main page with how healthy food can improve our daily life. Create buttons to change languages between Uzbek, Russian, English. Add login button and prices list with detailed pricing plans for healthy food company. Redirect user to phone number 998977087373 when they click apply buttons at bottom of every price plan. At top of site add connect button to redirect to phone number 998977087373. After login show every client their current plan with expiry timer, today's menu, order status (kitchen/delivery), estimated delivery time, and calorie tracking (calories lost/gained using formula: client calories minus client order numbers multiplied by client order calories). Only after 30 days from client creation show "Buy Now - 50% Discount" button with countdown timer that expires after 30 days. Redirect to phone number when clicked. All website content must be available in three languages with language switch button. Also create chat window where only my clients can chat with each other.`

const SHOWCASE_FEATURES = [
    { icon: Globe, title: 'Multilingual', desc: 'UZ, RU, EN support' },
    { icon: MessageCircle, title: 'Client Chat', desc: 'Real-time messaging' },
    { icon: Sparkles, title: 'AI Generated', desc: 'Powered by Gemini' }
]

export default function WebsiteBuilderPage() {
    const [prompt, setPrompt] = useState('')
    const [subdomain, setSubdomain] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [generatedSite, setGeneratedSite] = useState<any>(null)
    const [activeTab, setActiveTab] = useState('create')

    // Load existing website on mount
    useEffect(() => {
        const fetchExisting = async () => {
            try {
                const res = await fetch('/api/admin/website')
                if (res.ok) {
                    const data = await res.json()
                    if (data) {
                        setGeneratedSite(data)
                        setSubdomain(data.subdomain)
                    }
                }
            } catch (e) { /* ignore */ }
        }
        fetchExisting()
    }, [])

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error('Please enter a prompt')
            return
        }
        setIsLoading(true)
        try {
            // Call the Multi-Agent Orchestrator
            const res = await fetch('/api/admin/website/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Generation failed')

            setGeneratedSite({
                subdomain: prompt.substring(0, 10).replace(/[^a-z0-9]/gi, '').toLowerCase() + '-' + Math.floor(Math.random() * 1000),
                content: data.data,
                chatEnabled: data.data.chatEnabled
            })
            setActiveTab('preview')
            toast.success('Website generated with 6-Agent Team!')
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "AI Generation failed")
        } finally {
            setIsLoading(false)
        }
    }

    const handlePublish = async () => {
        if (!generatedSite) return
        setIsPublishing(true)

        try {
            const res = await fetch('/api/admin/website/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subdomain: generatedSite.subdomain,
                    siteContent: generatedSite.content, // Pass the full JSON content
                    vercelToken: 'oauth' // Handled by backend linked account
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Deployment failed')

            toast.success('Website successfully deployed to Vercel!')
            window.open(data.deploymentUrl, '_blank')

        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Deployment failed")
        } finally {
            setIsPublishing(false)
        }
    }

    const useExamplePrompt = () => {
        setPrompt(EXAMPLE_PROMPT)
        setActiveTab('create')
        toast.info('Example prompt loaded!')
    }

    return (
        <div className="container mx-auto py-10 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Sparkles className="w-8 h-8 text-purple-500" />
                    AI Website Builder
                </h1>
                <p className="text-muted-foreground mt-2">
                    Generate a professional, multilingual website for your delivery business in seconds.
                    Your site runs on Vercel at <code className="bg-muted px-1 rounded">autofood.vercel.app/sites/your-subdomain</code>
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="create" className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Create
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2" disabled={!generatedSite}>
                        <Eye className="w-4 h-4" /> Preview
                    </TabsTrigger>
                    <TabsTrigger value="deploy" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-600">
                        <Rocket className="w-4 h-4 mr-2" />
                        Deploy
                    </TabsTrigger>
                    <TabsTrigger value="showcase" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Showcase
                    </TabsTrigger>
                </TabsList>

                {/* CREATE TAB */}
                <TabsContent value="create">
                    <div className="grid gap-8 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuration</CardTitle>
                                <CardDescription>Describe your business and choose a subdomain.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subdomain">Subdomain</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="subdomain"
                                            placeholder="healthy-food"
                                            value={subdomain}
                                            onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                        />
                                        <span className="text-muted-foreground text-sm whitespace-nowrap">.autofood.vercel.app</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="prompt">Tell AI What You Want</Label>
                                    <Textarea
                                        id="prompt"
                                        placeholder="Describe your website in detail. Include features like language support, pricing, chat, timers, etc. The AI will understand and create it for you."
                                        className="h-48"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Tip: Mention "chat" to enable client-to-client messaging!
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isLoading}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating with AI Agents...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Generate Website
                                        </>
                                    )}
                                </Button>

                            </CardFooter>
                        </Card>

                        <Card className="bg-muted/50 border-dashed">
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                                <CardDescription>Your website generation status.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center h-[300px]">
                                {generatedSite ? (
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                            <Check className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Website Ready!</h3>
                                            <p className="text-muted-foreground text-sm">
                                                {generatedSite.subdomain}.autofood.vercel.app
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Chat: {generatedSite.chatEnabled ? '✅ Enabled' : '❌ Disabled'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setActiveTab('preview')}>
                                                <Eye className="w-4 h-4 mr-1" /> Preview
                                            </Button>
                                            <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
                                                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4 mr-1" />}
                                                Publish
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <Globe className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p>No website generated yet.</p>
                                        <Button variant="link" onClick={() => setActiveTab('showcase')}>
                                            See Example →
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* PREVIEW TAB */}
                <TabsContent value="preview">
                    {generatedSite && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Live Preview</CardTitle>
                                    <CardDescription>
                                        {generatedSite.subdomain}.autofood.vercel.app
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <a href={`/sites/${generatedSite.subdomain}`} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm">
                                            <ExternalLink className="w-4 h-4 mr-1" /> Open in New Tab
                                        </Button>
                                    </a>
                                    <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
                                        {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4 mr-1" />}
                                        Publish to Vercel
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="border rounded-b-lg overflow-hidden bg-white">
                                    <iframe
                                        src={`/sites/${generatedSite.subdomain}`}
                                        className="w-full h-[600px] border-0"
                                        title="Website Preview"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* SHOWCASE TAB */}
                <TabsContent value="showcase">
                    <div className="space-y-6">
                        {/* Example Info Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" />
                                        Example: Healthy Food Delivery Website
                                    </CardTitle>
                                    <CardDescription>
                                        This is a live preview of what AI can generate from a prompt
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <a href="/sites/example-healthy-food" target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm">
                                            <ExternalLink className="w-4 h-4 mr-1" /> Open Full
                                        </Button>
                                    </a>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Features */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    {SHOWCASE_FEATURES.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                            <f.icon className="w-5 h-5 text-purple-500" />
                                            <div>
                                                <p className="font-medium text-sm">{f.title}</p>
                                                <p className="text-xs text-muted-foreground">{f.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Example Prompt */}
                                <div className="space-y-2">
                                    <Label>Prompt Used to Generate This</Label>
                                    <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed max-h-24 overflow-y-auto">
                                        {EXAMPLE_PROMPT}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={useExamplePrompt} className="w-full bg-purple-600 hover:bg-purple-700">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Use This Prompt to Create Your Own
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Live Preview of Example Site */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Live Website Preview</CardTitle>
                                <CardDescription>
                                    This is what clients see when they visit your generated website
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="border rounded-b-lg overflow-hidden bg-white">
                                    <iframe
                                        src="/sites/example-healthy-food"
                                        className="w-full h-[600px] border-0"
                                        title="Example Website Preview"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* DEPLOY TAB */}
                <TabsContent value="deploy">
                    <Card>
                        <CardHeader>
                            <CardTitle>Deployment Center</CardTitle>
                            <CardDescription>
                                Connect your accounts to enable one-click deployment to the world.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* GitHub Connection */}
                                <div className="p-4 border rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center text-white">
                                            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium">GitHub</p>
                                            <p className="text-sm text-muted-foreground">Source Code Hosting</p>
                                        </div>
                                    </div>
                                    {/* Since backend handles tokens, we assume connected if logged in, or show Connect button if separate flow used */}
                                    <Button variant="outline" size="sm" onClick={() => signIn("github")}>
                                        Connect
                                    </Button>
                                </div>

                                {/* Vercel Connection */}
                                <div className="p-4 border rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center text-white">
                                            <svg height="20" width="20" viewBox="0 0 1155 1000" fill="currentColor">
                                                <path d="M577.344 0L1154.69 1000H0L577.344 0Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium">Vercel</p>
                                            <p className="text-sm text-muted-foreground">Global Hosting</p>
                                        </div>
                                    </div>
                                    {/* Temporarily using token input or direct OAuth if fixed */}
                                    {/* <Button variant="outline" size="sm" onClick={() => signIn("vercel")}>Connect</Button> */}
                                    <div className="text-green-500 text-sm font-medium flex items-center gap-1">
                                        <Check className="w-4 h-4" /> Ready
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg bg-slate-950 p-6 text-white">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Rocket className="w-5 h-5 text-purple-400" />
                                    Manual Deployment
                                </h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    Ready to go live? This will push your latest generated site to GitHub and trigger a Vercel deployment.
                                </p>
                                <Button
                                    onClick={handlePublish}
                                    disabled={!generatedSite || isPublishing}
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                >
                                    {isPublishing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deploying...
                                        </>
                                    ) : (
                                        "Deploy to Production"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
