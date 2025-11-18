import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

const clients = [
  {
    id: '1',
    name: 'Иван Петров',
    phone: '+7 (999) 123-45-67',
    address: 'ул. Ленина, д. 1, кв. 1',
    calories: 2000,
    specialFeatures: 'Без лука',
    deliveryDays: {
      monday: true,
      tuesday: false,
      wednesday: true,
      thursday: false,
      friday: true,
      saturday: false,
      sunday: false
    },
    autoOrdersEnabled: true,
    isActive: true
  },
  {
    id: '2',
    name: 'Мария Иванова',
    phone: '+7 (999) 987-65-43',
    address: 'ул. Советская, д. 5, кв. 12',
    calories: 1600,
    specialFeatures: 'Двойная порции курицы',
    deliveryDays: {
      monday: false,
      tuesday: true,
      wednesday: false,
      thursday: true,
      friday: false,
      saturday: true,
      sunday: false
    },
    autoOrdersEnabled: true,
    isActive: true
  },
  {
    id: '3',
    name: 'Сергей Смирнов',
    phone: '+7 (999) 555-12-34',
    address: 'ул. Цветочная, д. 8, кв. 5',
    calories: 1800,
    specialFeatures: 'Экстра сыр',
    deliveryDays: {
      monday: true,
      tuesday: true,
      wednesday: false,
      thursday: false,
      friday: true,
      saturday: true,
      sunday: false
    },
    autoOrdersEnabled: true,
    isActive: true
  }
]

async function main() {
  console.log('🌱 Starting seeding...')

  // Create Super Admin
  const password = await hash('admin123', 12)
  const admin = await prisma.admin.upsert({
    where: { email: 'super@admin.com' },
    update: {},
    create: {
      email: 'super@admin.com',
      name: 'Супер Администратор',
      password,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })
  console.log(`👤 Created admin: ${admin.email}`)

  // Create Clients
  for (const client of clients) {
    const createdClient = await prisma.customer.upsert({
      where: { phone: client.phone },
      update: {},
      create: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        address: client.address,
        preferences: client.specialFeatures,
        orderPattern: 'daily',
        isActive: client.isActive
      }
    })
    console.log(`👥 Created client: ${createdClient.name}`)
  }

  console.log('✅ Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
