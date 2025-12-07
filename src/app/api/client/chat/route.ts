import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// GET all chat messages (global client chat)
export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id || session.user.role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch recent messages (last 100)
        const messages = await db.clientMessage.findMany({
            take: 100,
            orderBy: { createdAt: 'asc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            senderName: msg.sender.name,
            createdAt: msg.createdAt.toISOString()
        }))

        return NextResponse.json(formattedMessages)
    } catch (error) {
        console.error('Error fetching chat messages:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Send a new message
export async function POST(req: Request) {
    try {
        const session = await auth()

        if (!session?.user?.id || session.user.role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { content } = body

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
        }

        if (content.length > 1000) {
            return NextResponse.json({ error: 'Message too long' }, { status: 400 })
        }

        const message = await db.clientMessage.create({
            data: {
                content: content.trim(),
                senderId: session.user.id
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        return NextResponse.json({
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            senderName: message.sender.name,
            createdAt: message.createdAt.toISOString()
        }, { status: 201 })
    } catch (error) {
        console.error('Error sending chat message:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
