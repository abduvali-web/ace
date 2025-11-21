import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

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

// PATCH - Update admin
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = verifyToken(request)
        if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
        }

        const { id } = params
        const data = await request.json()

        // Verify target admin exists and user has permission to edit them
        const targetAdmin = await db.admin.findUnique({
            where: { id }
        })

        if (!targetAdmin) {
            return NextResponse.json({ error: 'Администратор не найден' }, { status: 404 })
        }

        // Middle admin can only edit admins they created
        if (user.role === 'MIDDLE_ADMIN' && targetAdmin.createdBy !== user.id) {
            return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
        }

        const updateData: any = {}

        if (data.name) updateData.name = data.name
        if (data.email) updateData.email = data.email
        if (data.role) updateData.role = data.role
        if (data.isActive !== undefined) updateData.isActive = data.isActive
        if (data.allowedTabs) updateData.allowedTabs = JSON.stringify(data.allowedTabs)

        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10)
            updateData.hasPassword = true
        }

        const updatedAdmin = await db.admin.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                allowedTabs: true,
                createdAt: true
            }
        })

        // Log action
        await db.actionLog.create({
            data: {
                adminId: user.id,
                action: 'UPDATE_ADMIN',
                entityType: 'ADMIN',
                entityId: id,
                description: `Updated admin ${updatedAdmin.name}`
            }
        })

        return NextResponse.json({
            ...updatedAdmin,
            allowedTabs: updatedAdmin.allowedTabs ? JSON.parse(updatedAdmin.allowedTabs) : []
        })

    } catch (error) {
        console.error('Error updating admin:', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}

// DELETE - Delete admin
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = verifyToken(request)
        if (!user || (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
        }

        const { id } = params

        // Verify target admin exists and user has permission to delete them
        const targetAdmin = await db.admin.findUnique({
            where: { id }
        })

        if (!targetAdmin) {
            return NextResponse.json({ error: 'Администратор не найден' }, { status: 404 })
        }

        // Middle admin can only delete admins they created
        if (user.role === 'MIDDLE_ADMIN' && targetAdmin.createdBy !== user.id) {
            return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
        }

        await db.admin.delete({
            where: { id }
        })

        // Log action
        await db.actionLog.create({
            data: {
                adminId: user.id,
                action: 'DELETE_ADMIN',
                entityType: 'ADMIN',
                entityId: id,
                description: `Deleted admin ${targetAdmin.name}`
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting admin:', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}
