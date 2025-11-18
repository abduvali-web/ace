import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-please-change'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string; adminId2: string }> }
) {
  try {
    const { adminId, adminId2 } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      if (decoded.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    const admin = await db.admin.findUnique({
      where: { id: adminId2 }
    })

    if (!admin) {
      return NextResponse.json({ error: 'Администратор не найден' }, { status: 404 })
    }

    // In a real app, we cannot return the password. 
    // We will return a placeholder or handle a reset action if that was the intent.
    // For now, we'll return a message indicating this limitation or the default if it matches.

    return NextResponse.json({
      password: 'Hidden (Reset to view)'
    })

  } catch (error) {
    console.error('Error getting admin password:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}