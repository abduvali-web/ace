import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, hasRole } from '@/lib/auth-utils'

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
        const user = await getAuthUser(request)
        if (!user || !hasRole(user, ['MIDDLE_ADMIN', 'SUPER_ADMIN'])) {
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
            },
            select: {
                id: true,
                name: true,
                phone: true,
                address: true,
                preferences: true,
                orderPattern: true,
                createdBy: true
            }
        })

        let totalOrdersCreated = 0

        for (const client of customers) {
            const startDate = new Date(today)
            const endDate = new Date(today)
            endDate.setDate(endDate.getDate() + 30)

            // Parse delivery days from orderPattern
            let deliveryDays = {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: true,
                sunday: true
            }

            if (client.orderPattern) {
                try {
                    deliveryDays = JSON.parse(client.orderPattern)
                } catch (e) {
                    console.error('Error parsing orderPattern for client', client.id, e)
                }
            }

            // Determine the adminId to use:
            // Use client's creator if available, otherwise use the current user (who triggered the scheduler)
            const adminId = client.createdBy || user.id

            // Iterate through each day in the next 30 days
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dayName = getDayOfWeek(d)

                // Skip if delivery is not enabled for this day
                if (!deliveryDays[dayName as keyof typeof deliveryDays]) {
                    continue
                }

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
                            adminId: adminId,
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
            ...(process.env.NODE_ENV === 'development' && {
                details: error instanceof Error ? error.message : 'Неизвестная ошибка'
            })
        }, { status: 500 })
    }
}
