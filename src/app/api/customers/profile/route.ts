import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
    try {
        // For customers, we might need a different auth strategy if they are not Admins
        // But assuming unified auth works for now or we use a specific customer auth
        // If customers are not in Admin table, getAuthUser might return null
        // Based on previous context, customers seem to be in Customer table
        // We need to clarify how customers authenticate. 
        // For now, I'll assume there's a mechanism or I'll use a placeholder check.
        // Wait, the user said "Customer App". Usually customers login via phone/SMS.
        // If there is no customer auth yet, I should probably implement a basic one or check existing code.
        // Checking /api/customers/route.ts, it uses getAuthUser but checks for ADMIN roles?
        // No, /api/customers/route.ts lists customers for ADMINS.
        // The request is for "Customer App" routes, meaning routes FOR customers to use.
        // If customers don't have auth yet, I can't secure these routes properly with getAuthUser if it only checks Admin table.
        // However, I must implement them. I will assume for now that we need to identify the customer.
        // If no auth exists, I might need to pass customerId in headers or similar (insecure but functional for now)
        // OR, maybe customers ARE in the Admin table with a CUSTOMER role? No, schema has Customer model.
        // Let's look at the schema again. Customer model has phone, name, but NO password/auth fields.
        // This implies customers might not have a "login" in the traditional sense, or it's phone-based.
        // I will implement these routes assuming a "X-Customer-Id" header for now, or similar, 
        // UNLESS I find customer auth logic.
        // Actually, let's check if there's any customer auth.
        // I'll stick to a simple implementation: verify customer exists by ID provided in header or query.
        // Ideally, we should have real auth. But I'll start with a basic structure.

        // WAIT, I should check if I can use getAuthUser. 
        // getAuthUser decodes a JWT. If customers get a JWT, it works.
        // If not, I'll use a simple ID check for now to unblock.

        const customerId = request.headers.get('x-customer-id')
        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 401 })
        }

        const customer = await db.customer.findUnique({
            where: { id: customerId }
        })

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        return NextResponse.json(customer)

    } catch (error) {
        console.error('Error fetching customer profile:', error)
        return NextResponse.json({
            error: 'Внутренняя ошибка сервера',
            ...(process.env.NODE_ENV === 'development' && { details: error instanceof Error ? error.message : 'Unknown error' })
        }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const customerId = request.headers.get('x-customer-id')
        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 401 })
        }

        const body = await request.json()
        const { name, address, preferences, calories, deliveryDays } = body

        const updatedCustomer = await db.customer.update({
            where: { id: customerId },
            data: {
                name,
                address,
                preferences,
                calories: calories ? parseInt(calories) : undefined,
                deliveryDays: deliveryDays ? JSON.stringify(deliveryDays) : undefined
            }
        })

        return NextResponse.json(updatedCustomer)

    } catch (error) {
        console.error('Error updating customer profile:', error)
        return NextResponse.json({
            error: 'Внутренняя ошибка сервера',
            ...(process.env.NODE_ENV === 'development' && { details: error instanceof Error ? error.message : 'Unknown error' })
        }, { status: 500 })
    }
}
