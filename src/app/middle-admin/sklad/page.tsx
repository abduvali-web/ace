
import { db } from "@/lib/db";
import { format } from "date-fns";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function SkladPage({ searchParams }: { searchParams: { date?: string } }) {
    // Default to TOMORROW if no date specified, to show "Production Plan"
    const rawDate = searchParams.date ? new Date(searchParams.date) : new Date(new Date().getTime() + 86400000);

    // Normalize Date to Midnight
    const date = new Date(rawDate);
    date.setHours(0, 0, 0, 0);

    // 1. Get Active Customers and Group by Calories
    // Note: Schema has `calories` on Customer.
    const customers = await db.customer.findMany({
        where: {
            isActive: true,
            // Add date filter to ensure they have an order for this day?
            // "Sklad" usually means *production* requirement.
            // Production depends on ORDERS.
            // If we use `autoOrdersEnabled`, assume they get food.
            // OR check `Order` table for that deliveryDate.
            // Let's use `Order` table for accuracy.
        },
        include: {
            orders: {
                where: {
                    deliveryDate: {
                        gte: date,
                        lt: new Date(date.getTime() + 86400000)
                    }
                }
            }
        }
    });

    // Actually, querying Customers and filtering sub-orders is inefficient if we only want Orders.
    // Better: Query Orders.
    const orders = await db.order.findMany({
        where: {
            deliveryDate: {
                gte: date,
                lt: new Date(date.getTime() + 86400000)
            }
        },
        include: {
            customer: { select: { calories: true } }
        }
    });

    // 2. Count Plans
    const planCounts: Record<string, number> = {
        '1000-1200': 0,
        '1400-1600': 0,
        '1800-2000': 0,
        '2200-2500': 0
    };

    for (const order of orders) {
        const cals = order.calories || order.customer.calories || 1200;
        let group = '1000-1200';
        if (cals >= 2100) group = '2200-2500';
        else if (cals >= 1700) group = '1800-2000';
        else if (cals >= 1300) group = '1400-1600';

        planCounts[group] = (planCounts[group] || 0) + 1;
    }

    // 3. Get Menus for these groups
    const distinctGroups = Object.keys(planCounts).filter(k => planCounts[k] > 0);

    const menus = await db.dailyMenu.findMany({
        where: {
            date: date,
            calorieGroup: { in: distinctGroups }
        },
        include: {
            menuItems: {
                include: {
                    ingredients: true
                }
            }
        }
    });

    // 4. Aggregate Ingredients
    const totalIngredients: Record<string, { name: string, quantity: number, unit: string }> = {};

    for (const menu of menus) {
        const multiplier = planCounts[menu.calorieGroup] || 0;
        if (multiplier === 0) continue;

        for (const item of menu.menuItems) {
            for (const ingRef of item.ingredients) {
                // quantityRequired is per item. 
                // We need the Ingredient Name.
                // The `include: { ingredients: true }` above includes `MenuItemIngredient`. 
                // We need to fetch the actual Ingredient name too? 
                // Standard Prisma: include: { menuItems: { include: { ingredients: { include: { ingredient: true } } } } }
            }
        }
    }

    // Better fetch:
    const menusDeep = await db.dailyMenu.findMany({
        where: {
            date: date,
            calorieGroup: { in: distinctGroups }
        },
        include: {
            menuItems: {
                include: {
                    ingredients: {
                        include: {
                            ingredient: true
                        }
                    }
                }
            }
        }
    });

    for (const menu of menusDeep) {
        const multiplier = planCounts[menu.calorieGroup] || 0;
        for (const item of menu.menuItems) {
            for (const ingRef of item.ingredients) {
                const name = ingRef.ingredient.name;
                const unit = ingRef.ingredient.unit || 'kg';
                const qty = ingRef.quantityRequired * multiplier;

                if (!totalIngredients[name]) {
                    totalIngredients[name] = { name, quantity: 0, unit };
                }
                totalIngredients[name].quantity += qty;
            }
        }
    }

    const report = Object.values(totalIngredients).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Kitchen Stock Requirements: {format(date, "PPP")}</h1>
                <div className="flex gap-2">
                    <Link href={`?date=${new Date(date.getTime() - 86400000).toISOString()}`}>
                        <Button variant="outline">Previous Day</Button>
                    </Link>
                    <Link href={`?date=${new Date(date.getTime() + 86400000).toISOString()}`}>
                        <Button variant="outline">Next Day</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
                {Object.entries(planCounts).map(([k, v]) => (
                    <div key={k} className="bg-white p-4 rounded shadow text-center">
                        <div className="font-bold text-lg">{v}</div>
                        <div className="text-gray-500 text-sm">{k} Orders</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ingredient</TableHead>
                            <TableHead className="text-right">Total Quantity</TableHead>
                            <TableHead className="text-right">Unit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {report.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-4">No orders or menu data found.</TableCell>
                            </TableRow>
                        ) : (
                            report.map((row) => (
                                <TableRow key={row.name}>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell className="text-right">{row.quantity.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{row.unit}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
