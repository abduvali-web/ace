import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id || session.user.role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get today's date formatted as YYYY-MM-DD for comparison
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Fetch today's daily menu with menu items
        const dailyMenu = await db.dailyMenu.findFirst({
            where: {
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            },
            include: {
                menuItems: true
            }
        })

        if (!dailyMenu) {
            return NextResponse.json({ items: [] })
        }

        const items = dailyMenu.menuItems.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            calories: item.calories,
            image: item.image
        }))

        return NextResponse.json({ items })
    } catch (error) {
        console.error('Error fetching daily menu:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
