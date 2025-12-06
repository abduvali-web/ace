import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

// Helper to push a file to GitHub
async function pushFileToGitHub(token: string, owner: string, repo: string, filePath: string, content: string, message: string) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`

    // 1. Check if file exists to get SHA (for update)
    let sha: string | undefined
    try {
        const checkRes = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                'User-Agent': 'Ace-Builder'
            }
        })
        if (checkRes.ok) {
            const data = await checkRes.json()
            sha = data.sha
        }
    } catch (e) { /* ignore */ }

    // 2. Prepare PUT body
    const body: any = {
        message,
        content: Buffer.from(content).toString('base64'),
    }
    if (sha) body.sha = sha

    // 3. Upload
    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Ace-Builder'
        },
        body: JSON.stringify(body)
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(`GitHub File Error (${filePath}): ${err.message}`)
    }
}

// Helper to read local file
function readLocalFile(relativePath: string) {
    try {
        const fullPath = path.join(process.cwd(), relativePath)
        return fs.readFileSync(fullPath, 'utf8')
    } catch (e) {
        console.error(`Missing file: ${relativePath}`, e)
        return ''
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { subdomain, siteContent } = await request.json()
        if (!subdomain) return NextResponse.json({ error: 'Missing subdomain' }, { status: 400 })

        // 1. Get Tokens
        const ghAccount = await db.account.findFirst({ where: { userId: user.id, provider: 'github' } })
        if (!ghAccount?.access_token) return NextResponse.json({ error: 'GitHub not connected. Please connect GitHub first.' }, { status: 400 })
        const githubToken = ghAccount.access_token

        const vercelAccount = await db.account.findFirst({ where: { userId: user.id, provider: 'vercel' } })
        // Allow env fallback for testing if mainly dev mode, but prefer linked account
        const vercelToken = vercelAccount?.access_token || process.env.VERCEL_TOKEN

        if (!vercelToken) {
            return NextResponse.json({ error: 'Vercel not connected. Please connect Vercel first.' }, { status: 400 })
        }

        // 2. Get GitHub User Info
        const ghUserRes = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${githubToken}` } })
        if (!ghUserRes.ok) throw new Error('Invalid GitHub Token')
        const ghUser = await ghUserRes.json()
        const ghUsername = ghUser.login

        // 3. Create Repo
        const repoName = `ace-site-${subdomain}`
        let repoUrl = ''
        const createRepoRes = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: { Authorization: `Bearer ${githubToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: repoName, private: true, auto_init: true })
        })

        if (createRepoRes.status === 422) {
            repoUrl = `https://github.com/${ghUsername}/${repoName}`
        } else if (!createRepoRes.ok) {
            throw new Error('Failed to create GitHub repo')
        } else {
            repoUrl = (await createRepoRes.json()).html_url
        }

        // 4. Push Files
        // Dependencies including Firebase
        const packageJson = {
            "name": repoName,
            "version": "0.1.0",
            "private": true,
            "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },
            "dependencies": {
                "next": "14.1.0",
                "react": "^18",
                "react-dom": "^18",
                "lucide-react": "^0.300.0",
                "clsx": "^2.0.0",
                "tailwind-merge": "^2.0.0",
                "firebase": "^10.0.0",
                "class-variance-authority": "^0.7.0"
            },
            "devDependencies": {
                "autoprefixer": "^10.0.1",
                "postcss": "^8",
                "tailwindcss": "^3.3.0",
                "typescript": "^5",
                "@types/node": "^20",
                "@types/react": "^18",
                "@types/react-dom": "^18"
            }
        }
        await pushFileToGitHub(githubToken, ghUsername, repoName, 'package.json', JSON.stringify(packageJson, null, 2), 'Update package.json')

        // Configs
        const nextConfig = `/** @type {import('next').NextConfig} */\nconst nextConfig = { reactStrictMode: true }\nmodule.exports = nextConfig`
        await pushFileToGitHub(githubToken, ghUsername, repoName, 'next.config.js', nextConfig, 'Update next.config.js')

        const tsConfig = JSON.stringify({
            "compilerOptions": {
                "lib": ["dom", "dom.iterable", "esnext"],
                "allowJs": true,
                "skipLibCheck": true,
                "strict": true,
                "noEmit": true,
                "esModuleInterop": true,
                "module": "esnext",
                "moduleResolution": "bundler",
                "resolveJsonModule": true,
                "isolatedModules": true,
                "jsx": "preserve",
                "incremental": true,
                "plugins": [{ "name": "next" }],
                "paths": { "@/*": ["./src/*"] }
            },
            "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
            "exclude": ["node_modules"]
        }, null, 2)
        await pushFileToGitHub(githubToken, ghUsername, repoName, 'tsconfig.json', tsConfig, 'Update tsconfig')

        // Tailwind & CSS
        await pushFileToGitHub(githubToken, ghUsername, repoName, 'src/app/globals.css', "@tailwind base;\n@tailwind components;\n@tailwind utilities;", 'Update globals.css')
        const tailwindConfig = `/** @type {import('tailwindcss').Config} */\nmodule.exports = { content: ["./src/**/*.{ts,tsx}"], theme: { extend: {} }, plugins: [], }`
        await pushFileToGitHub(githubToken, ghUsername, repoName, 'tailwind.config.ts', tailwindConfig, 'Update tailwind')

        // --- COMPONENTS & UTILS ---
        // Dynamically read our local components and push them
        const filesToCopy = [
            'src/lib/utils.ts',
            'src/components/ui/button.tsx',
            'src/components/ui/card.tsx',
            'src/components/ui/input.tsx',
            'src/components/ui/badge.tsx',
            'src/components/ui/scroll-area.tsx',
            'src/components/site/SiteContent.tsx'
        ]

        for (const file of filesToCopy) {
            const content = readLocalFile(file)
            if (content) {
                await pushFileToGitHub(githubToken, ghUsername, repoName, file, content, `Sync ${path.basename(file)}`)
            }
        }

        // Layout
        const layoutContent = `import type { Metadata } from 'next'\nimport './globals.css'\nimport { Inter } from 'next/font/google'\nconst inter = Inter({ subsets: ['latin'] })\nexport const metadata: Metadata = { title: '${subdomain}', description: 'Generated Site' }\nexport default function RootLayout({ children }: { children: React.ReactNode }) { return (<html lang="en"><body className={inter.className}>{children}</body></html>) }`
        await pushFileToGitHub(githubToken, ghUsername, repoName, 'src/app/layout.tsx', layoutContent, 'Update layout')

        // Page (Injects Content)
        const pageContent = `
import { SiteContent } from '@/components/site/SiteContent'

const generatedContent = ${JSON.stringify(siteContent, null, 2)}

export default function Home() {
  return <SiteContent content={generatedContent} subdomain="${subdomain}" />
}
`
        await pushFileToGitHub(githubToken, ghUsername, repoName, 'src/app/page.tsx', pageContent, 'Update page content')

        // 5. Create Vercel Project
        const vercelRes = await fetch('https://api.vercel.com/v9/projects', {
            method: 'POST',
            headers: { Authorization: `Bearer ${vercelToken}` },
            body: JSON.stringify({
                name: repoName,
                framework: 'nextjs',
                gitRepository: { type: 'github', repo: `${ghUsername}/${repoName}` }
            })
        })

        let deploymentUrl = ''
        if (vercelRes.ok) {
            const vData = await vercelRes.json()
            deploymentUrl = `https://${vData.alias?.[0] || vData.name + '.vercel.app'}`

            // Trigger Deployment
            await fetch('https://api.vercel.com/v13/deployments', {
                method: 'POST',
                headers: { Authorization: `Bearer ${vercelToken}` },
                body: JSON.stringify({
                    name: repoName,
                    gitSource: {
                        ref: 'main',
                        repoId: (await createRepoRes.json()).id,
                        type: 'github'
                    }
                })
            })
        } else {
            deploymentUrl = `https://${repoName}.vercel.app`
        }

        // 6. Database Update
        await db.website.upsert({
            where: { adminId: user.id },
            update: { repoName, content: JSON.stringify(siteContent), deploymentUrl },
            create: { adminId: user.id, subdomain, theme: '{}', content: JSON.stringify(siteContent), repoName, vercelToken: 'oauth', deploymentUrl }
        })

        return NextResponse.json({ success: true, repoUrl, deploymentUrl })

    } catch (error) {
        console.error('Deploy error:', error)
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Detailed Deployment failed' }, { status: 500 })
    }
}
