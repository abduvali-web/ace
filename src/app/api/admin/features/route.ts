import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    // Verify token and check if user is MIDDLE_ADMIN or SUPER_ADMIN
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    const user = await userResponse.json()
    
    if (user.role !== 'MIDDLE_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, type, options } = body

    if (!name || !description || !type) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 })
    }

    if (type === 'SELECT' && !options) {
      return NextResponse.json({ error: 'Для типа "Выбор из списка" необходимо указать варианты' }, { status: 400 })
    }

    // Here you would save the feature to database
    // For now, we'll just return success response
    console.log('Creating feature:', { name, description, type, options })

    return NextResponse.json({ 
      message: 'Особенность успешно создана',
      feature: {
        id: Date.now().toString(),
        name,
        description,
        type,
        options: type === 'SELECT' ? options.split(',').map((opt: string) => opt.trim()) : null
      }
    })

  } catch (error) {
    console.error('Error creating feature:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}