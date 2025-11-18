import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch {
    return null
  }
}

function startOfDay(date: Date) { const d = new Date(date); d.setHours(0,0,0,0); return d }
function endOfDay(date: Date) { const d = new Date(date); d.setHours(23,59,59,999); return d }

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user || user.role !== 'COURIER') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Find next pending order in database for today only (day range to avoid TZ issues)
    const now = new Date()
    const dayStart = startOfDay(now)
    const dayEnd = endOfDay(now)

    const nextOrder = await db.order.findFirst({
      where: {
        orderStatus: 'PENDING',
        OR: [
          { deliveryDate: { gte: dayStart, lte: dayEnd } },
          { deliveryDate: null, createdAt: { gte: dayStart, lte: dayEnd } }
        ]
      },
      include: {
        customer: { select: { name: true, phone: true } }
      },
      orderBy: [
        { deliveryDate: { sort: 'asc', nulls: 'first' } as any },
        { createdAt: 'asc' }
      ]
    })

    if (!nextOrder) {
      return NextResponse.json({ message: 'No pending orders' }, { status: 404 })
    }

    const transformedOrder = {
      ...nextOrder,
      customerName: nextOrder.customer?.name || 'Неизвестный клиент',
      customerPhone: nextOrder.customer?.phone || 'Нет телефона',
      customer: {
        name: nextOrder.customer?.name || 'Неизвестный клиент',
        phone: nextOrder.customer?.phone || 'Нет телефона'
      },
      deliveryDate: nextOrder.deliveryDate ? new Date(nextOrder.deliveryDate).toISOString().split('T')[0] : new Date(nextOrder.createdAt).toISOString().split('T')[0],
      isAutoOrder: true
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error fetching next order:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
