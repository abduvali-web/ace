import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// GET all ingredients
export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const ingredients = await db.ingredient.findMany({
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(ingredients)
    } catch (error) {
        console.error('Error fetching ingredients:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create new ingredient
export async function POST(req: Request) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { name, quantity, unit } = body

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const ingredient = await db.ingredient.create({
            data: {
                name,
                quantity: quantity || 0,
                unit: unit || 'kg'
            }
        })

        return NextResponse.json(ingredient, { status: 201 })
    } catch (error) {
        console.error('Error creating ingredient:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
