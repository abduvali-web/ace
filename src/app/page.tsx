'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Phone, Shield, Zap, Globe, Star } from 'lucide-react'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

export default function LandingPage() {
    const { t } = useLanguage()

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5
            }
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground overflow-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-lg">A</span>
                            </div>
                            <span className="font-bold text-xl tracking-tight">AutoFood</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <LanguageSwitcher />
                            <Link href="/login">
                                <Button variant="ghost" className="font-medium">
                                    {t.common.login}
                                </Button>
                            </Link>
                            <Link href="tel:+998977087373">
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25">
                                    <Phone className="w-4 h-4 mr-2" />
                                    Bog'lanish
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-50" />
                    <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] opacity-30" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="max-w-4xl mx-auto"
                    >
                        <motion.div variants={itemVariants} className="mb-6 flex justify-center">
                            <Badge variant="outline" className="px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full">
                                <Star className="w-3.5 h-3.5 mr-2 fill-primary" />
                                O'zbekistonda #1 Yetkazib Berish Tizimi
                            </Badge>
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-gradient">
                            Biznesingizni <br />
                            <span className="text-primary">Avtomatlashtiring</span>
                        </motion.h1>

                        <motion.p variants={itemVariants} className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                            Restoran va yetkazib berish xizmatlari uchun mukammal yechim.
                            Buyurtmalarni boshqaring, kuryerlarni kuzating va daromadingizni oshiring.
                        </motion.p>

                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/login" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full h-14 text-lg px-8 rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105">
                                    Tizimga Kirish
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Link href="tel:+998977087373" className="w-full sm:w-auto">
                                <Button size="lg" variant="outline" className="w-full h-14 text-lg px-8 rounded-full border-2 hover:bg-secondary/50 transition-all">
                                    <Phone className="mr-2 w-5 h-5" />
                                    +998 97 708 73 73
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-secondary/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Zap,
                                title: "Tezkor Ishlash",
                                desc: "Buyurtmalarni soniyalar ichida qabul qiling va kuryerlarga yo'naltiring."
                            },
                            {
                                icon: Shield,
                                title: "Xavfsiz Tizim",
                                desc: "Ma'lumotlaringiz himoyalangan va har doim zaxira nusxasi olinadi."
                            },
                            {
                                icon: Globe,
                                title: "Har Joyda",
                                desc: "Telefon, planshet yoki kompyuter orqali biznesingizni boshqaring."
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className="h-full glass-card border-none shadow-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <CardHeader>
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
                                            <feature.icon className="w-6 h-6" />
                                        </div>
                                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                                        <CardDescription className="text-base mt-2">{feature.desc}</CardDescription>
                                    </CardHeader>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Qulay Narxlar</h2>
                        <p className="text-xl text-muted-foreground">Biznesingiz hajbiga mos keladigan tarifni tanlang</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* 1 Month Plan */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <Card className="h-full glass-card border-none hover:border-primary/50 transition-all duration-300 shadow-xl">
                                <CardHeader className="text-center pb-2">
                                    <CardTitle className="text-2xl font-medium text-muted-foreground">1 Oy</CardTitle>
                                    <div className="flex items-baseline justify-center mt-4">
                                        <span className="text-5xl font-bold">$100</span>
                                        <span className="text-muted-foreground ml-2">/ oyiga</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    <ul className="space-y-4">
                                        {[
                                            "Barcha funksiyalar",
                                            "Cheksiz buyurtmalar",
                                            "24/7 Texnik yordam",
                                            "Kuryer ilovasi",
                                            "Admin paneli"
                                        ].map((feature, i) => (
                                            <li key={i} className="flex items-center">
                                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Link href="tel:+998977087373" className="w-full">
                                        <Button className="w-full h-12 text-lg" variant="outline">
                                            Tanlash
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        </motion.div>

                        {/* 3 Months Plan */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <Card className="h-full glass-card border-2 border-primary shadow-2xl relative overflow-hidden bg-primary/5">
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                                    ENG MASHHUR
                                </div>
                                <CardHeader className="text-center pb-2">
                                    <CardTitle className="text-2xl font-medium text-primary">3 Oy</CardTitle>
                                    <div className="flex items-baseline justify-center mt-4">
                                        <span className="text-5xl font-bold">$200</span>
                                        <span className="text-muted-foreground ml-2">/ jami</span>
                                    </div>
                                    <p className="text-sm text-green-600 font-medium mt-2">33% Tejang</p>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    <ul className="space-y-4">
                                        {[
                                            "Barcha funksiyalar",
                                            "Cheksiz buyurtmalar",
                                            "24/7 Texnik yordam",
                                            "Kuryer ilovasi",
                                            "Admin paneli",
                                            "Premium sozlamalar"
                                        ].map((feature, i) => (
                                            <li key={i} className="flex items-center">
                                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-3">
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="font-medium">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Link href="tel:+998977087373" className="w-full">
                                        <Button className="w-full h-12 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                            Hoziroq Ulanish
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-20 bg-slate-900 text-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Savollaringiz bormi?</h2>
                    <p className="text-xl text-slate-300 mb-10">
                        Bizning mutaxassislarimiz sizga yordam berishga tayyor.
                        Hoziroq qo'ng'iroq qiling va bepul konsultatsiya oling.
                    </p>
                    <Link href="tel:+998977087373">
                        <Button size="lg" className="h-16 px-10 text-xl rounded-full bg-white text-slate-900 hover:bg-slate-100">
                            <Phone className="mr-3 w-6 h-6" />
                            +998 97 708 73 73
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-border">
                <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground text-sm">
                    <p>&copy; {new Date().getFullYear()} AutoFood. Barcha huquqlar himoyalangan.</p>
                </div>
            </footer>
        </div>
    )
}
