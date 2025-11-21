import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-please-change'

export async function DELETE(request: NextRequest) {
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
            return NextResponse.json({ error: 'Не указаны ID клиентов для удаления' }, { status: 400 })
        }

        let deletedClients = 0
        let deletedOrders = 0

        try {
            for (const clientId of clientIds) {
                try {
                    // Delete all orders for this client
                    const deletedOrdersResult = await db.order.deleteMany({
                        where: { customerId: clientId }
                    })
                    deletedOrders += deletedOrdersResult.count

                    // Permanently delete the client
                    const deletedClient = await db.customer.delete({
                        where: { id: clientId }
                    })

                    if (deletedClient) {
                        deletedClients++
                        console.log(`✅ Permanently deleted client ${deletedClient.name}`)
                    }

                } catch (dbError) {
                    console.error(`❌ Error permanently deleting client ${clientId}:`, dbError)
                }
            }

            return NextResponse.json({
                success: true,
                deletedClients,
                deletedOrders,
                message: `Успешно удалено навсегда: ${deletedClients} клиентов и ${deletedOrders} заказов`
            })

        } catch (error) {
            console.error('Permanent delete error:', error)
            return NextResponse.json({
                error: 'Ошибка при окончательном удалении',
                details: error instanceof Error ? error.message : 'Неизвестная ошибка'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Permanent delete API error:', error)
        return NextResponse.json({
            error: 'Внутренняя ошибка сервера',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        }, { status: 500 })
    }
}
