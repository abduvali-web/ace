import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// GET daily menu for a specific date
export async function GET(req: Request) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const dateStr = searchParams.get('date')

        if (!dateStr) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 })
        }

        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0)
        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)

        const dailyMenu = await db.dailyMenu.findFirst({
            where: {
                date: {
                    gte: date,
                    lt: nextDay
                }
            },
            include: {
                menuItems: true
            }
        })

        return NextResponse.json(dailyMenu)
    } catch (error) {
        console.error('Error fetching daily menu:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create daily menu
export async function POST(req: Request) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { date, menuItemIds } = body

        if (!date || !menuItemIds || menuItemIds.length === 0) {
            return NextResponse.json({ error: 'Date and menu items are required' }, { status: 400 })
        }

        if (menuItemIds.length > 5) {
            return NextResponse.json({ error: 'Maximum 5 items allowed' }, { status: 400 })
        }

        const menuDate = new Date(date)
        menuDate.setHours(0, 0, 0, 0)

        // Check if menu already exists for this date
        const existingMenu = await db.dailyMenu.findFirst({
            where: {
                date: {
                    gte: menuDate,
                    lt: new Date(menuDate.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        })

        if (existingMenu) {
            return NextResponse.json({ error: 'Menu already exists for this date. Use PUT to update.' }, { status: 409 })
        }

        const dailyMenu = await db.dailyMenu.create({
            data: {
                date: menuDate,
                menuItems: {
                    connect: menuItemIds.map((id: string) => ({ id }))
                }
            },
            include: {
                menuItems: true
            }
        })

        return NextResponse.json(dailyMenu, { status: 201 })
    } catch (error) {
        console.error('Error creating daily menu:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT - Update daily menu
export async function PUT(req: Request) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { date, menuItemIds } = body

        if (!date || !menuItemIds) {
            return NextResponse.json({ error: 'Date and menu items are required' }, { status: 400 })
        }

        if (menuItemIds.length > 5) {
            return NextResponse.json({ error: 'Maximum 5 items allowed' }, { status: 400 })
        }

        const menuDate = new Date(date)
        menuDate.setHours(0, 0, 0, 0)
        const nextDay = new Date(menuDate)
        nextDay.setDate(nextDay.getDate() + 1)

        // Find existing menu
        const existingMenu = await db.dailyMenu.findFirst({
            where: {
                date: {
                    gte: menuDate,
                    lt: nextDay
                }
            }
        })

        if (!existingMenu) {
            // Create new if doesn't exist
            const dailyMenu = await db.dailyMenu.create({
                data: {
                    date: menuDate,
                    menuItems: {
                        connect: menuItemIds.map((id: string) => ({ id }))
                    }
                },
                include: {
                    menuItems: true
                }
            })
            return NextResponse.json(dailyMenu, { status: 201 })
        }

        // Disconnect all existing items and connect new ones
        const dailyMenu = await db.dailyMenu.update({
            where: { id: existingMenu.id },
            data: {
                menuItems: {
                    set: menuItemIds.map((id: string) => ({ id }))
                }
            },
            include: {
                menuItems: true
            }
        })

        return NextResponse.json(dailyMenu)
    } catch (error) {
        console.error('Error updating daily menu:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
