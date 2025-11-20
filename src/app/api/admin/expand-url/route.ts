import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    try {
        // Perform a HEAD request to follow redirects
        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
        })

        return NextResponse.json({ expandedUrl: response.url })
    } catch (error) {
        console.error('Error expanding URL:', error)
        return NextResponse.json({ error: 'Failed to expand URL' }, { status: 500 })
    }
}
