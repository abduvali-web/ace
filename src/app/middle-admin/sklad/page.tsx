'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface Ingredient {
    id: string
    name: string
    quantity: number
    unit: string
}

export default function SkladPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
    const [formData, setFormData] = useState({ name: '', quantity: 0, unit: 'kg' })

    useEffect(() => {
        fetchIngredients()
    }, [])

    const fetchIngredients = async () => {
        try {
            const res = await fetch('/api/admin/sklad')
            if (res.ok) {
                const data = await res.json()
                setIngredients(data)
            }
        } catch (error) {
            console.error('Failed to fetch ingredients:', error)
            toast.error('Ingredientlarni yuklashda xatolik')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = editingIngredient
                ? `/api/admin/sklad/${editingIngredient.id}`
                : '/api/admin/sklad'
            const method = editingIngredient ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success(editingIngredient ? 'Ingredient yangilandi' : 'Ingredient qo\'shildi')
                fetchIngredients()
                handleCloseDialog()
            } else {
                toast.error('Xatolik yuz berdi')
            }
        } catch (error) {
            console.error('Error saving ingredient:', error)
            toast.error('Xatolik yuz berdi')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Rostdan ham o\'chirmoqchimisiz?')) return

        try {
            const res = await fetch(`/api/admin/sklad/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Ingredient o\'chirildi')
                fetchIngredients()
            } else {
                toast.error('O\'chirishda xatolik')
            }
        } catch (error) {
            console.error('Error deleting ingredient:', error)
            toast.error('O\'chirishda xatolik')
        }
    }

    const handleEdit = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient)
        setFormData({ name: ingredient.name, quantity: ingredient.quantity, unit: ingredient.unit })
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setEditingIngredient(null)
        setFormData({ name: '', quantity: 0, unit: 'kg' })
    }

    const getLowStockBadge = (quantity: number) => {
        if (quantity <= 0) return <Badge variant="destructive">Tugagan</Badge>
        if (quantity < 5) return <Badge className="bg-orange-500">Kam</Badge>
        return <Badge className="bg-green-500">Yetarli</Badge>
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Sklad (Ombor)</h1>
                    <p className="text-muted-foreground">Ingredientlar va zaxiralarni boshqaring</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleCloseDialog()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Ingredient Qo'shish
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingIngredient ? 'Ingredientni Tahrirlash' : 'Yangi Ingredient'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nomi</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Masalan: Sabzi"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Miqdor</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        step="0.01"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unit">Birlik</Label>
                                    <Input
                                        id="unit"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        placeholder="kg"
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                    Bekor qilish
                                </Button>
                                <Button type="submit">
                                    {editingIngredient ? 'Yangilash' : 'Qo\'shish'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Jami Ingredientlar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Package className="w-8 h-8 text-primary" />
                            <span className="text-3xl font-bold">{ingredients.length}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Kam Qolgan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-8 h-8 text-orange-500" />
                            <span className="text-3xl font-bold text-orange-500">
                                {ingredients.filter(i => i.quantity < 5 && i.quantity > 0).length}
                            </span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tugagan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                            <span className="text-3xl font-bold text-red-500">
                                {ingredients.filter(i => i.quantity <= 0).length}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Ingredients Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nomi</TableHead>
                                <TableHead className="text-right">Miqdor</TableHead>
                                <TableHead>Birlik</TableHead>
                                <TableHead>Holat</TableHead>
                                <TableHead className="text-right">Amallar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        Yuklanmoqda...
                                    </TableCell>
                                </TableRow>
                            ) : ingredients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Ingredientlar mavjud emas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                ingredients.map((ingredient) => (
                                    <TableRow key={ingredient.id}>
                                        <TableCell className="font-medium">{ingredient.name}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            {ingredient.quantity.toFixed(2)}
                                        </TableCell>
                                        <TableCell>{ingredient.unit}</TableCell>
                                        <TableCell>{getLowStockBadge(ingredient.quantity)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(ingredient)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => handleDelete(ingredient.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
