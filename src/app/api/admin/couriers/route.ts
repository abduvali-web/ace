import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getAuthUser, hasRole } from '@/lib/auth-utils'
import { passwordSchema, emailSchema } from '@/lib/validations'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !hasRole(user, ['MIDDLE_ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const courierData = await request.json()

    // Validate email
    try {
      emailSchema.parse(courierData.email)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
      }
    }

    // Validate password
    try {
      passwordSchema.parse(courierData.password)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
      }
    }

    // Check if email already exists
    const existingAdmin = await db.admin.findUnique({
      where: { email: courierData.email }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Администратор с таким email уже существует' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(courierData.password, 10)

    // Create courier
    const newCourier = await db.admin.create({
      data: {
        name: courierData.name,
        email: courierData.email,
        password: hashedPassword,
        role: 'COURIER',
        isActive: true,
        createdBy: user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    // Log the action
    await db.actionLog.create({
      data: {
        adminId: user.id,
        action: 'CREATE_COURIER',
        entityType: 'ADMIN',
        entityId: newCourier.id,
        description: `Created courier account: ${newCourier.name} (${newCourier.email})`
      }
    })

    return NextResponse.json(newCourier)
  } catch (error) {
    console.error('Error creating courier:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Курьер с таким email уже существует' }, { status: 409 })
      }
    }

    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        ...(process.env.NODE_ENV === 'development' && { details: error instanceof Error ? error.message : 'Unknown error' })
      },
      { status: 500 }
    )
  }
}