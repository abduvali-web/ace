import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-please-change'

export async function DELETE(request: NextRequest) {
  try {
    // Проверяем авторизацию
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
    const { clientIds, deleteOrders = true, daysBack = 30 } = body

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ error: 'Не указаны ID клиентов для удаления' }, { status: 400 })
    }

    let deletedClients = 0
    let deletedOrders = 0

    try {
      // Сначала удаляем из базы данных
      for (const clientId of clientIds) {
        try {
          // Удаляем заказы клиента из базы данных
          if (deleteOrders) {
            const deletedOrdersResult = await db.order.deleteMany({
              where: { customerId: clientId }
            })
            deletedOrders += deletedOrdersResult.count
            console.log(`✅ Deleted ${deletedOrdersResult.count} orders for client ${clientId}`)
          }

          // Удаляем клиента из базы данных
          const deletedClient = await db.customer.delete({
            where: { id: clientId }
          })

          if (deletedClient) {
            deletedClients++
            console.log(`✅ Deleted client ${deletedClient.name} from database`)
          }
        } catch (dbError) {
          console.error(`❌ Error deleting client ${clientId} from database:`, dbError)
        }
      }

      // Также удаляем из глобального storage если доступен
      const scheduler = (global as any).autoOrderScheduler

      if (scheduler) {
        // Получаем текущие клиенты и заказы
        const currentClients = scheduler.getClients()
        const currentOrders = scheduler.getOrders()

        // Фильтруем клиентов для удаления
        const clientsToDelete = currentClients.filter((client: any) => clientIds.includes(client.id))

        // Удаляем заказы для этих клиентов из глобального хранилища
        if (deleteOrders) {
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - daysBack)
          startDate.setHours(0, 0, 0, 0)

          const endDate = new Date()
          endDate.setDate(endDate.getDate() + 30)
          endDate.setHours(23, 59, 59, 999)

          const filteredOrders = currentOrders.filter((order: any) => {
            const orderDate = new Date(order.createdAt)
            const isClientOrder = clientsToDelete.some((client: any) =>
              order.customerName === client.name && order.customerPhone === client.phone
            )
            return isClientOrder && orderDate >= startDate && orderDate <= endDate
          })

          // Удаляем заказы из scheduler
          filteredOrders.forEach((order: any) => {
            scheduler.removeOrder(order.id)
          })
          // Note: deletedOrders already counted from database deletion
        }

        // Удаляем клиентов из scheduler
        clientsToDelete.forEach((client: any) => {
          scheduler.removeClient(client.id)
          console.log(`✅ Removed client ${client.name} from global storage`)
        })
      }

      return NextResponse.json({
        success: true,
        deletedClients,
        deletedOrders,
        message: `Успешно удалено ${deletedClients} клиентов и ${deletedOrders} заказов`
      })

    } catch (error) {
      console.error('Delete clients error:', error)
      return NextResponse.json({
        error: 'Ошибка при удалении данных',
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