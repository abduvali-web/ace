import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-please-change'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    let user: any
    try {
      user = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    if (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    // Get clients from database with isActive status, excluding deleted ones
    try {
      const dbClients = await db.customer.findMany({
        where: {
          deletedAt: null
        },
        include: {
          defaultCourier: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Return clients with all data from database
      const clients = dbClients.map(dbClient => ({
        id: dbClient.id,
        name: dbClient.name,
        phone: dbClient.phone,
        address: dbClient.address,
        calories: (dbClient as any).calories || 2000,
        specialFeatures: dbClient.preferences || '',
        deliveryDays: (dbClient as any).deliveryDays ? JSON.parse((dbClient as any).deliveryDays) : {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false
        },
        autoOrdersEnabled: (dbClient as any).autoOrdersEnabled !== undefined ? (dbClient as any).autoOrdersEnabled : true,
        isActive: dbClient.isActive,
        createdAt: dbClient.createdAt.toISOString(),
        latitude: dbClient.latitude,
        longitude: dbClient.longitude,
        defaultCourierId: (dbClient as any).defaultCourierId,
        defaultCourierName: (dbClient as any).defaultCourier?.name
      }))

      return NextResponse.json(clients)
    } catch (dbError) {
      console.error('Database error fetching clients:', dbError)
      return NextResponse.json({ error: 'Ошибка получения данных из базы' }, { status: 500 })
    }

  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    let user: any
    try {
      user = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    if (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      phone,
      address,
      calories,
      specialFeatures,
      deliveryDays,
      autoOrdersEnabled,
      isActive,
      latitude,
      longitude
    } = body

    if (!name || !phone || !address || !calories) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 })
    }

    // Save client to database
    try {
      const dbClient = await db.customer.create({
        data: {
          name,
          phone,
          address,
          preferences: specialFeatures || '',
          orderPattern: JSON.stringify(deliveryDays || {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false
          }),
          calories: parseInt(calories) || 2000,
          deliveryDays: JSON.stringify(deliveryDays || {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false
          }),
          autoOrdersEnabled: autoOrdersEnabled !== undefined ? autoOrdersEnabled : true,
          isActive: isActive !== undefined ? isActive : true,
          latitude,
          longitude,
          defaultCourierId: body.defaultCourierId || null
        },
        include: {
          defaultCourier: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Return created client
      const newClient = {
        id: dbClient.id,
        name: dbClient.name,
        phone: dbClient.phone,
        address: dbClient.address,
        calories: (dbClient as any).calories || 2000,
        specialFeatures: dbClient.preferences || '',
        deliveryDays: (dbClient as any).deliveryDays ? JSON.parse((dbClient as any).deliveryDays) : {},
        autoOrdersEnabled: (dbClient as any).autoOrdersEnabled !== undefined ? (dbClient as any).autoOrdersEnabled : true,
        isActive: dbClient.isActive,
        createdAt: dbClient.createdAt.toISOString(),
        latitude: dbClient.latitude,
        longitude: dbClient.longitude,
        defaultCourierId: (dbClient as any).defaultCourierId,
        defaultCourierName: (dbClient as any).defaultCourier?.name
      }

      return NextResponse.json({
        message: 'Клиент успешно создан',
        client: newClient
      })
    } catch (dbError: any) {
      console.error('Database error creating client:', dbError)

      if (dbError.code === 'P2002') {
        return NextResponse.json({
          error: 'Клиент с таким номером телефона уже существует'
        }, { status: 409 })
      }

      return NextResponse.json({
        error: 'Ошибка сохранения клиента в базу данных',
        details: dbError.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}