import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-please-change'

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    // Verify token and check if user is MIDDLE_ADMIN or SUPER_ADMIN
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
    const { clientIds, isActive } = body

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ error: 'Не указаны ID клиентов' }, { status: 400 })
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Не указан статус активности' }, { status: 400 })
    }

    // Update clients in database
    let updatedCount = 0
    for (const clientId of clientIds) {
      try {
        // Update in database
        const updatedClient = await db.customer.update({
          where: { id: clientId },
          data: { isActive }
        })

        if (updatedClient) {
          updatedCount++
          console.log(`✅ Updated client ${updatedClient.name} status to ${isActive ? 'active' : 'inactive'}`)
        }
      } catch (error) {
        console.error(`❌ Error updating client ${clientId}:`, error)
      }
    }

    // Also update in global scheduler if available
    const scheduler = (global as any).autoOrderScheduler
    if (scheduler && scheduler.getClients) {
      const globalClients = scheduler.getClients()
      clientIds.forEach(clientId => {
        const clientIndex = globalClients.findIndex((c: any) => c.id === clientId)
        if (clientIndex !== -1) {
          globalClients[clientIndex].isActive = isActive
          console.log(`✅ Updated global client ${globalClients[clientIndex].name} status to ${isActive ? 'active' : 'inactive'}`)
        }
      })
    }

    return NextResponse.json({
      message: `Статус ${isActive ? 'возобновлен' : 'приостановлен'} для ${updatedCount} клиентов`,
      updatedCount
    })

  } catch (error) {
    console.error('Error toggling client status:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}