'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { User, Lock } from 'lucide-react'

interface CourierProfileProps {
    courier: {
        id: string
        name: string
        email: string
        role: string
    }
}

export function CourierProfile({ courier }: CourierProfileProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Пароли не совпадают')
            return
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Пароль должен быть не менее 6 символов')
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/courier/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка при смене пароля')
            }

            toast.success('Пароль успешно изменен')
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Ошибка при смене пароля')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Профиль курьера
                    </CardTitle>
                    <CardDescription>Ваши личные данные</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Имя</Label>
                        <Input value={courier.name} disabled />
                    </div>
                    <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input value={courier.email} disabled />
                    </div>
                    <div className="grid gap-2">
                        <Label>Роль</Label>
                        <Input value="Курьер" disabled />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Смена пароля
                    </CardTitle>
                    <CardDescription>Обновите ваш пароль для входа в систему</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="currentPassword">Текущий пароль</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="newPassword">Новый пароль</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Подтвердите новый пароль</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Сохранение...' : 'Сменить пароль'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
