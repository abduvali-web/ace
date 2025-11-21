import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, hasRole } from '@/lib/auth-utils'
import bcrypt from 'bcryptjs'
import { passwordSchema } from '@/lib/validations'
import { z } from 'zod'

export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user || !hasRole(user, ['COURIER'])) {
            return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
        }

        const body = await request.json()
        const { currentPassword, newPassword } = body

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 })
        }

        // Validate new password
        try {
            passwordSchema.parse(newPassword)
        } catch (error) {
            if (error instanceof z.ZodError) {
                return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
            }
        }

        // Get current admin data to check password
        const admin = await db.admin.findUnique({
            where: { id: user.id }
        })

        if (!admin || !admin.password) {
            return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, admin.password)
        if (!isValid) {
            return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 400 })
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update password
        await db.admin.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                hasPassword: true
            }
        })

        // Log action
        await db.actionLog.create({
            data: {
                adminId: user.id,
                action: 'CHANGE_PASSWORD',
                entityType: 'ADMIN',
                entityId: user.id,
                description: 'Courier changed their own password'
            }
        })

        return NextResponse.json({ message: 'Пароль успешно изменен' })

    } catch (error) {
        console.error('Error changing password:', error)
        return NextResponse.json({
            error: 'Внутренняя ошибка сервера',
            ...(process.env.NODE_ENV === 'development' && { details: error instanceof Error ? error.message : 'Unknown error' })
        }, { status: 500 })
    }
}
