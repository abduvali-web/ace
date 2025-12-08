
import { db } from "@/lib/db";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function MenuPage({ searchParams }: { searchParams: { date?: string, group?: string } }) {
    const rawDate = searchParams.date ? new Date(searchParams.date) : new Date();
    const group = searchParams.group || "1000-1200";

    // Normalize Date
    const date = new Date(rawDate);
    date.setHours(0, 0, 0, 0);

    // Fetch Menu
    const dailyMenu = await db.dailyMenu.findUnique({
        where: {
            date_calorieGroup: {
                date: date,
                calorieGroup: group
            }
        },
        include: {
            menuItems: {
                include: {
                    ingredients: {
                        include: { ingredient: true }
                    }
                }
            }
        }
    });

    const groups = ["1000-1200", "1400-1600", "1800-2000", "2200-2500"];

    return (
        <div className="space-y-8 container mx-auto max-w-7xl py-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
                        <UtensilsCrossed className="w-8 h-8 text-emerald-600" />
                        Daily Menu Planner
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {format(date, "PPPP")}
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-lg border shadow-sm">
                    <Link href={`?date=${new Date(date.getTime() - 86400000).toISOString()}&group=${group}`}>
                        <Button variant="ghost" size="icon" className="hover:text-emerald-600">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="font-semibold w-32 text-center tabular-nums">
                        {format(date, "MMM d")}
                    </div>
                    <Link href={`?date=${new Date(date.getTime() + 86400000).toISOString()}&group=${group}`}>
                        <Button variant="ghost" size="icon" className="hover:text-emerald-600">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Calorie Group Selector */}
            <div className="flex flex-wrap gap-3 pb-2 border-b">
                {groups.map(g => (
                    <Link key={g} href={`?date=${date.toISOString()}&group=${g}`}>
                        <Button
                            variant={group === g ? 'default' : 'outline'}
                            className={`rounded-full px-6 transition-all ${group === g
                                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md transform scale-105'
                                    : 'hover:border-emerald-200 hover:bg-emerald-50'
                                }`}
                        >
                            {g} kcal
                        </Button>
                    </Link>
                ))}
            </div>

            {/* Menu Grid */}
            <div className="min-h-[400px]">
                {!dailyMenu || dailyMenu.menuItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed rounded-xl bg-slate-50/50">
                        <UtensilsCrossed className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900">No Menu Planned</h3>
                        <p className="text-slate-500 max-w-sm text-center mt-2">
                            There are no meals scheduled for this calorie group on {format(date, "MMMM do")}.
                        </p>
                        <Button variant="outline" className="mt-6 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                            Create Menu for Today
                        </Button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dailyMenu.menuItems.map(item => (
                            <Card key={item.id} className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
                                {item.image ? (
                                    <div className="h-56 bg-cover bg-center relative group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url(${item.image})` }}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                        <div className="absolute bottom-4 left-4 right-4 text-white">
                                            <Badge className="bg-emerald-500/90 hover:bg-emerald-600 border-0 mb-2 backdrop-blur-sm">
                                                {item.calories} kcal
                                            </Badge>
                                            <h3 className="font-bold text-xl leading-tight text-shadow-sm">{item.name}</h3>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-56 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                        <UtensilsCrossed className="w-16 h-16 text-slate-300 group-hover:scale-110 transition-transform duration-300" />
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <Badge className="bg-slate-800 text-white border-0 mb-2">
                                                {item.calories} kcal
                                            </Badge>
                                            <h3 className="font-bold text-xl text-slate-800">{item.name}</h3>
                                        </div>
                                    </div>
                                )}

                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider text-xs">Ingredients</p>
                                            <div className="flex flex-wrap gap-2">
                                                {item.ingredients.map(ing => (
                                                    <span key={ing.id} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        {ing.ingredient.name}
                                                        <span className="ml-1 text-emerald-400">({ing.quantityRequired})</span>
                                                    </span>
                                                ))}
                                                {item.ingredients.length === 0 && (
                                                    <span className="text-sm text-slate-400 italic">No ingredients listed</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
