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

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Calculate statistics using database aggregation for performance
    const [
      successfulOrders,
      failedOrders,
      pendingOrders,
      inDeliveryOrders,
      prepaidOrders,
      unpaidOrders,
      cardOrders,
      cashOrders,
      dailyCustomersOrders,
      evenDayCustomersOrders,
      oddDayCustomersOrders,
      specialPreferenceCustomersOrders,
      orders1200,
      orders1600,
      orders2000,
      orders2500,
      orders3000,
      singleItemOrders,
      multiItemOrders
    ] = await Promise.all([
      db.order.count({ where: { orderStatus: 'DELIVERED' } }),
      db.order.count({ where: { orderStatus: 'FAILED' } }),
      db.order.count({ where: { orderStatus: 'PENDING' } }),
      db.order.count({ where: { orderStatus: 'IN_DELIVERY' } }),
      db.order.count({ where: { isPrepaid: true } }),
      db.order.count({ where: { isPrepaid: false } }),
      db.order.count({ where: { paymentMethod: 'CARD' } }),
      db.order.count({ where: { paymentMethod: 'CASH' } }),
      db.order.count({ where: { customer: { orderPattern: 'daily' } } }),
      db.order.count({ where: { customer: { orderPattern: 'every_other_day_even' } } }),
      db.order.count({ where: { customer: { orderPattern: 'every_other_day_odd' } } }),
      db.order.count({ where: { specialFeatures: { not: '' } } }), // Assuming empty string means no special features
      db.order.count({ where: { calories: 1200 } }),
      db.order.count({ where: { calories: 1600 } }),
      db.order.count({ where: { calories: 2000 } }),
      db.order.count({ where: { calories: 2500 } }),
      db.order.count({ where: { calories: 3000 } }),
      db.order.count({ where: { quantity: 1 } }),
      db.order.count({ where: { quantity: { gte: 2 } } })
    ])

    const stats = {
      successfulOrders,
      failedOrders,
      pendingOrders,
      inDeliveryOrders,
      prepaidOrders,
      unpaidOrders,
      cardOrders,
      cashOrders,
      dailyCustomers: dailyCustomersOrders, // Keeping key name for frontend compatibility
      evenDayCustomers: evenDayCustomersOrders,
      oddDayCustomers: oddDayCustomersOrders,
      specialPreferenceCustomers: specialPreferenceCustomersOrders,
      orders1200,
      orders1600,
      orders2000,
      orders2500,
      orders3000,
      singleItemOrders,
      multiItemOrders
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}