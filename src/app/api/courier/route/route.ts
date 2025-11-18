import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment')
}

function verifyRequestToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  try { return jwt.verify(token, JWT_SECRET) as any } catch { return null }
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyRequestToken(request)
    if (!user || user.role !== 'COURIER') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    if (!orderId) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { customer: { select: { name: true, phone: true } } }
    })

    if (!order) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 })

    const startAddress = 'ул. Центральная, д. 1, г. Москва'
    const endAddress = order.deliveryAddress
    const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startAddress)}&destination=${encodeURIComponent(endAddress)}&travelmode=driving`

    return NextResponse.json({ routeUrl, startAddress, endAddress, orderNumber: order.orderNumber, customerName: order.customer?.name })
  } catch (error) {
    console.error('Error generating route:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
