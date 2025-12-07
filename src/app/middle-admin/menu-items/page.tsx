'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Utensils, X, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'

interface Ingredient {
    id: string
    name: string
    quantity: number
    unit: string
}

interface RecipeIngredient {
    ingredientId: string
    ingredientName?: string
    quantityRequired: number
}

interface MenuItem {
    id: string
    name: string
    description: string
    calories: number
    stock: number
    image?: string
    ingredients: RecipeIngredient[]
}

export default function MenuItemsPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        calories: 0,
        stock: 0,
        image: ''
    })
    const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([])
    const [selectedIngredient, setSelectedIngredient] = useState('')
    const [ingredientQuantity, setIngredientQuantity] = useState(0)

    useEffect(() => {
        fetchMenuItems()
        fetchIngredients()
    }, [])

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

    const fetchIngredients = async () => {
        try {
            const res = await fetch('/api/admin/sklad')
            if (res.ok) {
                const data = await res.json()
                setIngredients(data)
            }
        } catch (error) {
            console.error('Failed to fetch ingredients:', error)
        }
    }

    const handleAddRecipeIngredient = () => {
        if (!selectedIngredient || ingredientQuantity <= 0) {
            toast.error('Ingredient va miqdorni tanlang')
            return
        }

        const ingredient = ingredients.find(i => i.id === selectedIngredient)
        if (!ingredient) return

        // Check if already added
        if (recipeIngredients.some(ri => ri.ingredientId === selectedIngredient)) {
            toast.error('Bu ingredient allaqachon qo\'shilgan')
            return
        }

        setRecipeIngredients([
            ...recipeIngredients,
            {
                ingredientId: selectedIngredient,
                ingredientName: ingredient.name,
                quantityRequired: ingredientQuantity
            }
        ])

        setSelectedIngredient('')
        setIngredientQuantity(0)
    }

    const handleRemoveRecipeIngredient = (ingredientId: string) => {
        setRecipeIngredients(recipeIngredients.filter(ri => ri.ingredientId !== ingredientId))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const payload = {
                ...formData,
                ingredients: recipeIngredients.map(ri => ({
                    ingredientId: ri.ingredientId,
                    quantityRequired: ri.quantityRequired
                }))
            }

            const url = editingItem
                ? `/api/admin/menu-items/${editingItem.id}`
                : '/api/admin/menu-items'
            const method = editingItem ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success(editingItem ? 'Menyu elementi yangilandi' : 'Menyu elementi qo\'shildi')
                fetchMenuItems()
                handleCloseDialog()
            } else {
                toast.error('Xatolik yuz berdi')
            }
        } catch (error) {
            console.error('Error saving menu item:', error)
            toast.error('Xatolik yuz berdi')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Rostdan ham o\'chirmoqchimisiz?')) return

        try {
            const res = await fetch(`/api/admin/menu-items/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Menyu elementi o\'chirildi')
                fetchMenuItems()
            } else {
                toast.error('O\'chirishda xatolik')
            }
        } catch (error) {
            console.error('Error deleting menu item:', error)
            toast.error('O\'chirishda xatolik')
        }
    }

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item)
        setFormData({
            name: item.name,
            description: item.description || '',
            calories: item.calories,
            stock: item.stock,
            image: item.image || ''
        })
        setRecipeIngredients(item.ingredients || [])
        setIsDialogOpen(true)
    }

    const handleProduce = async (item: MenuItem) => {
        const quantity = prompt('Necha dona tayyorlash kerak?', '1')
        if (!quantity || isNaN(parseInt(quantity))) return

        try {
            const res = await fetch(`/api/admin/menu-items/${item.id}/produce`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: parseInt(quantity) })
            })

            if (res.ok) {
                toast.success(`${quantity} ta ${item.name} tayyorlandi`)
                fetchMenuItems()
                fetchIngredients()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Tayyorlashda xatolik')
            }
        } catch (error) {
            console.error('Error producing menu item:', error)
            toast.error('Tayyorlashda xatolik')
        }
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setEditingItem(null)
        setFormData({ name: '', description: '', calories: 0, stock: 0, image: '' })
        setRecipeIngredients([])
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Menyu Elementlari</h1>
                    <p className="text-muted-foreground">Taomlar va retseptlarni boshqaring</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleCloseDialog()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Taom Qo'shish
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? 'Taomni Tahrirlash' : 'Yangi Taom'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nomi</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Masalan: Sabzili Salat"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="calories">Kaloriya</Label>
                                    <Input
                                        id="calories"
                                        type="number"
                                        value={formData.calories}
                                        onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Tavsif</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Taom haqida qisqa ma'lumot"
                                />
                            </div>

                            {/* Recipe Section */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FlaskConical className="w-5 h-5" />
                                        Retsept (1 porsiya uchun)
                                    </CardTitle>
                                    <CardDescription>
                                        Bu taom uchun kerakli ingredientlarni qo'shing
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Ingredient tanlang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ingredients.map(ing => (
                                                    <SelectItem key={ing.id} value={ing.id}>
                                                        {ing.name} ({ing.quantity} {ing.unit})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Miqdor (kg)"
                                            className="w-32"
                                            value={ingredientQuantity || ''}
                                            onChange={(e) => setIngredientQuantity(parseFloat(e.target.value))}
                                        />
                                        <Button type="button" onClick={handleAddRecipeIngredient}>
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {recipeIngredients.length > 0 && (
                                        <div className="space-y-2">
                                            {recipeIngredients.map((ri) => (
                                                <div key={ri.ingredientId} className="flex items-center justify-between bg-secondary/50 rounded-lg p-2">
                                                    <span>{ri.ingredientName}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary">{ri.quantityRequired} kg</Badge>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => handleRemoveRecipeIngredient(ri.ingredientId)}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                    Bekor qilish
                                </Button>
                                <Button type="submit">
                                    {editingItem ? 'Yangilash' : 'Qo\'shish'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        Yuklanmoqda...
                    </div>
                ) : menuItems.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Menyu elementlari mavjud emas</p>
                    </div>
                ) : (
                    menuItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="h-32 bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-4xl">
                                🥗
                            </div>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{item.name}</CardTitle>
                                    <Badge className="bg-orange-500">{item.calories} kcal</Badge>
                                </div>
                                <CardDescription className="line-clamp-2">
                                    {item.description || 'Tavsif mavjud emas'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm text-muted-foreground">Zaxira:</span>
                                    <Badge variant={item.stock > 0 ? 'default' : 'destructive'}>
                                        {item.stock} ta
                                    </Badge>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleProduce(item)}
                                    >
                                        <FlaskConical className="w-4 h-4 mr-1" />
                                        Tayyorlash
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(item)}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
