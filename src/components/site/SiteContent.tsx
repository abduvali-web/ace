'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
    Phone, ShoppingCart, Clock, MapPin,
    ChevronRight, Star, Truck, Menu, X,
    Instagram, Facebook, Twitter, Mail,
    Plus, Minus, User, LogOut, MessageCircle, Send,
    Zap, Shield, Heart, Leaf, Timer, Utensils, TrendingDown, Bell, LogIn, Check
} from 'lucide-react'
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth'
import { getDatabase, ref, push, onValue, set, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

// --- FIREBASE CONFIG (Injected or Default) ---
const firebaseConfig = {
    apiKey: "AIzaSyCO108yOR4W1zOg8LpkuDLBAxzZI-g3Jrc",
    authDomain: "studio-4253358477-d0c2f.firebaseapp.com",
    projectId: "studio-4253358477-d0c2f",
    storageBucket: "studio-4253358477-d0c2f.firebasestorage.app",
    messagingSenderId: "644423854949",
    appId: "1:644423854949:web:ef69ff5d3ee83984ed4f8c"
};

// Initialize Firebase
let app;
let auth: any;
let db: any;

try {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    auth = getAuth(app);
    db = getDatabase(app);
} catch (e) {
    console.error("Firebase Init Error:", e);
}

const iconMap: Record<string, any> = {
    Zap, Shield, Heart, Leaf, MessageCircle
}

interface SiteContentProps {
    content: GeneratedSiteContent
    subdomain: string
}

export function SiteContent({ content, subdomain }: SiteContentProps) {
    const [lang, setLang] = useState<'uz' | 'ru' | 'en'>('uz')
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
    const [user, setUser] = useState<any>(null) // Firebase User
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // --- AUTH LISTENER ---
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u)
                setIsLoggedIn(true)
            } else {
                setUser(null)
                setIsLoggedIn(false)
            }
        })
        return () => unsubscribe()
    }, [])

    const handleAuth = async () => {
        setLoading(true)
        setError('')
        try {
            if (authMode === 'login') {
                await signInWithEmailAndPassword(auth, email, password)
            } else {
                const res = await createUserWithEmailAndPassword(auth, email, password)
                if (name) await updateProfile(res.user, { displayName: name })

                // Create User Record in DB
                const userRef = ref(db, `users/${res.user.uid}`)
                await set(userRef, {
                    name: name || 'User',
                    email: email,
                    createdAt: serverTimestamp(),
                    calories: 2000,
                    role: 'client'
                })
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        signOut(auth)
    }

    // --- CHAT STATE ---
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [chatMessage, setChatMessage] = useState('')
    const [messages, setMessages] = useState<any[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)

    // --- CHAT LISTENER ---
    useEffect(() => {
        if (!db) return;
        // Scope chat to subdomain if needed, or global for demo
        const chatRef = query(ref(db, `chat/${subdomain || 'global'}`), limitToLast(50))

        const unsubscribe = onValue(chatRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const list = Object.entries(data).map(([id, val]: any) => ({
                    id,
                    ...val,
                    // Convert timestamp to readable time if needed
                    time: new Date(val.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }))
                setMessages(list)
                setTimeout(() => {
                    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
                }, 100)
            }
        })
        return () => unsubscribe()
    }, [subdomain])

    const sendMessage = async () => {
        if (!chatMessage.trim()) return

        // Allow anon chat or require login?
        // For MVP, require name or use 'Guest'
        const senderName = user?.displayName || 'Guest'
        const senderId = user?.uid || 'anon'

        const msg = {
            text: chatMessage,
            sender: senderId === user?.uid ? 'me' : 'other', // logic for local display
            senderName,
            senderId,
            timestamp: serverTimestamp()
        }

        // Push to DB
        await push(ref(db, `chat/${subdomain || 'global'}`), msg)
        setChatMessage('')
    }

    // --- DASHBOARD DATA LISTENER ---
    const [clientData, setClientData] = useState<any>({
        name: 'Guest',
        plan: 'Free',
        ordersCount: 0,
        caloriesGoal: 2000,
        todayMenu: [],
        createdAt: new Date()
    })

    useEffect(() => {
        if (!user || !db) return;
        const userRef = ref(db, `users/${user.uid}`)
        const unsubscribe = onValue(userRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                setClientData({
                    ...data,
                    plan: data.plan || 'Free', // Defaults
                    todayMenu: data.todayMenu || [], // Real data only
                    createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
                })
            }
        })
        return () => unsubscribe()
    }, [user])

    const calorieMathResult = 2000 - ((clientData.ordersCount || 0) * 500) // Mock math
    const t = (obj: any) => obj ? obj[lang] : ''
    const showDiscount = false // Simplify for now or check date

    return (
        <div className="min-h-screen flex flex-col font-sans">
            {/* Navbar */}
            <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container flex h-16 items-center justify-between">
                    <div className="font-bold text-xl uppercase tracking-wider flex items-center gap-2">
                        {subdomain}
                        {isLoggedIn && <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">Client Portal</Badge>}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                            {(['uz', 'ru', 'en'] as const).map((l) => (
                                <Button
                                    key={l}
                                    variant={lang === l ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setLang(l)}
                                    className="uppercase text-xs w-8 h-8 p-0"
                                >
                                    {l}
                                </Button>
                            ))}
                        </div>

                        {/* Top Connect Button (User req) */}
                        <a href="tel:998977087373" className="hidden md:flex">
                            <Button size="sm" variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                                <Phone className="w-4 h-4 mr-2" />
                                {t({ uz: 'Bog\'lanish', ru: 'Связаться', en: 'Connect' })}
                            </Button>
                        </a>

                        {/* Auth Modal Trigger */}
                        {isLoggedIn ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium hidden md:block">{user?.displayName || 'Client'}</span>
                                <Button variant="outline" size="sm" onClick={handleLogout}>
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button variant="default" size="sm" onClick={() => setIsAuthModalOpen(true)}>
                                <LogIn className="w-4 h-4 mr-2" />
                                {t({ uz: 'Kirish', ru: 'Войти', en: 'Login' })}
                            </Button>
                        )}
                    </div>
                </div>
            </nav>

            {/* AUTH MODAL */}
            {isAuthModalOpen && !isLoggedIn && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md shadow-2xl relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() => setIsAuthModalOpen(false)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                        <CardHeader>
                            <CardTitle className="text-2xl text-center">
                                {authMode === 'login' ? t({ uz: 'Kirish', ru: 'Вход', en: 'Login' }) : t({ uz: 'Ro\'yxatdan o\'tish', ru: 'Регистрация', en: 'Sign Up' })}
                            </CardTitle>
                            <CardDescription className="text-center">
                                {t({ uz: 'Davom etish uchun hisobingizga kiring', ru: 'Войдите в аккаунт', en: 'Access your client portal' })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

                            {authMode === 'signup' && (
                                <Input
                                    placeholder={t({ uz: 'Ism', ru: 'Имя', en: 'Full Name' })}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            )}
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Input
                                type="password"
                                placeholder={t({ uz: 'Parol', ru: 'Пароль', en: 'Password' })}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleAuth} disabled={loading}>
                                {loading && <Timer className="w-4 h-4 mr-2 animate-spin" />}
                                {authMode === 'login' ? t({ uz: 'Kirish', ru: 'Войти', en: 'Sign In' }) : t({ uz: 'Yaratish', ru: 'Создать', en: 'Create Account' })}
                            </Button>

                            <div className="text-center text-sm text-muted-foreground cursor-pointer hover:underline" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
                                {authMode === 'login' ? t({ uz: 'Hisobingiz yo\'qmi? Ro\'yxatdan o\'ting', ru: 'Нет аккаунта? Регистрация', en: "Don't have an account? Sign up" }) : t({ uz: 'Hisobingiz bormi? Kirish', ru: 'Есть аккаунт? Войти', en: 'Already have an account? Login' })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* MAIN CONTENT Area */}
            {isLoggedIn ? (
                // --- CLIENT DASHBOARD ---
                <main className="flex-1 bg-slate-50 py-8">
                    <div className="container">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-slate-800">
                                {t({ uz: 'Salom', ru: 'Привет', en: 'Hello' })}, {clientData.name}!
                            </h1>
                            <p className="text-slate-500">
                                {t({ uz: 'Xush kelibsiz', ru: 'Добро пожаловать', en: 'Welcome back' })}
                            </p>
                        </div>

                        {/* Discount Banner (30 days logic) */}
                        {showDiscount && (
                            <div className="mb-8 p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl text-white shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-20"><Zap className="w-32 h-32" /></div>
                                <h2 className="text-2xl font-bold mb-2">
                                    {t({ uz: 'Siz uchun Maxsus Taklif!', ru: 'Специальное предложение!', en: 'Special Offer for You!' })}
                                </h2>
                                <p className="text-lg opacity-90 mb-4">
                                    {t({ uz: '30 kunlik yubiley munosabati bilan - 50% Chegirma!', ru: 'В честь 30 дней с нами - Скидка 50%!', en: 'To celebrate 30 days with us - 50% Discount!' })}
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
                                        <Timer className="w-5 h-5" />
                                        <span className="font-mono font-bold">29:23:59:12</span>
                                    </div>
                                    <a href="tel:998977087373">
                                        <Button variant="secondary" className="font-bold shadow-md">
                                            {t({ uz: 'Hozir Sotib Olish', ru: 'Купить Сейчас', en: 'Buy Now' })}
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Stats Cards */}
                            <Card>
                                <CardHeader className="pb-2 text-xs font-semibold text-muted-foreground uppercase">
                                    {t({ uz: 'Joriy Reja', ru: 'Текущий Тариф', en: 'Current Plan' })}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold text-green-600">{clientData.plan}</div>
                                    <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                        <Timer className="w-3 h-3" />
                                        {Math.floor((clientData.planExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} {t({ uz: 'kun qoldi', ru: 'дней осталось', en: 'days left' })}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2 text-xs font-semibold text-muted-foreground uppercase">
                                    {t({ uz: 'Buyurtma Holati', ru: 'Статус Заказа', en: 'Order Status' })}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold text-blue-600 flex items-center gap-2">
                                        {clientData.orderStatus === 'ON_WAY' && <><Timer className="w-5 h-5 animate-pulse" /> On Way</>}
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1">
                                        {t({ uz: 'Yetkazib berish vaqti:', ru: 'Время доставки:', en: 'ETA:' })} {clientData.deliveryTime}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2 text-xs font-semibold text-muted-foreground uppercase">
                                    {t({ uz: 'Kaloriyalar (Formula)', ru: 'Калории (Формула)', en: 'Calories (Formula)' })}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold text-orange-600 flex items-center gap-2">
                                        <TrendingDown className="w-5 h-5" />
                                        {calorieMathResult}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1 leading-tight">
                                        {t({ uz: 'Formula: Goal - (Count * 5)', ru: 'Формула: Goal - (Count * 5)', en: 'Formula: Goal - (Count * 5)' })}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2 text-xs font-semibold text-muted-foreground uppercase">
                                    {t({ uz: 'Bugungi Menyu', ru: 'Сегодня в меню', en: "Today's Menu" })}
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm space-y-1">
                                        {clientData.todayMenu.map((item, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </main>
            ) : (
                // --- LANDING PAGE ---
                <divWrapper>
                    {/* Hero */}
                    <section className="py-24 lg:py-32 bg-muted/50 relative overflow-hidden">
                        <div className="container text-center max-w-3xl relative z-10">
                            <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 pb-2">
                                {t(content.hero.title)}
                            </h1>
                            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                                {t(content.hero.subtitle)}
                            </p>
                            <div className="flex justify-center gap-4 flex-wrap">
                                <a href="tel:998977087373">
                                    <Button size="lg" className="text-lg px-8 h-14 rounded-full shadow-lg hover:shadow-xl transition-all">
                                        <Phone className="w-5 h-5 mr-2" />
                                        {t(content.hero.cta)}
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* Features */}
                    <section className="py-24">
                        <div className="container">
                            <div className="grid md:grid-cols-3 gap-8">
                                {content.features.map((feature, i) => {
                                    const Icon = iconMap[feature.icon] || Zap
                                    return (
                                        <Card key={i} className="border-none shadow-lg bg-white hover:-translate-y-1 transition-transform duration-300">
                                            <CardHeader>
                                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                                    <Icon className="w-7 h-7" />
                                                </div>
                                                <CardTitle className="text-xl">{t(feature.title)}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground leading-relaxed">{t(feature.description)}</p>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Pricing */}
                    <section className="py-24 bg-slate-50">
                        <div className="container">
                            <h2 className="text-4xl font-bold text-center mb-16">
                                {lang === 'uz' ? 'Narxlar rejasi' : lang === 'ru' ? 'Тарифные планы' : 'Pricing Plans'}
                            </h2>
                            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                                {content.pricing.map((plan, i) => (
                                    <Card key={i} className="flex flex-col border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl relative overflow-hidden bg-white">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                                        <CardHeader className="pb-8">
                                            <CardTitle className="text-2xl">{t(plan.name)}</CardTitle>
                                            <div className="text-4xl font-extrabold mt-4 text-slate-800">{plan.price}</div>
                                            <CardDescription className="mt-2">PER MONTH</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <ul className="space-y-4">
                                                {plan.features.map((feat, j) => (
                                                    <li key={j} className="flex items-start gap-3 text-slate-600">
                                                        <div className="mt-1 bg-green-100 p-1 rounded-full"><Check className="w-3 h-3 text-green-600" /></div>
                                                        <span className="text-sm">{t(feat)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter className="pt-8">
                                            <a href="tel:998977087373" className="w-full">
                                                <Button className="w-full h-12 text-base font-medium shadow-md">
                                                    {lang === 'uz' ? 'Tanlash' : lang === 'ru' ? 'Выбрать' : 'Select Plan'}
                                                </Button>
                                            </a>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* About */}
                    <section className="py-24">
                        <div className="container max-w-4xl text-center">
                            <h2 className="text-3xl font-bold mb-8">{t(content.about.title)}</h2>
                            <p className="text-lg text-muted-foreground leading-loose">
                                {t(content.about.description)}
                            </p>
                        </div>
                    </section>
                </divWrapper>
            )}

            {/* CHAT WIDGET - Only showing if explicitly requested or logged in (simulated) */}
            {(content.chatEnabled || isLoggedIn) && (
                <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isChatOpen ? 'w-80 sm:w-96' : 'w-auto'}`}>
                    <div className="relative">
                        {isChatOpen ? (
                            <Card className="shadow-2xl border-primary/20">
                                <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-xl flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MessageCircle className="w-5 h-5" />
                                        <span className="font-bold">Community Chat</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => setIsChatOpen(false)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <ScrollArea className="h-80 p-4 bg-slate-50">
                                        <div className="space-y-4">
                                            {messages.map((msg) => (
                                                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.sender === 'me' ? 'bg-primary text-white rounded-tr-none' : 'bg-white border shadow-sm rounded-tl-none'}`}>
                                                        <p className="text-sm">{msg.text}</p>
                                                        <p className={`text-[10px] mt-1 ${msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-slate-400'}`}>{msg.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                    <div className="p-3 border-t bg-white flex gap-2">
                                        <Input
                                            placeholder="Type a message..."
                                            value={chatMessage}
                                            onChange={(e) => setChatMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                            className="border-slate-200 focus-visible:ring-primary"
                                        />
                                        <Button size="icon" onClick={sendMessage} className="shrink-0 bg-primary hover:bg-primary/90">
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Button
                                size="lg"
                                className="h-14 w-14 rounded-full shadow-xl bg-gradient-to-tr from-primary to-purple-600 hover:scale-110 transition-transform"
                                onClick={() => setIsChatOpen(true)}
                            >
                                <MessageCircle className="w-7 h-7" />
                                {/* Notification Badge */}
                                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
            {!isLoggedIn && (
                <footer className="py-8 border-t mt-auto bg-slate-50">
                    <div className="container text-center text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} {subdomain}. Powered by AutoFood.
                    </div>
                </footer>
            )}
        </div>
    )
}

const divWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>
