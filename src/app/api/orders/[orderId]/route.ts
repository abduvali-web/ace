import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment')
}

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  try { return jwt.verify(token, JWT_SECRET) as any } catch { return null }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = verifyToken(request)
    if (!user) return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })

    const { orderId } = params
    const { action } = await request.json()

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { customer: { select: { name: true, phone: true } } }
    })

    if (!order) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 })

    let updateData: any = {}

    switch (action) {
      case 'start_delivery':
        if (user.role !== 'COURIER') return NextResponse.json({ error: 'Только курьер может начать доставку' }, { status: 403 })
        if (order.orderStatus !== 'PENDING') return NextResponse.json({ error: 'Можно начать только ожидающий заказ' }, { status: 400 })
        updateData.orderStatus = 'IN_DELIVERY'
        updateData.courierId = user.id
        break
      case 'pause_delivery':
        if (user.role !== 'COURIER') return NextResponse.json({ error: 'Только курьер может приостановить доставку' }, { status: 403 })
        if (order.orderStatus !== 'IN_DELIVERY') return NextResponse.json({ error: 'Можно приостановить только активную доставку' }, { status: 400 })
        updateData.orderStatus = 'PAUSED'
        break
      case 'resume_delivery':
        if (user.role !== 'COURIER') return NextResponse.json({ error: 'Только курьер может возобновить доставку' }, { status: 403 })
        if (order.orderStatus !== 'PAUSED') return NextResponse.json({ error: 'Можно возобновить только приостановленную доставку' }, { status: 400 })
        updateData.orderStatus = 'IN_DELIVERY'
        break
      case 'complete_delivery':
        if (user.role !== 'COURIER') return NextResponse.json({ error: 'Только курьер может завершить доставку' }, { status: 403 })
        updateData.orderStatus = 'DELIVERED'
        updateData.deliveredAt = new Date()
        break
      default:
        return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 })
    }

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: updateData,
      include: { customer: { select: { name: true, phone: true } } }
    })

    const transformedOrder = {
      ...updatedOrder,
      customerName: updatedOrder.customer?.name || 'Неизвестный клиент',
      customerPhone: updatedOrder.customer?.phone || 'Нет телефона',
      customer: { name: updatedOrder.customer?.name || 'Неизвестный клиент', phone: updatedOrder.customer?.phone || 'Нет телефона' },
      deliveryDate: updatedOrder.deliveryDate ? new Date(updatedOrder.deliveryDate).toISOString().split('T')[0] : new Date(updatedOrder.createdAt).toISOString().split('T')[0],
      isAutoOrder: true
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = verifyToken(request)
    if (!user) return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })

    const { orderId } = params

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { customer: { select: { name: true, phone: true } } }
    })

    if (!order) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 })

    const transformedOrder = {
      ...order,
      customerName: order.customer?.name || 'Неизвестный клиент',
      customerPhone: order.customer?.phone || 'Нет телефона',
      customer: { name: order.customer?.name || 'Неизвестный клиент', phone: order.customer?.phone || 'Нет телефона' },
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : new Date(order.createdAt).toISOString().split('T')[0],
      isAutoOrder: true
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
