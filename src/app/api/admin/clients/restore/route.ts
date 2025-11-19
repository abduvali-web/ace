import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-please-change'

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

        const body = await request.json()
        const { clientIds } = body

        if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
            return NextResponse.json({ error: 'Не указаны ID клиентов для восстановления' }, { status: 400 })
        }

        let restoredClients = 0
        let recreatedOrders = 0

        try {
            for (const clientId of clientIds) {
                // Get the client to check if it's deleted
                const client = await db.customer.findUnique({
                    where: { id: clientId }
                })

                if (!client || !client.deletedAt) {
                    console.log(`⚠️ Client ${clientId} not found in bin`)
                    continue
                }

                // Restore the client (clear deletedAt)
                await db.customer.update({
                    where: { id: clientId },
                    data: {
                        deletedAt: null,
                        deletedBy: null
                    }
                })

                restoredClients++
                console.log(`✅ Restored client ${client.name}`)

                // Add back to global scheduler if active
                const scheduler = (global as any).autoOrderScheduler
                if (scheduler && client.isActive) {
                    // Re-add client to scheduler - it will create auto orders
                    const clientData = {
                        id: client.id,
                        name: client.name,
                        phone: client.phone,
                        address: client.address,
                        calories: 2000, // Default, should be fetched from client preferences
                        specialFeatures: client.preferences || '',
                        deliveryDays: {
                            monday: true,
                            tuesday: true,
                            wednesday: true,
                            thursday: true,
                            friday: true,
                            saturday: true,
                            sunday: true
                        },
                        autoOrdersEnabled: true,
                        isActive: client.isActive,
                        createdAt: client.createdAt.toISOString(),
                        lastAutoOrderCheck: new Date().toISOString()
                    }

                    await scheduler.addClient(clientData)
                    console.log(`✅ Re-added client ${client.name} to scheduler`)

                    // Count newly created orders
                    const orders = scheduler.getOrders()
                    const clientOrders = orders.filter((order: any) =>
                        order.customerPhone === client.phone
                    )
                    recreatedOrders += clientOrders.length
                }
            }

            return NextResponse.json({
                success: true,
                restoredClients,
                recreatedOrders,
                message: `Успешно восстановлено: ${restoredClients} клиентов${recreatedOrders > 0 ? `, создано ${recreatedOrders} заказов` : ''}`
            })

        } catch (error) {
            console.error('Restore clients error:', error)
            return NextResponse.json({
                error: 'Ошибка при восстановлении клиентов',
                details: error instanceof Error ? error.message : 'Неизвестная ошибка'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Restore clients API error:', error)
        return NextResponse.json({
            error: 'Внутренняя ошибка сервера',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        }, { status: 500 })
    }
}
