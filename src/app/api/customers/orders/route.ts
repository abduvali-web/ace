import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const customerId = request.headers.get('x-customer-id')
        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 401 })
        }

        const orders = await db.order.findMany({
            where: {
                customerId: customerId,
                deletedAt: null
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                courier: {
                    select: {
                        name: true,
                        phone: true
                    }
                }
            }
        })

        return NextResponse.json(orders)

    } catch (error) {
        console.error('Error fetching customer orders:', error)
        return NextResponse.json({
            error: 'Внутренняя ошибка сервера',
            ...(process.env.NODE_ENV === 'development' && { details: error instanceof Error ? error.message : 'Unknown error' })
        }, { status: 500 })
    }
}
