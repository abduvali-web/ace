import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// PUT - Update ingredient
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
        const { name, quantity, unit } = body

        const ingredient = await db.ingredient.update({
            where: { id: params.id },
            data: {
                name,
                quantity,
                unit
            }
        })

        return NextResponse.json(ingredient)
    } catch (error) {
        console.error('Error updating ingredient:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Remove ingredient
export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await db.ingredient.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting ingredient:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
