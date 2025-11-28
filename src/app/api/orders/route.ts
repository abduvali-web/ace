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
  try { return jwt.verify(token, JWT_SECRET!) as any } catch { return null }
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    if (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'COURIER') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const filtersParam = searchParams.get('filters')
    let filters: any = {}
    if (filtersParam) {
      try { filters = JSON.parse(filtersParam) } catch (error) { console.error('Error parsing filters:', error) }
    }

    const orders = await db.order.findMany({
      include: { customer: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' }
    })

    let filteredOrders = orders
    if (user.role === 'COURIER') {
      const today = new Date().toISOString().split('T')[0]
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : new Date(order.createdAt).toISOString().split('T')[0]
        return orderDate === today
      })
    } else {
      if (date) {
        filteredOrders = filteredOrders.filter(order => {
          const orderDate = order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : new Date(order.createdAt).toISOString().split('T')[0]
          return orderDate === date
        })
      }
      if (Object.keys(filters).length > 0) {
        filteredOrders = filteredOrders.filter(order => {
          if (filters.successful && order.orderStatus !== 'DELIVERED') return false
          if (filters.failed && order.orderStatus !== 'FAILED') return false
          if (filters.pending && order.orderStatus !== 'PENDING') return false
          if (filters.inDelivery && order.orderStatus !== 'IN_DELIVERY') return false
          if (filters.prepaid && !order.isPrepaid) return false
          if (filters.unpaid && order.paymentStatus !== 'UNPAID') return false
          if (filters.card && order.paymentMethod !== 'CARD') return false
          if (filters.cash && order.paymentMethod !== 'CASH') return false

          // Fix filter logic: if filter is ON, we want to SHOW it.
          // But here we are returning FALSE to exclude.
          // Logic: "If autoOrders filter is ON, and this is NOT auto order, should we exclude it?"
          // Usually filters are "Show X". If multiple are checked, it's usually OR (Show X OR Y).
          // But here it seems to be implemented as "If X is checked, only show X"?
          // Let's assume standard "Filter by Type":
          // If "Auto Orders" is checked and "Manual Orders" is unchecked -> Show ONLY Auto.
          // If "Auto Orders" is unchecked and "Manual Orders" is checked -> Show ONLY Manual.
          // If BOTH are checked -> Show BOTH.
          // If BOTH are unchecked -> Show BOTH (default) or NONE? Usually default.

          const showAuto = filters.autoOrders
          const showManual = filters.manualOrders

          if (showAuto || showManual) {
            if (order.isAutoOrder && !showAuto) return false
            if (!order.isAutoOrder && !showManual) return false
          }

          if (filters.calories1200 && order.calories !== 1200) return false
          if (filters.calories1600 && order.calories !== 1600) return false
          if (filters.calories2000 && order.calories !== 2000) return false
          if (filters.calories2500 && order.calories !== 2500) return false
          if (filters.calories3000 && order.calories !== 3000) return false
          if (filters.singleItem && order.quantity !== 1) return false
          if (filters.multiItem && order.quantity === 1) return false
          return true
        })
      }
    }

    const transformedOrders = filteredOrders.map(order => ({
      ...order,
      customerName: order.customer?.name || 'Неизвестный клиент',
      customerPhone: order.customer?.phone || 'Нет телефона',
      customer: { name: order.customer?.name || 'Неизвестный клиент', phone: order.customer?.phone || 'Нет телефона' },
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : new Date(order.createdAt).toISOString().split('T')[0],
      // isAutoOrder is now in DB, no need to hardcode
    }))

    return NextResponse.json(transformedOrders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    if (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'COURIER') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { customerName, customerPhone, deliveryAddress, deliveryTime, quantity, calories, specialFeatures, paymentStatus, paymentMethod, isPrepaid, date, selectedClientId } = body

    if (!customerName || !customerPhone || !deliveryAddress || !calories) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 })
    }

    try {
      let customer
      if (selectedClientId && selectedClientId !== 'manual') {
        customer = await db.customer.findUnique({ where: { id: selectedClientId } })
      } else {
        customer = await db.customer.findUnique({ where: { phone: customerPhone } })
        if (!customer) {
          customer = await db.customer.create({
            data: {
              name: customerName,
              phone: customerPhone,
              address: deliveryAddress,
              preferences: specialFeatures,
              orderPattern: 'daily'
            }
          })
        }
      }

      if (!customer) return NextResponse.json({ error: 'Не удалось найти или создать клиента' }, { status: 400 })

      const admin = await db.admin.findFirst({ where: { role: 'SUPER_ADMIN' } })
      if (!admin) return NextResponse.json({ error: 'Не найден администратор для создания заказа' }, { status: 400 })

      const lastOrder = await db.order.findFirst({ orderBy: { orderNumber: 'desc' } })
      const nextOrderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1

      const newOrder = await db.order.create({
        data: {
          orderNumber: nextOrderNumber,
          customerId: customer.id,
          adminId: admin.id,
          deliveryAddress,
          deliveryDate: date ? new Date(date) : null,
          deliveryTime: deliveryTime || '12:00',
          quantity: quantity || 1,
          calories: parseInt(calories),
          specialFeatures: specialFeatures || '',
          paymentStatus: paymentStatus || 'UNPAID',
          paymentMethod: paymentMethod || 'CASH',
          isPrepaid: isPrepaid || false,
          orderStatus: 'PENDING',
        },
        include: { customer: { select: { name: true, phone: true } } }
      })

      const transformedOrder = {
        ...newOrder,
        customerName: newOrder.customer?.name || customerName,
        customerPhone: newOrder.customer?.phone || customerPhone,
        deliveryDate: date || new Date(newOrder.createdAt).toISOString().split('T')[0],
        isAutoOrder: false
      }

      console.log(`✅ Created manual order: ${transformedOrder.customerName} (#${nextOrderNumber})`)

      return NextResponse.json({ message: 'Заказ успешно создан', order: transformedOrder })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Ошибка базы данных при создании заказа' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
