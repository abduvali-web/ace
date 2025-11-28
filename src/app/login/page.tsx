'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2, Truck, ShieldCheck, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Home() {
  const { t } = useLanguage()
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        toast.success(t.common.success, {
          description: t.auth.welcome
        })

        // Small delay for animation
        setTimeout(() => {
          switch (data.user.role) {
            case 'SUPER_ADMIN':
              window.location.href = '/super-admin'
              break
            case 'MIDDLE_ADMIN':
              window.location.href = '/middle-admin'
              break
            case 'LOW_ADMIN':
              window.location.href = '/low-admin'
              break
            case 'COURIER':
              window.location.href = '/courier'
              break
            default:
              toast.error(t.common.error, { description: 'Неизвестная роль пользователя' })
          }
        }, 800)
      } else {
        toast.error(t.common.error, { description: data.error || 'Проверьте данные и попробуйте снова' })
      }
    } catch (err) {
      toast.error(t.common.error, { description: 'Не удалось соединиться с сервером' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-background overflow-hidden">
      {/* Left Side - Hero/Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-primary overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1616401784845-180886ba9ca8?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-purple-900/90 backdrop-blur-sm"></div>

        <div className="relative z-10 max-w-xl px-12 text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                <Truck className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">AutoFood</h1>
            </div>

            <h2 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              {t.auth.welcome} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                AutoFood
              </span>
            </h2>

            <p className="text-lg text-primary-foreground/80 mb-12 leading-relaxed">
              {t.auth.loginSubtitle}
            </p>


            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: ShieldCheck, title: "Безопасность", desc: "Защита данных уровня Enterprise" },
                { icon: BarChart3, title: "Аналитика", desc: "Детальные отчеты в реальном времени" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + (i * 0.2) }}
                  className="flex gap-4 items-start"
                >
                  <div className="p-2 bg-white/10 rounded-lg mt-1">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-primary-foreground/60">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10"></div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          <div className="absolute top-8 right-8">
            <LanguageSwitcher />
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="border-none shadow-2xl bg-white/50 backdrop-blur-sm">
              <CardHeader className="space-y-1 text-center pb-8">
                <CardTitle className="text-3xl font-bold tracking-tight">{t.auth.loginTitle}</CardTitle>
                <CardDescription className="text-base">
                  {t.auth.loginSubtitle}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.auth.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@autofood.uz"
                        className="pl-10 h-11 bg-white/50"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t.auth.password}</Label>
                      <a href="#" className="text-sm font-medium text-primary hover:underline">
                        {t.auth.forgotPassword}
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        className="pl-10 h-11 bg-white/50"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t.common.loading}
                      </>
                    ) : (
                      <>
                        {t.auth.signIn}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Или
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full h-11"
                  onClick={() => signIn('google')}
                >
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                  Войти через Google
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Демо доступ
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="p-3 rounded-lg bg-muted/50 border border-muted text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">Супер Админ:</span>
                      <span className="font-mono text-muted-foreground">super@admin.com</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">Пароль:</span>
                      <span className="font-mono text-muted-foreground">admin123</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-center border-t border-muted/50 pt-6">
                <p className="text-xs text-center text-muted-foreground">
                  Защищено reCAPTCHA и применяются
                  <a href="#" className="underline hover:text-primary ml-1">{t.auth.privacyPolicy}</a> и
                  <a href="#" className="underline hover:text-primary ml-1">{t.auth.termsOfUse}</a>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
