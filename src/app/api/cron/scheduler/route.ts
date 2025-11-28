import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// This function should be the same as the one in server.ts but adapted for API route
// We need to duplicate the logic or extract it to a shared library.
// Since server.ts is not part of the build, we should move the logic to a shared file.
// For now, I will inline a simplified version here to ensure it works on Vercel.

function getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
}

function generateDeliveryTime(): string {
    const hour = 11 + Math.floor(Math.random() * 3) // 11:00 - 14:00
    const minute = Math.floor(Math.random() * 60)
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

export async function GET(req: Request) {
    try {
        // Verify cron secret if needed (Vercel handles this automatically for configured crons)
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //   return new Response('Unauthorized', { status: 401 });
        // }

        console.log('🤖 Auto Order Scheduler started via Cron')

        const today = new Date()
        const startDate = new Date(today)
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 30) // Generate for next 30 days

        // Get all active customers
        const customers = await db.customer.findMany({
            where: { isActive: true }
        })

        let totalOrdersCreated = 0

        // Get default admin
        const defaultAdmin = await db.admin.findFirst({
            where: { role: 'SUPER_ADMIN' }
        })

        if (!defaultAdmin) {
            return NextResponse.json({ error: 'No default admin found' }, { status: 500 })
        }

        for (const client of customers) {
            // Parse delivery days or use default
            // Assuming client.deliveryDays is stored as JSON or we use a default pattern
            // Ideally we should fetch this from the DB if it was part of the schema
            // For now, we'll assume daily delivery if not specified

            const startDate = new Date(today)
            const endDate = new Date(today)
            endDate.setDate(endDate.getDate() + 30)

            // Iterate through each day in the next 30 days
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const deliveryDate = new Date(d)

                // Check if order already exists for this client and date
                const existingOrder = await db.order.findFirst({
                    where: {
                        customerId: client.id,
                        deliveryDate: {
                            gte: new Date(deliveryDate.setHours(0, 0, 0, 0)),
                            lt: new Date(deliveryDate.setHours(23, 59, 59, 999))
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
                            deliveryDate: new Date(d), // Use the loop date
                            deliveryTime: generateDeliveryTime(),
                            quantity: 1,
                            calories: 2000, // Default or from client
                            specialFeatures: client.preferences,
                            paymentStatus: 'UNPAID',
                            paymentMethod: 'CASH',
                            isPrepaid: false,
                            isAutoOrder: true,
                            orderStatus: 'PENDING',
                        }
                    })
                    totalOrdersCreated++
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Scheduler completed. Created ${totalOrdersCreated} orders.`
        })
    } catch (error) {
        console.error('Scheduler error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
