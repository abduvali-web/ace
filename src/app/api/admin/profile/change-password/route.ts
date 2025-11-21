import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { adminId: string }

        const body = await request.json()
        const { currentPassword, newPassword } = body

        // Validate input
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Current password and new password are required' },
                { status: 400 }
            )
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'New password must be at least 8 characters long' },
                { status: 400 }
            )
        }

        // Get admin
        const admin = await db.admin.findUnique({
            where: { id: decoded.adminId }
        })

        if (!admin) {
            return NextResponse.json(
                { error: 'Admin not found' },
                { status: 404 }
            )
        }

        // Check if admin has a password (not OAuth-only user)
        if (!admin.password) {
            return NextResponse.json(
                { error: 'Cannot change password for OAuth-only accounts' },
                { status: 400 }
            )
        }

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, admin.password)
        if (!passwordMatch) {
            return NextResponse.json(
                { error: 'Current password is incorrect' },
                { status: 401 }
            )
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update password
        await db.admin.update({
            where: { id: decoded.adminId },
            data: { password: hashedPassword }
        })

        // Log the action
        await db.actionLog.create({
            data: {
                adminId: decoded.adminId,
                action: 'PASSWORD_CHANGED',
                entityType: 'ADMIN',
                entityId: decoded.adminId,
                description: `Password changed for ${admin.email}`
            }
        })

        return NextResponse.json(
            { success: true, message: 'Password changed successfully' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Change password error:', error)
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            )
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
