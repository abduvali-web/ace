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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyRequestToken(request)
    if (!user) return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    if (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const clientId = params.id

    const client = await db.customer.findUnique({ where: { id: clientId } })
    if (!client) return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })

    await db.order.deleteMany({ where: { customerId: clientId } })
    await db.customer.delete({ where: { id: clientId } })

    return NextResponse.json({ message: 'Клиент успешно удален', client })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
