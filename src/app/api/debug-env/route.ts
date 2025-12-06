import { NextResponse } from 'next/server'

export async function GET() {
    const vars = {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'Set' : 'Missing',
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 'Set' : 'Missing',
        VERCEL_CLIENT_ID: process.env.VERCEL_CLIENT_ID ? 'Set' : 'Missing',
        VERCEL_CLIENT_SECRET: process.env.VERCEL_CLIENT_SECRET ? 'Set' : 'Missing',
        AUTH_SECRET: process.env.AUTH_SECRET ? 'Set' : 'Missing',
        DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Missing',
        NODE_ENV: process.env.NODE_ENV,
    }

    return NextResponse.json(vars)
}
