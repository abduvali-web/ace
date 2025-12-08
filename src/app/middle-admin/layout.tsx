
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MiddleAdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session || !session.user || (session.user.role !== "MIDDLE_ADMIN" && session.user.role !== "SUPER_ADMIN")) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b bg-white p-4 flex gap-4 items-center">
                <h1 className="font-bold text-xl">Middle Admin</h1>
                <nav className="flex gap-2">
                    <Link href="/middle-admin/menu">
                        <Button variant="ghost">Daily Menu</Button>
                    </Link>
                    <Link href="/middle-admin/sklad">
                        <Button variant="ghost">Sklad (Warehouse)</Button>
                    </Link>
                    <Link href="/middle-admin/clients">
                        <Button variant="ghost">Clients</Button>
                    </Link>
                </nav>
                <div className="ml-auto">
                    {session.user.name}
                </div>
            </header>
            <main className="flex-1 p-6 bg-slate-50">
                {children}
            </main>
        </div>
    )
}
