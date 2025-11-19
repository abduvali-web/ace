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

    // Get clients from database with isActive status
    try {
      const dbClients = await db.customer.findMany({
        orderBy: { createdAt: 'desc' }
      })

      // Get global clients for additional data
      const globalClients = (global as any).autoOrderScheduler?.getClients() || []

      // Merge data from database and global storage
      const mergedClients = dbClients.map(dbClient => {
        const globalClient = globalClients.find(gc => gc.phone === dbClient.phone)
        return {
          id: dbClient.id,
          name: dbClient.name,
          phone: dbClient.phone,
          address: dbClient.address,
          calories: globalClient?.calories || 2000,
          specialFeatures: dbClient.preferences || '',
          deliveryDays: globalClient?.deliveryDays || {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false
          },
          autoOrdersEnabled: globalClient?.autoOrdersEnabled !== false,
          isActive: dbClient.isActive,
          createdAt: dbClient.createdAt.toISOString(),
          lastAutoOrderCheck: globalClient?.lastAutoOrderCheck || dbClient.createdAt.toISOString()
        }
      })

      return NextResponse.json(mergedClients)
    } catch (dbError) {
      console.error('Database error, falling back to global storage:', dbError)
      // Fallback to global storage if database fails
      const clients = (global as any).autoOrderScheduler?.getClients() || []
      return NextResponse.json(clients)
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
      isActive
    } = body

    if (!name || !phone || !address || !calories) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // Create new client
    const newClient = {
      id: Date.now().toString(),
      name,
      phone,
      address,
      calories: parseInt(calories),
      specialFeatures: specialFeatures || '',
      deliveryDays: deliveryDays || {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false
      },
      autoOrdersEnabled: autoOrdersEnabled !== undefined ? autoOrdersEnabled : true,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: now,
      lastAutoOrderCheck: now
    }

    // Add client to global server storage (this will also create auto orders)
    const scheduler = (global as any).autoOrderScheduler
    if (scheduler) {
      await scheduler.addClient(newClient)

      // Get updated orders list
      const orders = scheduler.getOrders()

      // Find orders by customer name and phone (more reliable)
      const autoOrders = orders.filter(order =>
        (order.customerName === newClient.name || order.customer?.name === newClient.name) &&
        (order.customerPhone === newClient.phone || order.customer?.phone === newClient.phone)
      )

      return NextResponse.json({
        message: 'Клиент успешно создан',
        client: newClient,
        autoOrdersCreated: autoOrders.length,
        autoOrders: autoOrders
      })
    } else {
      // Fallback if scheduler not available
      return NextResponse.json({
        message: 'Клиент успешно создан',
        client: newClient,
        autoOrdersCreated: 0,
        autoOrders: []
      })
    }

  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}