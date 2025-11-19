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

        // Get deleted clients (where deletedAt is not null)
        const deletedClients = await db.customer.findMany({
            where: {
                deletedAt: {
                    not: null
                }
            },
            orderBy: { deletedAt: 'desc' }
        })

        // Transform to include necessary info
        const binClients = deletedClients.map(client => ({
            id: client.id,
            name: client.name,
            phone: client.phone,
            address: client.address,
            isActive: client.isActive,
            deletedAt: client.deletedAt?.toISOString(),
            deletedBy: client.deletedBy,
            createdAt: client.createdAt.toISOString()
        }))

        return NextResponse.json(binClients)

    } catch (error) {
        console.error('Error fetching bin:', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}
