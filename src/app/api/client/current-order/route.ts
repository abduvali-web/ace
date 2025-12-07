import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id || session.user.role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch the most recent non-delivered order for this customer
        const currentOrder = await db.order.findFirst({
            where: {
                customerId: session.user.id,
                status: {
                    in: ['PENDING', 'PREPARING', 'ON_THE_WAY']
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                status: true,
                quantity: true,
                calories: true,
                createdAt: true,
                updatedAt: true,
                description: true
            }
        })

        if (!currentOrder) {
            return NextResponse.json({ order: null })
        }

        // Calculate estimated delivery time (mock: 45 mins from order creation for PENDING, 30 for PREPARING, 15 for ON_THE_WAY)
        let estimatedMinutes = 0
        switch (currentOrder.status) {
            case 'PENDING':
                estimatedMinutes = 45
                break
            case 'PREPARING':
                estimatedMinutes = 30
                break
            case 'ON_THE_WAY':
                estimatedMinutes = 15
                break
        }

        const estimatedDelivery = new Date(currentOrder.createdAt)
        estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + estimatedMinutes)

        const order = {
            id: currentOrder.id,
            status: currentOrder.status,
            estimatedDelivery: estimatedDelivery.toLocaleTimeString('uz-UZ', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            items: [
                {
                    name: currentOrder.description || 'Buyurtma',
                    calories: currentOrder.calories || 0,
                    quantity: currentOrder.quantity || 1
                }
            ]
        }

        return NextResponse.json({ order })
    } catch (error) {
        console.error('Error fetching current order:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
