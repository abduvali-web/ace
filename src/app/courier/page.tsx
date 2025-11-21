'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  MapPin,
  Phone,
  LogOut,
  Play,
  CheckCircle,
  Clock,
  Utensils,
  Pause,
  RefreshCw,
  Navigation,
  AlertCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

// Dynamically import Map component to avoid SSR issues with Leaflet
const CourierMap = dynamic(() => import('@/components/courier/CourierMap'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">Загрузка карты...</div>
})

interface Order {
  id: string
  orderNumber: number
  customer: {
    name: string
    phone: string
  }
  deliveryAddress: string
  latitude: number
  longitude: number
  deliveryTime: string
  quantity: number
  calories: number
  specialFeatures: string
  orderStatus: string
  deliveryDate?: string
  createdAt: string
}

export default function CourierPage() {
  const { t } = useLanguage()
  const [orders, setOrders] = useState<Order[]>([])
  const [historyOrders, setHistoryOrders] = useState<Order[]>([])
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0)
  const [isOrderOpen, setIsOrderOpen] = useState(false)
  const [isOrderPaused, setIsOrderPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | undefined>(undefined)

  useEffect(() => {
    // Fetch data on initial load
    // Authentication is handled by NextAuth middleware
    fetchOrders()
    getCurrentLocation()

    // Polling for updates every 15 seconds
    const intervalId = setInterval(() => {
      fetchOrders(true)
      getCurrentLocation()
    }, 15000)

    return () => clearInterval(intervalId)
  }, [])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  // Haversine formula to calculate distance between two points in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distance in km
    return d
  }

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180)
  }

  const fetchOrders = async (background = false) => {
    if (!background) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const ordersData = await response.json()

        // Filter active orders
        const availableOrders = ordersData.filter((order: Order) =>
          order.orderStatus === 'PENDING' || order.orderStatus === 'IN_DELIVERY' || order.orderStatus === 'PAUSED'
        )
        setOrders(availableOrders)

        // Filter history orders
        const completedOrders = ordersData.filter((order: Order) =>
          order.orderStatus === 'DELIVERED' || order.orderStatus === 'FAILED'
        )
        setHistoryOrders(completedOrders)

        // Check if any order is currently active/paused to set initial state
        const activeOrderIndex = availableOrders.findIndex((o: Order) =>
          o.orderStatus === 'IN_DELIVERY' || o.orderStatus === 'PAUSED'
        )

        if (activeOrderIndex !== -1) {
          setCurrentOrderIndex(activeOrderIndex)
          setIsOrderOpen(true)
          setIsOrderPaused(availableOrders[activeOrderIndex].orderStatus === 'PAUSED')
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      if (!background) toast.error(t.common.error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const currentOrder = orders[currentOrderIndex]

  const handleNextOrder = () => {
    if (currentOrderIndex < orders.length - 1) {
      setCurrentOrderIndex(prev => prev + 1)
    }
  }

  const handlePrevOrder = () => {
    if (currentOrderIndex > 0) {
      setCurrentOrderIndex(prev => prev - 1)
    }
  }

  const handleOpenOrder = async () => {
    // Smart Routing Logic
    let targetOrder = currentOrder
    let targetIndex = currentOrderIndex

    if (currentLocation && orders.length > 0) {
      // Find nearest pending order
      let minDistance = Infinity
      let nearestIndex = -1

      orders.forEach((order, index) => {
        if (order.orderStatus === 'PENDING' || order.orderStatus === 'PAUSED') {
          // Use default coordinates if missing (fallback to Tashkent center)
          const orderLat = order.latitude || 41.2995
          const orderLng = order.longitude || 69.2401

          const dist = calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            orderLat,
            orderLng
          )

          if (dist < minDistance) {
            minDistance = dist
            nearestIndex = index
          }
        }
      })

      if (nearestIndex !== -1 && nearestIndex !== currentOrderIndex) {
        targetOrder = orders[nearestIndex]
        targetIndex = nearestIndex
        setCurrentOrderIndex(nearestIndex)
        toast.info(`Optimized route: Switched to nearest order (${minDistance.toFixed(1)} km)`)
      }
    }

    if (!targetOrder) return

    try {
      const response = await fetch(`/api/orders/${targetOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'start_delivery' })
      })

      if (response.ok) {
        setIsOrderOpen(true)
        toast.success(t.courier.startDelivery, {
          description: t.courier.activeOrder
        })
        // Update local state immediately
        const updatedOrders = [...orders]
        updatedOrders[targetIndex].orderStatus = 'IN_DELIVERY'
        setOrders(updatedOrders)
      }
    } catch (error) {
      console.error('Error starting delivery:', error)
      toast.error(t.common.error)
    }
  }

  const handleCloseOrder = async () => {
    if (!currentOrder) return

    const confirmClose = window.confirm(t.courier.completeDelivery + '?')
    if (!confirmClose) return

    try {
      const response = await fetch(`/api/orders/${currentOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'complete_delivery' })
      })

      if (response.ok) {
        toast.success(t.common.success)
        setIsOrderOpen(false)
        setIsOrderPaused(false)
        fetchOrders()
        if (currentOrderIndex > 0) setCurrentOrderIndex(prev => prev - 1)
      }
    } catch (error) {
      console.error('Error completing delivery:', error)
      toast.error(t.common.error)
    }
  }

  const handlePauseOrder = async () => {
    if (!currentOrder) return

    try {
      const response = await fetch(`/api/orders/${currentOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'pause_delivery' })
      })

      if (response.ok) {
        setIsOrderPaused(true)
        toast.info(t.courier.pauseDelivery)
        const updatedOrders = [...orders]
        updatedOrders[currentOrderIndex].orderStatus = 'PAUSED'
        setOrders(updatedOrders)
      }
    } catch (error) {
      console.error('Error pausing delivery:', error)
      toast.error(t.common.error)
    }
  }

  const handleResumeOrder = async () => {
    if (!currentOrder) return

    try {
      const response = await fetch(`/api/orders/${currentOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'resume_delivery' })
      })

      if (response.ok) {
        setIsOrderPaused(false)
        toast.success(t.courier.resumeDelivery)
        const updatedOrders = [...orders]
        updatedOrders[currentOrderIndex].orderStatus = 'IN_DELIVERY'
        setOrders(updatedOrders)
      }
    } catch (error) {
      console.error('Error resuming delivery:', error)
      toast.error(t.common.error)
    }
  }

  const handleGetRoute = () => {
    if (!currentOrder) return

    try {
      let destination = currentOrder.deliveryAddress

      if (currentOrder.latitude && currentOrder.longitude) {
        destination = `${currentOrder.latitude},${currentOrder.longitude}`
      }

      // Use current location if available, otherwise let Google Maps decide (usually defaults to current location)
      const originParam = currentLocation ? `origin=${currentLocation.lat},${currentLocation.lng}&` : ''

      const navigationUrl = `https://www.google.com/maps/dir/?api=1&${originParam}destination=${destination}&travelmode=driving&dir_action=navigate`
      window.open(navigationUrl, '_blank')
    } catch (error) {
      console.error('Error getting route:', error)
      toast.error(t.common.error)
    }
  }

  const handleLogout = async () => {
    // Clear localStorage (for backward compatibility)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // Sign out from NextAuth (clears session cookies)
    await signOut({ callbackUrl: '/', redirect: true })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"
        />
        <p className="text-slate-600 font-medium animate-pulse">{t.common.loading}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 safe-top">
        <div className="max-w-md mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg text-gradient">{t.courier.title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            {isRefreshing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
              </motion.div>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-500 hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-muted/50 backdrop-blur-sm rounded-xl">
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all duration-200"
            >
              {t.courier.orders} ({orders.length})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all duration-200"
            >
              {t.courier.history} ({historyOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <AnimatePresence mode="wait">
              {currentOrder ? (
                <motion.div
                  key={currentOrder.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Active Order Card */}
                  <Card className="glass-card border-none overflow-hidden shadow-lg ring-1 ring-slate-200/50">
                    <div className={`h-2 w-full ${isOrderPaused ? 'bg-yellow-500' :
                      isOrderOpen ? 'bg-blue-500' :
                        'bg-green-500'
                      }`} />
                    <CardContent className="p-0">
                      {/* Map Section */}
                      <div className="h-48 w-full relative z-0">
                        <CourierMap
                          destination={{
                            lat: currentOrder.latitude || 41.2995,
                            lng: currentOrder.longitude || 69.2401
                          }}
                          currentLocation={currentLocation}
                        />
                      </div>

                      <div className="p-6 bg-white relative z-10 -mt-4 rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <Badge variant="outline" className="mb-2 border-slate-200 text-slate-500">
                              #{currentOrder.orderNumber}
                            </Badge>
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">
                              {currentOrder.customer.name}
                            </h2>
                            <div className="flex items-center text-slate-500 text-sm">
                              <Clock className="w-4 h-4 mr-1" />
                              {currentOrder.deliveryTime}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              className={`px-3 py-1 ${isOrderPaused ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                isOrderOpen ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                  'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                            >
                              {isOrderPaused ? t.courier.pauseDelivery : isOrderOpen ? t.courier.activeOrder : 'New'}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start p-3 bg-slate-50 rounded-xl">
                            <MapPin className="w-5 h-5 text-primary mt-0.5 mr-3 shrink-0" />
                            <div>
                              <p className="text-sm text-slate-500 mb-0.5">{t.courier.deliveryAddress}</p>
                              <p className="font-medium text-slate-900 leading-snug">
                                {currentOrder.deliveryAddress}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center p-3 bg-slate-50 rounded-xl">
                            <Phone className="w-5 h-5 text-primary mr-3 shrink-0" />
                            <div>
                              <p className="text-sm text-slate-500 mb-0.5">{t.common.phone}</p>
                              <a href={`tel:${currentOrder.customer.phone}`} className="font-medium text-slate-900 hover:text-primary">
                                {currentOrder.customer.phone}
                              </a>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 rounded-xl">
                              <div className="flex items-center mb-1">
                                <Package className="w-4 h-4 text-primary mr-2" />
                                <span className="text-xs text-slate-500">{t.common.quantity}</span>
                              </div>
                              <p className="font-semibold text-slate-900">{currentOrder.quantity} шт.</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl">
                              <div className="flex items-center mb-1">
                                <Utensils className="w-4 h-4 text-primary mr-2" />
                                <span className="text-xs text-slate-500">{t.common.calories}</span>
                              </div>
                              <p className="font-semibold text-slate-900">{currentOrder.calories}</p>
                            </div>
                          </div>

                          {currentOrder.specialFeatures && (
                            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                              <div className="flex items-center mb-1 text-yellow-700">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                <span className="text-xs font-medium">Note</span>
                              </div>
                              <p className="text-sm text-yellow-900">{currentOrder.specialFeatures}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                        {!isOrderOpen ? (
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant="outline"
                              className="h-12 text-base font-medium"
                              onClick={handleGetRoute}
                            >
                              <Navigation className="w-5 h-5 mr-2" />
                              {t.courier.buildRoute}
                            </Button>
                            <Button
                              className="h-12 text-base font-medium bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200"
                              onClick={handleOpenOrder}
                            >
                              <Play className="w-5 h-5 mr-2" />
                              {t.courier.apply}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                variant="outline"
                                className="h-12 text-base font-medium"
                                onClick={handleGetRoute}
                              >
                                <Navigation className="w-5 h-5 mr-2" />
                                {t.courier.buildRoute}
                              </Button>
                              {isOrderPaused ? (
                                <Button
                                  className="h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={handleResumeOrder}
                                >
                                  <Play className="w-5 h-5 mr-2" />
                                  {t.courier.resumeDelivery}
                                </Button>
                              ) : (
                                <Button
                                  variant="secondary"
                                  className="h-12 text-base font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                  onClick={handlePauseOrder}
                                >
                                  <Pause className="w-5 h-5 mr-2" />
                                  {t.courier.pauseDelivery}
                                </Button>
                              )}
                            </div>
                            <Button
                              className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl"
                              onClick={handleCloseOrder}
                            >
                              <CheckCircle className="w-6 h-6 mr-2" />
                              {t.courier.completeDelivery}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Navigation Controls for Orders */}
                  {orders.length > 1 && (
                    <div className="flex justify-between items-center px-2">
                      <Button
                        variant="ghost"
                        onClick={handlePrevOrder}
                        disabled={currentOrderIndex === 0}
                        className="text-slate-500"
                      >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        {t.common.back}
                      </Button>
                      <span className="text-sm font-medium text-slate-500">
                        {currentOrderIndex + 1} / {orders.length}
                      </span>
                      <Button
                        variant="ghost"
                        onClick={handleNextOrder}
                        disabled={currentOrderIndex === orders.length - 1}
                        className="text-slate-500"
                      >
                        {t.courier.swipeNext}
                        <ChevronRight className="w-5 h-5 ml-1" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="no-orders"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Package className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{t.courier.noOrders}</h3>
                  <p className="text-slate-500 max-w-[250px] mb-8">
                    {t.courier.noOrders}
                  </p>
                  <Button
                    onClick={() => fetchOrders()}
                    variant="outline"
                    className="min-w-[150px]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Обновить
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              {historyOrders.length > 0 ? (
                historyOrders.map((order) => (
                  <Card key={order.id} className="glass-card border-none shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-slate-900">#{order.orderNumber} {order.customer.name}</div>
                          <div className="text-sm text-slate-500">{order.deliveryAddress}</div>
                        </div>
                        <Badge variant={order.orderStatus === 'DELIVERED' ? 'default' : 'destructive'}>
                          {order.orderStatus === 'DELIVERED' ? t.common.success : t.common.error}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-slate-500 mt-2">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  {t.courier.history} {t.common.error}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
