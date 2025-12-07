'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Clock, Utensils, Truck, Phone, Flame, Calendar, Gift, MessageCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ClientChat } from '@/components/ClientChat'

interface DailyMenuItem {
    id: string
    name: string
    description: string
    calories: number
    image?: string
}

interface OrderInfo {
    id: string
    status: 'PENDING' | 'PREPARING' | 'ON_THE_WAY' | 'DELIVERED'
    estimatedDelivery?: string
    items: { name: string; calories: number; quantity: number }[]
}

interface CustomerPlan {
    name: string
    startDate: string
    endDate: string
    dailyCalories: number
}

export default function ClientDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { t } = useLanguage()

    const [todayMenu, setTodayMenu] = useState<DailyMenuItem[]>([])
    const [currentOrder, setCurrentOrder] = useState<OrderInfo | null>(null)
    const [customerPlan, setCustomerPlan] = useState<CustomerPlan | null>(null)
    const [consumedCalories, setConsumedCalories] = useState(0)
    const [showDiscountPopup, setShowDiscountPopup] = useState(false)
    const [discountCountdown, setDiscountCountdown] = useState(0)
    const [planExpiryCountdown, setPlanExpiryCountdown] = useState('')
    const [customerCreatedAt, setCustomerCreatedAt] = useState<Date | null>(null)
    const [isChatOpen, setIsChatOpen] = useState(false)


    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    // Fetch customer data, plan, menu, and order
    useEffect(() => {
        if (session?.user?.id) {
            fetchCustomerData()
            fetchTodayMenu()
            fetchCurrentOrder()
        }
    }, [session])

    // Plan Expiry Timer
    useEffect(() => {
        if (!customerPlan) return

        const interval = setInterval(() => {
            const now = new Date()
            const endDate = new Date(customerPlan.endDate)
            const diff = endDate.getTime() - now.getTime()

            if (diff <= 0) {
                setPlanExpiryCountdown('Expired')
                return
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setPlanExpiryCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`)
        }, 1000)

        return () => clearInterval(interval)
    }, [customerPlan])

    // 30-Day Discount Logic
    useEffect(() => {
        if (!customerCreatedAt) return

        const now = new Date()
        const thirtyDaysAfterCreation = new Date(customerCreatedAt)
        thirtyDaysAfterCreation.setDate(thirtyDaysAfterCreation.getDate() + 30)

        const sixtyDaysAfterCreation = new Date(customerCreatedAt)
        sixtyDaysAfterCreation.setDate(sixtyDaysAfterCreation.getDate() + 60)

        // Show popup if between 30-60 days after creation
        if (now >= thirtyDaysAfterCreation && now < sixtyDaysAfterCreation) {
            setShowDiscountPopup(true)
            // Calculate countdown to expiry (60 days)
            const remainingMs = sixtyDaysAfterCreation.getTime() - now.getTime()
            setDiscountCountdown(Math.floor(remainingMs / 1000))
        }
    }, [customerCreatedAt])

    // Discount Countdown Timer
    useEffect(() => {
        if (discountCountdown <= 0) return

        const interval = setInterval(() => {
            setDiscountCountdown(prev => {
                if (prev <= 1) {
                    setShowDiscountPopup(false)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [discountCountdown])

    const fetchCustomerData = async () => {
        try {
            const res = await fetch('/api/client/profile')
            if (res.ok) {
                const data = await res.json()
                setCustomerPlan(data.plan)
                setCustomerCreatedAt(new Date(data.createdAt))
                setConsumedCalories(data.consumedCalories || 0)
            }
        } catch (error) {
            console.error('Failed to fetch customer data:', error)
        }
    }

    const fetchTodayMenu = async () => {
        try {
            const res = await fetch('/api/client/daily-menu')
            if (res.ok) {
                const data = await res.json()
                setTodayMenu(data.items || [])
            }
        } catch (error) {
            console.error('Failed to fetch today menu:', error)
        }
    }

    const fetchCurrentOrder = async () => {
        try {
            const res = await fetch('/api/client/current-order')
            if (res.ok) {
                const data = await res.json()
                setCurrentOrder(data.order)
            }
        } catch (error) {
            console.error('Failed to fetch current order:', error)
        }
    }

    const formatDiscountCountdown = () => {
        const days = Math.floor(discountCountdown / (60 * 60 * 24))
        const hours = Math.floor((discountCountdown % (60 * 60 * 24)) / (60 * 60))
        const minutes = Math.floor((discountCountdown % (60 * 60)) / 60)
        const seconds = discountCountdown % 60
        return `${days}d ${hours}h ${minutes}m ${seconds}s`
    }

    const getOrderStatusLabel = (status: OrderInfo['status']) => {
        const labels: Record<OrderInfo['status'], { label: string; color: string }> = {
            PENDING: { label: 'Kutilmoqda', color: 'bg-yellow-500' },
            PREPARING: { label: 'Oshxonada', color: 'bg-blue-500' },
            ON_THE_WAY: { label: 'Yetkazilmoqda', color: 'bg-purple-500' },
            DELIVERED: { label: 'Yetkazildi', color: 'bg-green-500' }
        }
        return labels[status]
    }

    // Calculate remaining calories
    const remainingCalories = customerPlan
        ? customerPlan.dailyCalories - consumedCalories
        : 0
    const calorieProgress = customerPlan
        ? (consumedCalories / customerPlan.dailyCalories) * 100
        : 0

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">{t.common.loading}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
            {/* 50% Discount Popup */}
            {showDiscountPopup && (
                <div className="fixed bottom-4 right-4 z-50 animate-bounce">
                    <Card className="border-2 border-green-500 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl max-w-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2">
                                <Gift className="w-6 h-6" />
                                50% Chegirma!
                            </CardTitle>
                            <CardDescription className="text-green-100">
                                Maxsus taklif - cheklangan vaqt!
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm mb-3">Qolgan vaqt: {formatDiscountCountdown()}</p>
                            <a href="tel:+998977087373">
                                <Button className="w-full bg-white text-green-600 hover:bg-green-50">
                                    <Phone className="w-4 h-4 mr-2" />
                                    Hoziroq Sotib Oling!
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Salom, {session?.user?.name || 'Mijoz'}! 👋
                        </h1>
                        <p className="text-muted-foreground">Bugungi sog'lom ovqatlanish rejangiz</p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => setIsChatOpen(true)}>
                        <MessageCircle className="w-4 h-4" />
                        Chat
                    </Button>
                </div>

                {/* Client Chat Component */}
                <ClientChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

                {/* Plan Info & Expiry Timer */}
                {customerPlan && (
                    <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        <span className="font-semibold text-lg">{customerPlan.name}</span>
                                        <Badge className="bg-primary">Faol</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Kunlik kaloriya: {customerPlan.dailyCalories} kcal
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground mb-1">Reja tugashiga:</p>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-orange-500" />
                                        <span className="font-mono text-xl font-bold text-orange-500">
                                            {planExpiryCountdown || 'Loading...'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Today's Menu */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-green-600" />
                                Bugungi Menyu
                            </CardTitle>
                            <CardDescription>
                                Sizning bugungi sog'lom taomlaringiz
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {todayMenu.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {todayMenu.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl hover:bg-secondary/70 transition-colors"
                                        >
                                            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-2xl">
                                                🥗
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold">{item.name}</h4>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Flame className="w-4 h-4 text-orange-500" />
                                                    <span className="text-sm font-medium">{item.calories} kcal</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Bugungi menyu hali tayyor emas</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Calorie Tracking */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-500" />
                                Kaloriya Hisobi
                            </CardTitle>
                            <CardDescription>
                                Bugungi kaloriya iste'molingiz
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center">
                                <div className="relative inline-flex items-center justify-center">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-secondary"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${calorieProgress * 3.52} 352`}
                                            className="text-primary transition-all duration-500"
                                        />
                                    </svg>
                                    <div className="absolute text-center">
                                        <span className="text-2xl font-bold">{consumedCalories}</span>
                                        <span className="text-sm text-muted-foreground block">kcal</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Iste'mol qilindi</span>
                                    <span className="font-medium">{consumedCalories} kcal</span>
                                </div>
                                <Progress value={calorieProgress} className="h-2" />
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Qoldi</span>
                                    <span className="font-medium text-green-600">{remainingCalories} kcal</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Order Status */}
                {currentOrder && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-blue-500" />
                                Buyurtma Holati
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <Badge className={getOrderStatusLabel(currentOrder.status).color}>
                                        {getOrderStatusLabel(currentOrder.status).label}
                                    </Badge>
                                    <div>
                                        <p className="font-medium">Buyurtma #{currentOrder.id.slice(-6)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {currentOrder.items.length} ta taom
                                        </p>
                                    </div>
                                </div>
                                {currentOrder.estimatedDelivery && currentOrder.status !== 'DELIVERED' && (
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Taxminiy yetkazish:</p>
                                        <p className="font-semibold text-lg">{currentOrder.estimatedDelivery}</p>
                                    </div>
                                )}
                            </div>

                            {/* Order Progress */}
                            <div className="mt-6">
                                <div className="relative">
                                    <div className="flex justify-between mb-2">
                                        {['PENDING', 'PREPARING', 'ON_THE_WAY', 'DELIVERED'].map((step, index) => {
                                            const isCompleted = ['PENDING', 'PREPARING', 'ON_THE_WAY', 'DELIVERED'].indexOf(currentOrder.status) >= index
                                            return (
                                                <div key={step} className={`flex flex-col items-center ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-primary text-white' : 'bg-secondary'}`}>
                                                        {index + 1}
                                                    </div>
                                                    <span className="text-xs mt-1 hidden md:block">
                                                        {getOrderStatusLabel(step as OrderInfo['status']).label}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-secondary -z-10">
                                        <div
                                            className="h-full bg-primary transition-all duration-500"
                                            style={{
                                                width: `${(['PENDING', 'PREPARING', 'ON_THE_WAY', 'DELIVERED'].indexOf(currentOrder.status) / 3) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
