import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-please-change'

export async function DELETE(
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

    // Check if admin exists
    const adminToDelete = await db.admin.findUnique({
      where: { id: adminId2 }
    })

    if (!adminToDelete) {
      return NextResponse.json({ error: 'Администратор не найден' }, { status: 404 })
    }

    // Prevent deleting yourself
    if (adminId === adminId2) {
      return NextResponse.json({ error: 'Нельзя удалить самого себя' }, { status: 400 })
    }

    // Delete admin
    await db.admin.delete({
      where: { id: adminId2 }
    })

    // Log action
    await db.actionLog.create({
      data: {
        adminId: adminId,
        action: 'DELETE_ADMIN',
        entityType: 'ADMIN',
        entityId: adminId2,
        description: `Deleted admin ${adminToDelete.name} (${adminToDelete.email})`
      }
    })

    return NextResponse.json({
      message: 'Администратор успешно удален',
      admin: adminToDelete
    })

  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}