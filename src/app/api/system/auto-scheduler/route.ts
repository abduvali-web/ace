import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyRequestToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  try { return jwt.verify(token, JWT_SECRET) as any } catch { return null }
}

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

function startOfDay(date: Date) { const d = new Date(date); d.setHours(0,0,0,0); return d }
function endOfDay(date: Date) { const d = new Date(date); d.setHours(23,59,59,999); return d }
function defaultDeliveryTime(): string { const h=11+Math.floor(Math.random()*3); const m=Math.floor(Math.random()*60); return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}` }

export async function GET(request: NextRequest) {
  try {
    const user = verifyRequestToken(request)
    if (!user) return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    if (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const today = new Date()
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0)

    const customers = await db.customer.findMany({ where: { isActive: true }, select: { id:true, name:true, phone:true, address:true, orderPattern:true, preferences:true } })
    const defaultAdmin = await db.admin.findFirst({ where: { role: 'SUPER_ADMIN' } })
    if (!defaultAdmin) return NextResponse.json({ error: 'Администратор не найден' }, { status: 400 })

    let totalOrdersCreated = 0
    const details: any[] = []

    for (const c of customers) {
      let createdForClient = 0
      const dates: string[] = []

      const current = new Date(nextMonthStart)
      while (current <= nextMonthEnd) {
        if (isEligibleByPattern((c as any).orderPattern, current)) {
          const s = startOfDay(current)
          const e = endOfDay(current)
          const exists = await db.order.findFirst({ where: { customerId: c.id, deliveryDate: { gte: s, lte: e } }, select: { id: true } })
          if (!exists) {
            const last = await db.order.findFirst({ orderBy: { orderNumber: 'desc' }, select: { orderNumber: true } })
            const nextOrderNumber = last ? last.orderNumber + 1 : 1
            await db.order.create({
              data: {
                orderNumber: nextOrderNumber,
                customerId: c.id,
                adminId: defaultAdmin.id,
                deliveryAddress: c.address!,
                deliveryDate: new Date(s),
                deliveryTime: defaultDeliveryTime(),
                quantity: 1,
                calories: 1600,
                specialFeatures: (c as any).preferences || '',
                paymentStatus: 'UNPAID',
                paymentMethod: 'CASH',
                isPrepaid: false,
                orderStatus: 'PENDING'
              }
            })
            createdForClient++
            totalOrdersCreated++
            dates.push(s.toISOString().split('T')[0])
          }
        }
        current.setDate(current.getDate() + 1)
      }

      details.push({ clientId: c.id, clientName: c.name, ordersCreated: createdForClient, deliveryDates: dates })
    }

    return NextResponse.json({
      success: true,
      message: `Автоматически создано ${totalOrdersCreated} заказов на следующий месяц для ${customers.length} активных клиентов`,
      summary: {
        period: `${nextMonthStart.toISOString().split('T')[0]} - ${nextMonthEnd.toISOString().split('T')[0]}`,
        totalActiveClients: customers.length,
        totalOrdersCreated,
        timestamp: new Date().toISOString()
      },
      details
    })
  } catch (error: any) {
    console.error('Scheduler error:', error)
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) { return GET(request) }
