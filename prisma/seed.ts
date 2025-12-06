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

  // Standard password for all test users
  const password = await hash('Test123!@#', 12)

  // Create Super Admin
  const superAdmin = await prisma.admin.upsert({
    where: { email: 'super@admin.com' },
    update: {
      password,
      hasPassword: true,
    },
    create: {
      email: 'super@admin.com',
      name: 'Super Admin',
      password,
      hasPassword: true,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })
  console.log(`👤 Created Super Admin: ${superAdmin.email}`)

  // Create Middle Admin
  const middleAdmin = await prisma.admin.upsert({
    where: { email: 'middle@admin.com' },
    update: {
      password,
      hasPassword: true,
    },
    create: {
      email: 'middle@admin.com',
      name: 'Middle Admin',
      password,
      hasPassword: true,
      role: 'MIDDLE_ADMIN',
      isActive: true,
      createdBy: superAdmin.id,
    },
  })
  console.log(`👤 Created Middle Admin: ${middleAdmin.email}`)

  // Create Low Admin
  const lowAdmin = await prisma.admin.upsert({
    where: { email: 'low@admin.com' },
    update: {
      password,
      hasPassword: true,
    },
    create: {
      email: 'low@admin.com',
      name: 'Low Admin',
      password,
      hasPassword: true,
      role: 'LOW_ADMIN',
      isActive: true,
      createdBy: middleAdmin.id,
    },
  })
  console.log(`👤 Created Low Admin: ${lowAdmin.email}`)

  // Create Test Courier
  const courier = await prisma.admin.upsert({
    where: { email: 'courier@test.com' },
    update: {
      password,
      hasPassword: true,
    },
    create: {
      email: 'courier@test.com',
      name: 'Test Courier',
      password,
      hasPassword: true,
      role: 'COURIER',
      phone: '+998 99 999 99 99',
      isActive: true,
      createdBy: middleAdmin.id,
    },
  })
  console.log(`🚗 Created Courier: ${courier.email}`)

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
        isActive: client.isActive,
        createdBy: middleAdmin.id,
      }
    })
    console.log(`👥 Created client: ${createdClient.name}`)
  }

  console.log('✅ Seeding finished.')
  console.log('')
  console.log('📋 Test Credentials:')
  console.log('-------------------')
  console.log('Super Admin: super@admin.com / Test123!@#')
  console.log('Middle Admin: middle@admin.com / Test123!@#')
  console.log('Low Admin: low@admin.com / Test123!@#')
  console.log('Courier: courier@test.com / Test123!@#')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
