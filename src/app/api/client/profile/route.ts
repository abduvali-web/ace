import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id || session.user.role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const customer = await db.customer.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                phone: true,
                calories: true,
                createdAt: true,
                isActive: true,
            }
        })

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // Get today's orders to calculate consumed calories
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const todayOrders = await db.order.findMany({
            where: {
                customerId: customer.id,
                createdAt: {
                    gte: today,
                    lt: tomorrow
                },
                status: {
                    in: ['DELIVERED', 'ON_THE_WAY', 'PREPARING', 'PENDING']
                }
            },
            select: {
                calories: true,
                quantity: true
            }
        })

        // Calculate consumed calories: sum of (order calories * quantity)
        const consumedCalories = todayOrders.reduce((total, order) => {
            return total + (order.calories || 0) * (order.quantity || 1)
        }, 0)

        // Mock plan data - in a real app, this would come from a subscription/plan table
        const plan = {
            name: 'Premium Plan',
            startDate: customer.createdAt.toISOString(),
            endDate: new Date(new Date(customer.createdAt).setMonth(customer.createdAt.getMonth() + 1)).toISOString(),
            dailyCalories: customer.calories || 2000
        }

        return NextResponse.json({
            ...customer,
            consumedCalories,
            plan
        })
    } catch (error) {
        console.error('Error fetching customer profile:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
