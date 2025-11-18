'use client'

import { useState, useEffect } from 'react'

export interface AdminSettings {
    compactMode: boolean
    showStats: boolean
    enableAnimations: boolean
    theme: 'light' | 'dark' | 'system'
}

const DEFAULT_SETTINGS: AdminSettings = {
    compactMode: false,
    showStats: true,
    enableAnimations: true,
    theme: 'system'
}

export function useAdminSettings() {
    const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const savedSettings = localStorage.getItem('adminSettings')
        if (savedSettings) {
            try {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) })
            } catch (e) {
                console.error('Failed to parse admin settings', e)
            }
        }
        setMounted(true)
    }, [])

    const updateSettings = (newSettings: Partial<AdminSettings>) => {
        const updated = { ...settings, ...newSettings }
        setSettings(updated)
        localStorage.setItem('adminSettings', JSON.stringify(updated))

        // Apply theme if changed (simplified version)
        if (newSettings.theme) {
            // In a real app, this would interact with a ThemeProvider
        }
    }

    return {
        settings,
        updateSettings,
        mounted
    }
}
