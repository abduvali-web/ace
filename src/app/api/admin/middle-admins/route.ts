import { NextRequest, NextResponse } from 'next/server'

// Simple mock token verification
function verifyToken(token: string) {
  try {
    if (token && token.length > 10) {
      return {
        id: '1',
        email: 'super@admin.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN'
      }
    }
    return null
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    const user = verifyToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }
    
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    // Get middle admins from global storage
    const admins = (global as any).admins || []
    const middleAdmins = admins.filter((admin: any) => admin.role === 'MIDDLE_ADMIN')

    return NextResponse.json(middleAdmins)
  } catch (error) {
    console.error('Error fetching middle admins:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    const user = verifyToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }
    
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 })
    }

    // Get admins from global storage
    const admins = (global as any).admins || []
    
    // Check if admin already exists
    const existingAdmin = admins.find((admin: any) => admin.email === email)
    if (existingAdmin) {
      return NextResponse.json({ error: 'Администратор с таким email уже существует' }, { status: 400 })
    }

    // Create new middle admin
    const newAdmin = {
      id: Date.now().toString(),
      email,
      password: password, // In a real app, this would be hashed
      name,
      role: 'MIDDLE_ADMIN',
      isActive: true,
      createdBy: user.id,
      createdAt: new Date().toISOString()
    }

    // Add to global storage
    admins.push(newAdmin)
    ;(global as any).admins = admins

    return NextResponse.json({
      id: newAdmin.id,
      email: newAdmin.email,
      name: newAdmin.name,
      role: newAdmin.role,
      isActive: newAdmin.isActive,
      createdAt: newAdmin.createdAt
    })
  } catch (error) {
    console.error('Error creating middle admin:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}