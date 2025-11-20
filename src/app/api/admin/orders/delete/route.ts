import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

async function verifyToken(token: string) {
  try {
    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any

    // Get user from database
    const user = await db.admin.findUnique({
      where: { id: decoded.id }
    })

    if (!user || !user.isActive) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = await verifyToken(token || '')

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'MIDDLE_ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { orderIds } = await request.json()

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Order IDs are required' }, { status: 400 })
    }

    // Soft delete orders (set deletedAt timestamp)
    const updateResult = await db.order.updateMany({
      where: {
        id: {
          in: orderIds
        }
      },
      data: {
        deletedAt: new Date()
      }
    })

    const deletedCount = updateResult.count

    console.log(`Soft deleted ${deletedCount} orders by ${user.role} ${user.name}`)

    return NextResponse.json({
      message: 'Orders moved to bin successfully',
      deletedCount
    })

  } catch (error) {
    console.error('Delete orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}