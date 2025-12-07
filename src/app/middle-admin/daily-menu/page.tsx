'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarIcon, Utensils, Save, Check, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface MenuItem {
    id: string
    name: string
    description: string
    calories: number
    stock: number
}

interface DailyMenu {
    id: string
    date: string
    menuItems: MenuItem[]
}

export default function DailyMenuPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [existingMenu, setExistingMenu] = useState<DailyMenu | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const MAX_ITEMS = 5

    useEffect(() => {
        fetchMenuItems()
    }, [])

    useEffect(() => {
        if (selectedDate) {
            fetchDailyMenu(selectedDate)
        }
    }, [selectedDate])

    const fetchMenuItems = async () => {
        try {
            const res = await fetch('/api/admin/menu-items')
            if (res.ok) {
                const data = await res.json()
                setMenuItems(data)
            }
        } catch (error) {
            console.error('Failed to fetch menu items:', error)
            toast.error('Menyu elementlarini yuklashda xatolik')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchDailyMenu = async (date: Date) => {
        try {
            const dateStr = format(date, 'yyyy-MM-dd')
            const res = await fetch(`/api/admin/daily-menu?date=${dateStr}`)
            if (res.ok) {
                const data = await res.json()
                if (data) {
                    setExistingMenu(data)
                    setSelectedItems(data.menuItems.map((item: MenuItem) => item.id))
                } else {
                    setExistingMenu(null)
                    setSelectedItems([])
                }
            }
        } catch (error) {
            console.error('Failed to fetch daily menu:', error)
        }
    }

    const handleItemToggle = (itemId: string) => {
        setSelectedItems(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId)
            } else {
                if (prev.length >= MAX_ITEMS) {
                    toast.error(`Maksimum ${MAX_ITEMS} ta taom tanlash mumkin`)
                    return prev
                }
                return [...prev, itemId]
            }
        })
    }

    const handleSave = async () => {
        if (selectedItems.length === 0) {
            toast.error('Kamida 1 ta taom tanlang')
            return
        }

        if (selectedItems.length > MAX_ITEMS) {
            toast.error(`Maksimum ${MAX_ITEMS} ta taom tanlash mumkin`)
            return
        }

        setIsSaving(true)
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd')
            const res = await fetch('/api/admin/daily-menu', {
                method: existingMenu ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateStr,
                    menuItemIds: selectedItems
                })
            })

            if (res.ok) {
                toast.success(`${format(selectedDate, 'dd.MM.yyyy')} kunlik menyu saqlandi`)
                fetchDailyMenu(selectedDate)
            } else {
                toast.error('Saqlashda xatolik')
            }
        } catch (error) {
            console.error('Error saving daily menu:', error)
            toast.error('Saqlashda xatolik')
        } finally {
            setIsSaving(false)
        }
    }

    const getSelectedItemsInfo = () => {
        const items = menuItems.filter(item => selectedItems.includes(item.id))
        const totalCalories = items.reduce((sum, item) => sum + item.calories, 0)
        return { items, totalCalories }
    }

    const { items: selectedMenuItems, totalCalories } = getSelectedItemsInfo()

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Kunlik Menyu</h1>
                    <p className="text-muted-foreground">Har kun uchun 5 ta taom tanlang</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar & Selected Items */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5" />
                                Sanani Tanlang
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                className="rounded-md border"
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {format(selectedDate, 'dd MMMM yyyy')} - Tanlangan Taomlar
                            </CardTitle>
                            <CardDescription>
                                {selectedItems.length}/{MAX_ITEMS} ta tanlangan
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {selectedMenuItems.length > 0 ? (
                                <>
                                    {selectedMenuItems.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-2 bg-background rounded-lg">
                                            <span className="font-medium">{item.name}</span>
                                            <Badge variant="secondary">{item.calories} kcal</Badge>
                                        </div>
                                    ))}
                                    <div className="pt-3 border-t">
                                        <div className="flex justify-between font-semibold">
                                            <span>Jami Kaloriya:</span>
                                            <span className="text-primary">{totalCalories} kcal</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                    <Utensils className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>Hech qanday taom tanlanmagan</p>
                                </div>
                            )}

                            <Button
                                className="w-full mt-4"
                                onClick={handleSave}
                                disabled={isSaving || selectedItems.length === 0}
                            >
                                {isSaving ? (
                                    'Saqlanmoqda...'
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Menyuni Saqlash
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Menu Items Selection */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Utensils className="w-5 h-5" />
                                Mavjud Taomlar
                            </CardTitle>
                            <CardDescription>
                                {MAX_ITEMS} tagacha taom tanlang
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    Yuklanmoqda...
                                </div>
                            ) : menuItems.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Avval Menyu Elementlari bo'limida taomlar yarating</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {menuItems.map((item) => {
                                        const isSelected = selectedItems.includes(item.id)
                                        const isDisabled = !isSelected && selectedItems.length >= MAX_ITEMS

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => !isDisabled && handleItemToggle(item.id)}
                                                className={`
                                                    relative p-4 rounded-xl border-2 cursor-pointer transition-all
                                                    ${isSelected
                                                        ? 'border-primary bg-primary/5 shadow-md'
                                                        : 'border-transparent bg-secondary/30 hover:bg-secondary/50'
                                                    }
                                                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                                        <Check className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                                <div className="flex items-start gap-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0">
                                                        🥗
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold truncate">{item.name}</h4>
                                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                                            {item.description || 'Tavsif mavjud emas'}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="secondary" className="text-orange-600 bg-orange-100">
                                                                {item.calories} kcal
                                                            </Badge>
                                                            <Badge variant={item.stock > 0 ? 'default' : 'destructive'}>
                                                                {item.stock} ta zaxira
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
