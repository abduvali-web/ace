import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-please-change'

export async function DELETE(request: NextRequest) {
  try {
    // Check authorization
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

    let movedTobin = 0
    let deletedOrders = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
      // Process each client
      for (const clientId of clientIds) {
        try {
          // Get client to check if active
          const client = await db.customer.findUnique({
            where: { id: clientId }
          })

          if (!client) {
            console.log(`⚠️ Client ${clientId} not found`)
            continue
          }

          // If client is active, delete future auto-generated orders from today onwards
          if (client.isActive) {
            const deletedOrdersResult = await db.order.deleteMany({
              where: {
                customerId: clientId,
                isAutoOrder: true,
                deliveryDate: {
                  gte: today
                }
              }
            })
            deletedOrders += deletedOrdersResult.count
            console.log(`✅ Deleted ${deletedOrdersResult.count} future auto orders for active client ${client.name}`)
          } else {
            // If inactive, preserve all orders
            console.log(`ℹ️ Preserving all orders for inactive client ${client.name}`)
          }

          // Soft delete the client (set deletedAt timestamp)
          await db.customer.update({
            where: { id: clientId },
            data: {
              deletedAt: new Date(),
              deletedBy: user.id
            }
          })

          movedTobin++
          console.log(`✅ Moved client ${client.name} to bin`)

          // Remove from global scheduler if it exists
          const scheduler = (global as any).autoOrderScheduler
          if (scheduler) {
            scheduler.removeClient(clientId)
            console.log(`✅ Removed client ${client.name} from global scheduler`)
          }

        } catch (dbError) {
          console.error(`❌ Error processing client ${clientId}:`, dbError)
        }
      }

      return NextResponse.json({
        success: true,
        movedTobin,
        deletedOrders,
        message: `Успешно перемещено в корзину: ${movedTobin} клиентов. Удалено будущих авто-заказов: ${deletedOrders}`
      })

    } catch (error) {
      console.error('Delete clients error:', error)
      return NextResponse.json({
        error: 'Ошибка при перемещении в корзину',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Delete clients API error:', error)
    return NextResponse.json({
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}