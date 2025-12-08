
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Eye, Edit, Plus, Minus, Trash2 } from 'lucide-react'

interface Customer {
    id: string
    name: string
    phone: string
    balance: number
    isActive: boolean
    calories: number
    address: string
    // ... other fields
}

interface ClientsTableProps {
    clients: Customer[]
    onUpdateBalance: (id: string, amount: number) => void
    onDelete: (id: string) => void
    onEdit: (client: Customer) => void
}

export function ClientsTable({ clients, onUpdateBalance, onDelete, onEdit }: ClientsTableProps) {
    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Calories</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.map((client) => (
                        <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{client.phone}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={client.address}>{client.address || '-'}</TableCell>
                            <TableCell>{client.calories}</TableCell>
                            <TableCell>
                                <Badge variant={client.isActive ? 'default' : 'secondary'}>
                                    {client.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${client.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {client.balance.toLocaleString()} UZS
                                    </span>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6 text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                                            onClick={() => onUpdateBalance(client.id, -1000)}
                                            title="-1,000"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6 text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                                            onClick={() => onUpdateBalance(client.id, 1000)}
                                            title="+1,000"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => onEdit(client)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                {/* <Button variant="ghost" size="icon" onClick={() => onDelete(client.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button> */}
                            </TableCell>
                        </TableRow>
                    ))}
                    {clients.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                No clients found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
