import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-please-change'

export async function PATCH(
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

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Неверный формат данных' }, { status: 400 })
    }

    // Check if admin exists
    const adminToUpdate = await db.admin.findUnique({
      where: { id: adminId2 }
    })

    if (!adminToUpdate) {
      return NextResponse.json({ error: 'Администратор не найден' }, { status: 404 })
    }

    // Prevent deactivating yourself
    if (adminId === adminId2 && !isActive) {
      return NextResponse.json({ error: 'Нельзя деактивировать самого себя' }, { status: 400 })
    }

    // Update admin status
    const updatedAdmin = await db.admin.update({
      where: { id: adminId2 },
      data: { isActive }
    })

    // Log action
    await db.actionLog.create({
      data: {
        adminId: adminId,
        action: isActive ? 'ACTIVATE_ADMIN' : 'DEACTIVATE_ADMIN',
        entityType: 'ADMIN',
        entityId: adminId2,
        description: `${isActive ? 'Activated' : 'Deactivated'} admin ${updatedAdmin.name}`
      }
    })

    return NextResponse.json({
      message: `Статус администратора успешно ${isActive ? 'активирован' : 'приостановлен'}`,
      admin: updatedAdmin
    })

  } catch (error) {
    console.error('Error toggling admin status:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}