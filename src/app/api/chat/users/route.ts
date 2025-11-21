import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-please-change'

function verifyToken(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null
    const token = authHeader.substring(7)
    try {
        return jwt.verify(token, JWT_SECRET) as any
    } catch {
        return null
    }
}

// GET - Get list of users current user can chat with based on role
export async function GET(request: NextRequest) {
    try {
        const user = verifyToken(request)
        if (!user) {
            return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
        }

        const currentUser = await db.admin.findUnique({
            where: { id: user.id }
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        let availableUsers: any[] = []

        if (currentUser.role === 'SUPER_ADMIN') {
            // Super admin can chat with all middle admins, couriers, and low admins
            availableUsers = await db.admin.findMany({
                where: {
                    id: {
                        not: user.id
                    },
                    isActive: true,
                    role: {
                        in: ['MIDDLE_ADMIN', 'COURIER', 'LOW_ADMIN']
                    }
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                },
                orderBy: {
                    name: 'asc'
                }
            })
        } else if (currentUser.role === 'MIDDLE_ADMIN') {
            // Middle admin can chat with couriers and low admins they created
            availableUsers = await db.admin.findMany({
                where: {
                    id: {
                        not: user.id
                    },
                    isActive: true,
                    createdById: user.id,
                    role: {
                        in: ['COURIER', 'LOW_ADMIN']
                    }
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                },
                orderBy: {
                    name: 'asc'
                }
            })
        } else if (currentUser.role === 'COURIER' || currentUser.role === 'LOW_ADMIN') {
            // Couriers/Low admins can chat with:
            // 1. Their creator middle admin
            // 2. Other couriers/low admins created by the same middle admin

            const creatorId = currentUser.createdById

            if (creatorId) {
                // Get creator
                const creator = await db.admin.findUnique({
                    where: { id: creatorId },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                })

                if (creator) {
                    availableUsers.push(creator)
                }

                // Get peers (other users created by same admin)
                const peers = await db.admin.findMany({
                    where: {
                        id: {
                            not: user.id
                        },
                        isActive: true,
                        createdById: creatorId,
                        role: {
                            in: ['COURIER', 'LOW_ADMIN']
                        }
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    },
                    orderBy: {
                        name: 'asc'
                    }
                })

                availableUsers = [...availableUsers, ...peers]
            }
        }

        return NextResponse.json({ users: availableUsers })

    } catch (error) {
        console.error('Error fetching  available users:', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}
