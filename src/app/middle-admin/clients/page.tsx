

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ClientsTable } from '@/components/admin/ClientsTable'
import { Plus, Search, Users, Sparkles, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'

export default function ClientsPage() {
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const { toast } = useToast()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        calories: 1800,
        password: '', // New password field
        isActive: true
    })

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        try {
            // Need an API to list clients. Assuming /api/orders returns orders, maybe /api/customers?
            // If /api/customers doesn't exist, we might need to create it or grab from orders?
            // Let's assume we created /api/customers or repurpose logic.
            // For now, I'll fetch orders and extract unique customers or CREATE /api/customers route?
            // Plan didn't explicitly say "Create /api/customers LIST route".
            // But I effectively need one.
            // Let's implement /api/customers route in next step?
            // Or maybe fetch from /api/orders and Deduplicate? (Inefficient)
            // Better to have /api/customers.
            // For now, I'll try fetching /api/admin/statistics? No.
            // Let's create `GET /api/customers` next. 
            // I'll put placeholder fetch here.
            const res = await fetch('/api/customers')
            if (res.ok) {
                const data = await res.json()
                setClients(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        try {
            // Re-using Order creation logic OR dedicated Customer creation?
            // Existing logic uses /api/orders to create customer implicitly.
            // But we want JUST customer.
            // I should modify /api/auth/signup logic or create new POST /api/customers.
            // Let's assume POST /api/customers exists (I will create it).
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast({ title: 'Success', description: 'Client created successfully' })
                setIsCreateOpen(false)
                fetchClients()
                setFormData({ name: '', phone: '', address: '', calories: 1800, password: '', isActive: true })
            } else {
                const err = await res.json()
                toast({ title: 'Error', description: err.error || 'Failed to create' })
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to create client' })
        }
    }

    const handleUpdateBalance = async (id: string, amount: number) => {
        try {
            const res = await fetch(`/api/customers/${id}/balance`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, description: 'Manual Admin Adjustment' })
            })
            if (res.ok) {
                toast({ title: 'Success', description: 'Balance updated successfully' })
                fetchClients()
            }
        } catch (e) {
            console.error(e)
        }
    }

    const filteredClients = clients.filter((c: any) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    )

    return (
        <div className="space-y-8 container mx-auto max-w-7xl py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Clients Management
                    </h2>
                    <p className="text-muted-foreground mt-1">Manage your customer base, balances, and profiles.</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg transition-all hover:scale-[1.02]">
                            <Plus className="w-4 h-4 mr-2" />
                            New Client
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" />
                                Create New Client
                            </DialogTitle>
                            <DialogDescription>
                                Add a new client to your system. They can login with the password you set.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+998..." />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Delivery Address</Label>
                                <Input id="address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Street, Apartment..." />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Initial Password</Label>
                                <Input id="password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="calories">Daily Calories Goal</Label>
                                <Input id="calories" type="number" value={formData.calories} onChange={e => setFormData({ ...formData, calories: parseInt(e.target.value) })} placeholder="2000" />
                            </div>

                            <Button onClick={handleCreate} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700">Create Client Account</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-0 shadow-md bg-white/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search clients by name or phone..."
                            className="pl-10 max-w-md border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
                            <p>Loading clients...</p>
                        </div>
                    ) : (
                        <ClientsTable
                            clients={filteredClients}
                            onUpdateBalance={handleUpdateBalance}
                            onDelete={() => { }}
                            onEdit={() => { }}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
