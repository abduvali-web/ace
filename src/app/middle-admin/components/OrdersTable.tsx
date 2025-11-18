import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Trash2, Eye, Edit } from 'lucide-react'

interface Order {
    id: string
    orderNumber: number
    customer: {
        name: string
        phone: string
    }
    deliveryAddress: string
    deliveryTime: string
    quantity: number
    calories: number
    orderStatus: string
    paymentStatus: string
    createdAt: string
    deliveryDate?: string
    isAutoOrder?: boolean
    customerName?: string
    customerPhone?: string
}

interface OrdersTableProps {
    orders: Order[]
    selectedOrders: Set<string>
    onSelectOrder: (id: string) => void
    onSelectAll: () => void
    onDeleteSelected: () => void
}

export function OrdersTable({
    orders,
    selectedOrders,
    onSelectOrder,
    onSelectAll,
    onDeleteSelected
}: OrdersTableProps) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Заказы</h2>
                {selectedOrders.size > 0 && (
                    <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить выбранные ({selectedOrders.size})
                    </Button>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={orders.length > 0 && selectedOrders.size === orders.length}
                                    onCheckedChange={onSelectAll}
                                />
                            </TableHead>
                            <TableHead>Номер</TableHead>
                            <TableHead>Клиент</TableHead>
                            <TableHead>Адрес</TableHead>
                            <TableHead>Время</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Оплата</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedOrders.has(order.id)}
                                        onCheckedChange={() => onSelectOrder(order.id)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                                <TableCell>
                                    <div>{order.customer.name}</div>
                                    <div className="text-sm text-muted-foreground">{order.customer.phone}</div>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={order.deliveryAddress}>
                                    {order.deliveryAddress}
                                </TableCell>
                                <TableCell>{order.deliveryTime}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        order.orderStatus === 'DELIVERED' ? 'default' :
                                            order.orderStatus === 'PENDING' ? 'secondary' :
                                                order.orderStatus === 'IN_DELIVERY' ? 'outline' : 'destructive'
                                    }>
                                        {order.orderStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'destructive'}>
                                        {order.paymentStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {orders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    Нет заказов
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
