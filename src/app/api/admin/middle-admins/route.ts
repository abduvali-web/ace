import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { hash } from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-please-change'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
      if (decoded.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    // Get middle admins from DB
    const middleAdmins = await db.admin.findMany({
      where: {
        role: 'MIDDLE_ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(middleAdmins)
  } catch (error) {
    console.error('Error fetching middle admins:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
      if (decoded.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 })
    }

    // Check if admin already exists
    const existingAdmin = await db.admin.findUnique({
      where: { email }
    })

    if (existingAdmin) {
      return NextResponse.json({ error: 'Администратор с таким email уже существует' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create new middle admin
    const newAdmin = await db.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'MIDDLE_ADMIN',
        isActive: true,
        createdBy: decoded.id
      }
    })

    // Log action
    await db.actionLog.create({
      data: {
        adminId: decoded.id,
        action: 'CREATE_ADMIN',
        entityType: 'ADMIN',
        entityId: newAdmin.id,
        description: `Created middle admin ${newAdmin.name} (${newAdmin.email})`
      }
    })

    return NextResponse.json({
      id: newAdmin.id,
      email: newAdmin.email,
      name: newAdmin.name,
      role: newAdmin.role,
      isActive: newAdmin.isActive,
      createdAt: newAdmin.createdAt
    })
  } catch (error) {
    console.error('Error creating middle admin:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}