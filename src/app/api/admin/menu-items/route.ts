import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// GET all menu items with ingredients
export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const menuItems = await db.menuItem.findMany({
            include: {
                ingredients: {
                    include: {
                        ingredient: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        })

        // Transform data to flatten ingredient info
        const transformedItems = menuItems.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            calories: item.calories,
            stock: item.stock,
            image: item.image,
            ingredients: item.ingredients.map(mi => ({
                ingredientId: mi.ingredientId,
                ingredientName: mi.ingredient.name,
                quantityRequired: mi.quantityRequired
            }))
        }))

        return NextResponse.json(transformedItems)
    } catch (error) {
        console.error('Error fetching menu items:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create new menu item with recipe
export async function POST(req: Request) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { name, description, calories, stock, image, ingredients } = body

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const menuItem = await db.menuItem.create({
            data: {
                name,
                description,
                calories: calories || 0,
                stock: stock || 0,
                image,
                ingredients: {
                    create: (ingredients || []).map((ing: { ingredientId: string; quantityRequired: number }) => ({
                        ingredientId: ing.ingredientId,
                        quantityRequired: ing.quantityRequired
                    }))
                }
            },
            include: {
                ingredients: {
                    include: {
                        ingredient: true
                    }
                }
            }
        })

        return NextResponse.json(menuItem, { status: 201 })
    } catch (error) {
        console.error('Error creating menu item:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
