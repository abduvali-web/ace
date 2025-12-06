import { POST as loginHandler } from '@/app/api/customers/auth/login/route'
import { GET as profileHandler } from '@/app/api/customers/profile/route'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/customer-auth'
import { NextRequest } from 'next/server'

async function verifyCustomerAuth() {
    console.log('🔐 Verifying Customer Authentication...')

    // 1. Create Test Customer
    const phone = '+998901234567'
    const password = 'TestPassword123!'
    const hashedPassword = await hashPassword(password)

    console.log('1. Creating test customer...')
    const customer = await db.customer.upsert({
        where: { phone },
        update: { password: hashedPassword },
        create: {
            name: 'Test Customer',
            phone,
            address: 'Test Address',
            password: hashedPassword,
            isActive: true
        }
    })
    console.log('✅ Test customer created/updated')

    // 2. Test Login
    console.log('2. Testing Login...')
    const loginReq = new NextRequest('http://localhost/api/customers/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password })
    })

    const loginRes = await loginHandler(loginReq)
    const loginData = await loginRes.json()

    if (loginRes.status !== 200 || !loginData.token) {
        console.error('❌ Login failed:', loginData)
        process.exit(1)
    }
    console.log('✅ Login successful, token received')
    const token = loginData.token

    // 3. Test Profile Access (Secure)
    console.log('3. Testing Secured Profile Access...')
    const profileReq = new NextRequest('http://localhost/api/customers/profile', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    const profileRes = await profileHandler(profileReq)
    const profileData = await profileRes.json()

    if (profileRes.status !== 200 || profileData.id !== customer.id) {
        console.error('❌ Profile access failed:', profileData)
        process.exit(1)
    }
    console.log('✅ Profile access successful')

    // 4. Test Unauthorized Access
    console.log('4. Testing Unauthorized Access...')
    const badReq = new NextRequest('http://localhost/api/customers/profile', {
        headers: {
            'Authorization': 'Bearer invalid_token'
        }
    })
    const badRes = await profileHandler(badReq)

    if (badRes.status !== 401) { // 401 Unauthorized (or 500 if token invalid throws, but verifyCustomerToken returns null)
        // verifyCustomerToken returns null, so getCustomerFromRequest returns null -> 401
        console.error('❌ Unauthorized access check failed (expected 401):', badRes.status)
        process.exit(1)
    }
    console.log('✅ Unauthorized access blocked')

    console.log('🎉 All Customer Auth tests passed!')
}

verifyCustomerAuth()
    .catch(console.error)
    .finally(() => db.$disconnect())
