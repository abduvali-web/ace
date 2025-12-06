import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, hasRole } from '@/lib/auth-utils'

function isEligibleByPattern(orderPattern: string | null | undefined, date: Date) {
  const day = date.getDate()
  switch (orderPattern) {
    case 'every_other_day_even':
      return day % 2 === 0
    case 'every_other_day_odd':
      return day % 2 === 1
    case 'daily':
    default:
      return true
  }
}

function startOfDay(date: Date) { const d = new Date(date); d.setHours(0, 0, 0, 0); return d }
function endOfDay(date: Date) { const d = new Date(date); d.setHours(23, 59, 59, 999); return d }
function defaultDeliveryTime(): string { const h = 11 + Math.floor(Math.random() * 3); const m = Math.floor(Math.random() * 60); return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}` }

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !hasRole(user, ['MIDDLE_ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { targetDate } = await request.json()
    const processDate = targetDate ? new Date(targetDate) : new Date()
    const dayStart = startOfDay(processDate)
    const dayEnd = endOfDay(processDate)

    const customers = await db.customer.findMany({ where: { isActive: true } })
    const defaultAdmin = await db.admin.findFirst({ where: { role: 'SUPER_ADMIN' } })
    if (!defaultAdmin) return NextResponse.json({ error: 'Администратор не найден' }, { status: 400 })

    const eligible = customers.filter(c => isEligibleByPattern(c.orderPattern, processDate))

    let created = 0
    const createdOrders: any[] = []

    for (const c of eligible) {
      const existing = await db.order.findFirst({
        where: { customerId: c.id, deliveryDate: { gte: dayStart, lte: dayEnd } },
        select: { id: true }
      })
      if (existing) continue

      const lastOrder = await db.order.findFirst({ orderBy: { orderNumber: 'desc' }, select: { orderNumber: true } })
      const nextOrderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1

      const createdOrder = await db.order.create({
        data: {
          orderNumber: nextOrderNumber,
          customerId: c.id,
          adminId: defaultAdmin.id,
          deliveryAddress: c.address,
          deliveryDate: new Date(dayStart),
          deliveryTime: defaultDeliveryTime(),
          quantity: 1,
          calories: c.calories ?? 1600,
          specialFeatures: c.preferences || '',
          paymentStatus: 'UNPAID',
          paymentMethod: 'CASH',
          isPrepaid: false,
          orderStatus: 'PENDING',
        },
        include: { customer: { select: { name: true, phone: true } } }
      })

      created++
      createdOrders.push({
        id: createdOrder.id,
        customerName: createdOrder.customer?.name,
        customerPhone: createdOrder.customer?.phone,
        deliveryAddress: createdOrder.deliveryAddress,
        deliveryDate: createdOrder.deliveryDate?.toISOString().split('T')[0],
        deliveryTime: createdOrder.deliveryTime,
        calories: createdOrder.calories,
        paymentStatus: createdOrder.paymentStatus,
        orderStatus: createdOrder.orderStatus,
        isAutoOrder: true,
        createdAt: createdOrder.createdAt
      })
    }

    return NextResponse.json({ message: `Автоматически создано ${created} заказов`, processedDate: processDate.toDateString(), eligibleClients: eligible.length, createdOrders: createdOrders.length, orders: createdOrders })
  } catch (error: any) {
    console.error('Error creating auto orders:', error)
    return NextResponse.json({
      error: 'Внутренняя ошибка сервера',
      ...(process.env.NODE_ENV === 'development' && { details: error instanceof Error ? error.message : 'Unknown error' })
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !hasRole(user, ['MIDDLE_ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const target = dateParam ? new Date(dateParam) : new Date()
    const dayStart = startOfDay(target)
    const dayEnd = endOfDay(target)

    const todays = await db.order.findMany({
      where: { deliveryDate: { gte: dayStart, lte: dayEnd } },
      include: { customer: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' }
    })

    const tomorrow = new Date(dayStart)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const customers = await db.customer.findMany({ where: { isActive: true }, select: { id: true, name: true, phone: true, orderPattern: true } })
    const tomorrowEligible = customers.filter(c => isEligibleByPattern(c.orderPattern, tomorrow))

    return NextResponse.json({
      todayStats: {
        date: dayStart.toDateString(),
        autoOrdersCreated: todays.length,
        orders: todays.map(o => ({ id: o.id, customerName: o.customer?.name, customerPhone: o.customer?.phone, deliveryAddress: o.deliveryAddress, deliveryDate: o.deliveryDate?.toISOString().split('T')[0], deliveryTime: o.deliveryTime, isAutoOrder: true }))
      },
      tomorrowPreview: { date: tomorrow.toDateString(), eligibleClients: tomorrowEligible.length, clients: tomorrowEligible }
    })
  } catch (error) {
    console.error('Error getting auto orders stats:', error)
    return NextResponse.json({
      error: 'Внутренняя ошибка сервера',
      ...(process.env.NODE_ENV === 'development' && { details: error instanceof Error ? error.message : 'Unknown error' })
    }, { status: 500 })
  }
}
