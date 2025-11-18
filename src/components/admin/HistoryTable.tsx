'use client'

import { useState, useEffect } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface ActionLog {
    id: string
    action: string
    entityType: string
    description: string
    createdAt: string
    admin: {
        name: string
        email: string
        role: string
    }
}

interface HistoryTableProps {
    role?: string
    limit?: number
    compactMode?: boolean
}

export function HistoryTable({ role, limit = 10, compactMode = false }: HistoryTableProps) {
    const [logs, setLogs] = useState<ActionLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [total, setTotal] = useState(0)
    const [hasMore, setHasMore] = useState(false)

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: (page * limit).toString()
            })

            const response = await fetch(`/api/admin/action-logs?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setLogs(data.logs || [])
                setTotal(data.total || 0)
                setHasMore(data.hasMore || false)
            }
        } catch (error) {
            console.error('Error fetching logs:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [page, limit])

    const getActionBadgeColor = (action: string) => {
        if (action.includes('CREATE')) return 'bg-green-100 text-green-800'
        if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800'
        if (action.includes('DELETE')) return 'bg-red-100 text-red-800'
        return 'bg-slate-100 text-slate-800'
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <CardTitle>История действий</CardTitle>
                    <CardDescription>
                        Всего записей: {total}
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Дата</TableHead>
                                <TableHead>Пользователь</TableHead>
                                <TableHead>Действие</TableHead>
                                <TableHead>Описание</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        История пуста
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} className={compactMode ? 'h-8' : ''}>
                                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                            {format(new Date(log.createdAt), 'dd MMM HH:mm', { locale: ru })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{log.admin.name}</span>
                                                <span className="text-xs text-muted-foreground">{log.admin.role}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={getActionBadgeColor(log.action)}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate" title={log.description}>
                                            {log.description}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Назад
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Страница {page + 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={!hasMore || isLoading}
                    >
                        Вперед
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
