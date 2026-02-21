"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import { useWebSocket } from "@/hooks/useWebSocket";
import CountdownTimer from "@/components/CountdownTimer";
import VerificationBanner from "@/components/VerificationBanner";

const PLAN_LABELS: Record<string, string> = {
    URGENCE_24H: "Urgence 24h",
    URGENCE_7J: "Urgence 7j",
    URGENCE_TOTAL: "Urgence Totale",
    FREE: "Essai gratuit",
};

const navItems = [
    { href: "/dashboard", icon: "📊", label: "Tableau de bord" },
    { href: "/dashboard/alerts", icon: "🚨", label: "Alertes" },
    { href: "/dashboard/prefectures", icon: "🏛️", label: "Prefectures" },
    { href: "/dashboard/billing", icon: "💳", label: "Abonnement" },
    { href: "/dashboard/settings", icon: "⚙️", label: "Reglages" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const { notificationCount, notifications, isConnected } = useWebSocket(isAuthenticated);
    const [showNotifications, setShowNotifications] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-sm text-gray-500 font-semibold">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) return null;

    const planLabel = PLAN_LABELS[user.plan] || user.plan;
    const isAdmin = user.role === "ADMIN";

    // Build nav items including admin link for admin users
    const allNavItems = isAdmin
        ? [...navItems, { href: "/dashboard/admin", icon: "🔐", label: "Admin" }]
        : navItems;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="tricolor-bar w-full flex-shrink-0" />

            {/* Email verification banner */}
            {user.emailVerified === false && <VerificationBanner />}

            {/* Top Header */}
            <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Link href="/dashboard" className="text-lg font-extrabold text-primary">RDV<span className="text-accent">Priority</span></Link>
                        <span className="emergency-badge px-2 py-0.5 rounded-full text-[10px] font-bold hidden sm:inline-flex">{planLabel}</span>
                        {isAdmin && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">ADMIN</span>}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Surveillance Status */}
                        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-success animate-pulse-slow" : "bg-gray-400"}`} />
                            <span className={isConnected ? "text-success" : "text-gray-400"}>
                                {isConnected ? "Surveillance active" : "Deconnecte"}
                            </span>
                        </div>

                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors touch-target"
                            >
                                <span className="text-xl">🔔</span>
                                {notificationCount > 0 && (
                                    <span className="absolute top-1 right-1 bg-accent text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] animate-urgent-blink">
                                        {notificationCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-2xl card-shadow border border-gray-100 z-50 max-h-80 overflow-y-auto">
                                    <div className="p-3 border-b border-gray-100">
                                        <h3 className="text-xs font-black text-gray-900 uppercase">Notifications ({notificationCount})</h3>
                                    </div>
                                    {notifications.length === 0 ? (
                                        <p className="text-xs text-gray-400 p-4 text-center">Aucune notification pour le moment</p>
                                    ) : (
                                        notifications.slice(0, 10).map((n, i) => (
                                            <div key={i} className="p-3 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100">
                                                <p className="text-xs font-bold text-accent">{n.slotsAvailable} creneau(x)</p>
                                                <p className="text-xs text-gray-600">{n.prefectureName} ({n.department})</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User avatar */}
                        <button onClick={logout} className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center text-sm font-bold hover:opacity-90 active:scale-95 transition-all touch-target" title="Deconnexion">
                            {user.email[0].toUpperCase()}
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex max-w-7xl mx-auto w-full">
                {/* Sidebar — desktop */}
                <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 py-6 px-4 flex-shrink-0">
                    <nav className="space-y-1 flex-1">
                        {allNavItems.map((item) => {
                            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                            return (
                                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${active ? "bg-primary-light text-primary" : "text-gray-600 hover:bg-gray-50"}`}>
                                    <span className="text-base">{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-6 bg-gray-50 rounded-xl p-4">
                        <CountdownTimer expiresAt={user.planExpiresAt} />
                        <Link href="/dashboard/billing" className="mt-3 w-full gradient-urgent text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                            Upgrader
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-6 pb-28 md:pb-6">
                    {children}
                </main>
            </div>

            {/* Bottom Nav — Mobile (Premium) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className={`grid ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'} h-[68px]`}>
                    {allNavItems.map((item) => {
                        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all duration-200 relative ${active ? "text-primary" : "text-gray-400"}`}>
                                <span className={`text-[22px] transition-transform duration-200 ${active ? "scale-110" : ""}`}>{item.icon}</span>
                                <span className={active ? "font-bold" : ""}>{item.label.split(" ")[0]}</span>
                                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] bg-primary rounded-full" />}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
