import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-please-change'

function getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
}

function generateDeliveryTime(): string {
    const hour = 11 + Math.floor(Math.random() * 3) // 11:00 - 14:00
    const minute = Math.floor(Math.random() * 60)
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '')

        if (!token) {
            return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
        }

        let user: any
        try {
            user = jwt.verify(token, JWT_SECRET)
        } catch (error) {
            return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
        }

        if (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
        }

        console.log('🚀 Manual Auto Order Creation triggered by', user.email)

        const today = new Date()
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 30) // Generate for next 30 days

        // Get all active customers (excluding deleted ones)
        const customers = await db.customer.findMany({
            where: {
                isActive: true,
                deletedAt: null
            }
        })

        let totalOrdersCreated = 0

        // Get default admin
        const defaultAdmin = await db.admin.findFirst({
            where: { role: 'SUPER_ADMIN' }
        })

        if (!defaultAdmin) {
            return NextResponse.json({ error: 'Администратор по умолчанию не найден' }, { status: 500 })
        }

        for (const client of customers) {
            const startDate = new Date(today)
            const endDate = new Date(today)
            endDate.setDate(endDate.getDate() + 30)

            // Iterate through each day in the next 30 days
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const deliveryDate = new Date(d)

                // Check if order already exists for this client and date
                const dayStart = new Date(d)
                dayStart.setHours(0, 0, 0, 0)
                const dayEnd = new Date(d)
                dayEnd.setHours(23, 59, 59, 999)

                const existingOrder = await db.order.findFirst({
                    where: {
                        customerId: client.id,
                        deliveryDate: {
                            gte: dayStart,
                            lt: dayEnd
                        }
                    }
                })

                if (!existingOrder) {
                    // Create order
                    const lastOrder = await db.order.findFirst({
                        orderBy: { orderNumber: 'desc' }
                    })
                    const nextOrderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1

                    await db.order.create({
                        data: {
                            orderNumber: nextOrderNumber,
                            customerId: client.id,
                            adminId: defaultAdmin.id,
                            deliveryAddress: client.address,
                            deliveryDate: new Date(d),
                            deliveryTime: generateDeliveryTime(),
                            quantity: 1,
                            calories: 2000, // Default or from client preferences
                            specialFeatures: client.preferences,
                            paymentStatus: 'UNPAID',
                            paymentMethod: 'CASH',
                            isPrepaid: false,
                            orderStatus: 'PENDING',
                            isAutoOrder: true // Mark as auto-generated
                        }
                    })
                    totalOrdersCreated++
                }
            }
        }

        return NextResponse.json({
            success: true,
            ordersCreated: totalOrdersCreated,
            message: `Создано ${totalOrdersCreated} автоматических заказов`
        })

    } catch (error) {
        console.error('Run auto orders error:', error)
        return NextResponse.json({
            error: 'Ошибка при создании автоматических заказов',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        }, { status: 500 })
    }
}
