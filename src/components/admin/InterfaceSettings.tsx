'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useAdminSettings } from '@/hooks/useAdminSettings'
import { Save, RefreshCw, Monitor, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'

export function InterfaceSettings() {
    const { settings, updateSettings, mounted } = useAdminSettings()

    if (!mounted) return null

    const handleSave = () => {
        toast.success('Настройки интерфейса сохранены')
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Настройки отображения</CardTitle>
                    <CardDescription>
                        Настройте внешний вид панели управления под себя
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="compact-mode">Компактный режим</Label>
                            <p className="text-sm text-muted-foreground">
                                Уменьшает отступы в таблицах для отображения большего количества данных
                            </p>
                        </div>
                        <Switch
                            id="compact-mode"
                            checked={settings.compactMode}
                            onCheckedChange={(checked) => updateSettings({ compactMode: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="show-stats">Показывать статистику</Label>
                            <p className="text-sm text-muted-foreground">
                                Отображать карточки со статистикой на главной странице
                            </p>
                        </div>
                        <Switch
                            id="show-stats"
                            checked={settings.showStats}
                            onCheckedChange={(checked) => updateSettings({ showStats: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="animations">Анимации</Label>
                            <p className="text-sm text-muted-foreground">
                                Включить плавные переходы и анимации интерфейса
                            </p>
                        </div>
                        <Switch
                            id="animations"
                            checked={settings.enableAnimations}
                            onCheckedChange={(checked) => updateSettings({ enableAnimations: checked })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Тема оформления</CardTitle>
                    <CardDescription>
                        Выберите цветовую схему интерфейса
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <Button
                            variant={settings.theme === 'light' ? 'default' : 'outline'}
                            className="w-full"
                            onClick={() => updateSettings({ theme: 'light' })}
                        >
                            <Sun className="mr-2 h-4 w-4" />
                            Светлая
                        </Button>
                        <Button
                            variant={settings.theme === 'dark' ? 'default' : 'outline'}
                            className="w-full"
                            onClick={() => updateSettings({ theme: 'dark' })}
                        >
                            <Moon className="mr-2 h-4 w-4" />
                            Темная
                        </Button>
                        <Button
                            variant={settings.theme === 'system' ? 'default' : 'outline'}
                            className="w-full"
                            onClick={() => updateSettings({ theme: 'system' })}
                        >
                            <Monitor className="mr-2 h-4 w-4" />
                            Системная
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Сохранить настройки
                </Button>
            </div>
        </div>
    )
}
