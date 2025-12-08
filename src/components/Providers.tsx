'use native'
'use client'

import { SessionProvider } from 'next-auth/react'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AdminSettingsProvider } from '@/contexts/AdminSettingsContext'
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <LanguageProvider>
                <AdminSettingsProvider>
                    {children}
                    <Toaster />
                </AdminSettingsProvider>
            </LanguageProvider>
        </SessionProvider>
    )
}
