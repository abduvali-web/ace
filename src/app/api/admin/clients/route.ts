import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, hasRole } from '@/lib/auth-utils'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !hasRole(user, ['MIDDLE_ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    // Get clients from database with isActive status, excluding deleted ones
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
      calories: dbClient.calories || 2000,
      specialFeatures: dbClient.preferences || '',
      deliveryDays: dbClient.deliveryDays ? JSON.parse(dbClient.deliveryDays) : {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false
      },
      autoOrdersEnabled: dbClient.autoOrdersEnabled,
      isActive: dbClient.isActive,
      createdAt: dbClient.createdAt.toISOString(),
      latitude: dbClient.latitude,
      longitude: dbClient.longitude,
      defaultCourierId: dbClient.defaultCourierId,
      defaultCourierName: dbClient.defaultCourier?.name
    }))

    return NextResponse.json(clients)

  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({
      error: 'Внутренняя ошибка сервера',
      ...(process.env.NODE_ENV === 'development' && { details: error instanceof Error ? error.message : 'Unknown error' })
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !hasRole(user, ['MIDDLE_ADMIN', 'SUPER_ADMIN'])) {
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
      latitude,
      longitude,
      defaultCourierId
    } = body

    // Basic validation
    if (!name || !phone || !address) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 })
    }

    if (phone.length < 10 || phone.length > 15) {
      return NextResponse.json({ error: 'Неверный формат номера телефона' }, { status: 400 })
    }

    // Save client to database
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
        isActive: true,
        latitude,
        longitude,
        defaultCourierId: defaultCourierId || null
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
      calories: dbClient.calories || 2000,
      specialFeatures: dbClient.preferences || '',
      deliveryDays: dbClient.deliveryDays ? JSON.parse(dbClient.deliveryDays) : {},
      autoOrdersEnabled: dbClient.autoOrdersEnabled,
      isActive: dbClient.isActive,
      createdAt: dbClient.createdAt.toISOString(),
      latitude: dbClient.latitude,
      longitude: dbClient.longitude,
      defaultCourierId: dbClient.defaultCourierId,
      defaultCourierName: dbClient.defaultCourier?.name
    }

    return NextResponse.json({
      message: 'Клиент успешно создан',
      client: newClient
    })

  } catch (error) {
    console.error('Error creating client:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({
          error: 'Клиент с таким номером телефона уже существует'
        }, { status: 409 })
      }
    }

    return NextResponse.json({
      error: 'Внутренняя ошибка сервера',
      ...(process.env.NODE_ENV === 'development' && { details: error instanceof Error ? error.message : 'Unknown error' })
    }, { status: 500 })
  }
}