import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// PUT - Update menu item
export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { name, description, calories, stock, image, ingredients } = body

        // Delete existing recipe ingredients and create new ones
        await db.menuItemIngredient.deleteMany({
            where: { menuItemId: params.id }
        })

        const menuItem = await db.menuItem.update({
            where: { id: params.id },
            data: {
                name,
                description,
                calories,
                stock,
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

        return NextResponse.json(menuItem)
    } catch (error) {
        console.error('Error updating menu item:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Remove menu item
export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Delete recipe ingredients first
        await db.menuItemIngredient.deleteMany({
            where: { menuItemId: params.id }
        })

        await db.menuItem.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting menu item:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
