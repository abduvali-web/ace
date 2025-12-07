import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// POST - Produce menu items (deduct ingredients from sklad)
export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { quantity } = body

        if (!quantity || quantity <= 0) {
            return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
        }

        // Get the menu item with its recipe
        const menuItem = await db.menuItem.findUnique({
            where: { id: params.id },
            include: {
                ingredients: {
                    include: {
                        ingredient: true
                    }
                }
            }
        })

        if (!menuItem) {
            return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
        }

        // Check if we have enough ingredients
        for (const recipeIng of menuItem.ingredients) {
            const requiredAmount = recipeIng.quantityRequired * quantity
            if (recipeIng.ingredient.quantity < requiredAmount) {
                return NextResponse.json({
                    error: `${recipeIng.ingredient.name} yetarli emas. Kerak: ${requiredAmount} ${recipeIng.ingredient.unit}, Mavjud: ${recipeIng.ingredient.quantity} ${recipeIng.ingredient.unit}`
                }, { status: 400 })
            }
        }

        // Deduct ingredients from inventory
        for (const recipeIng of menuItem.ingredients) {
            const deductAmount = recipeIng.quantityRequired * quantity
            await db.ingredient.update({
                where: { id: recipeIng.ingredientId },
                data: {
                    quantity: {
                        decrement: deductAmount
                    }
                }
            })
        }

        // Increase menu item stock
        const updatedMenuItem = await db.menuItem.update({
            where: { id: params.id },
            data: {
                stock: {
                    increment: quantity
                }
            }
        })

        return NextResponse.json({
            success: true,
            newStock: updatedMenuItem.stock,
            message: `${quantity} ta ${menuItem.name} tayyorlandi`
        })
    } catch (error) {
        console.error('Error producing menu item:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
