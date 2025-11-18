import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { hash } from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-please-change'

export async function PATCH(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '')

        if (!token) {
            return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
        }

        let decoded: any
        try {
            decoded = jwt.verify(token, JWT_SECRET)
        } catch (error) {
            return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
        }

        const body = await request.json()
        const { name, email, password } = body

        if (!name || !email) {
            return NextResponse.json({ error: 'Имя и Email обязательны' }, { status: 400 })
        }

        // Check if email is taken by another admin
        const existingAdmin = await db.admin.findFirst({
            where: {
                email,
                NOT: {
                    id: decoded.id
                }
            }
        })

        if (existingAdmin) {
            return NextResponse.json({ error: 'Email уже используется' }, { status: 400 })
        }

        const updateData: any = {
            name,
            email
        }

        if (password) {
            updateData.password = await hash(password, 12)
        }

        const updatedAdmin = await db.admin.update({
            where: { id: decoded.id },
            data: updateData
        })

        // Log action
        await db.actionLog.create({
            data: {
                adminId: decoded.id,
                action: 'UPDATE_PROFILE',
                entityType: 'ADMIN',
                entityId: decoded.id,
                description: `Updated profile for ${updatedAdmin.name}`
            }
        })

        return NextResponse.json({
            message: 'Профиль успешно обновлен',
            user: {
                id: updatedAdmin.id,
                name: updatedAdmin.name,
                email: updatedAdmin.email,
                role: updatedAdmin.role
            }
        })

    } catch (error) {
        console.error('Error updating profile:', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}
