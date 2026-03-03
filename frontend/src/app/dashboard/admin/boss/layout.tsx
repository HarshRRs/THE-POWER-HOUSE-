"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
    { href: "/dashboard/admin/boss", icon: "⚡", label: "Dashboard" },
    { href: "/dashboard/admin/boss/prefectures", icon: "🏛️", label: "Préfectures" },
    { href: "/dashboard/admin/boss/consulat", icon: "🇮🇳", label: "Consulat Inde" },
    { href: "/dashboard/admin/boss/clients", icon: "👥", label: "Clients" },
    { href: "/dashboard/admin/boss/alertes", icon: "💬", label: "Alertes WhatsApp" },
];

export default function BossLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#F0F7FF] flex">
            {/* ─── SIDEBAR ─── */}
            <aside
                className={`
          fixed inset-y-0 left-0 z-50 w-60 bg-white shadow-xl flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:shadow-none md:border-r md:border-sky-100
        `}
            >
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-5 border-b border-sky-100">
                    <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-200">
                        ⚡
                    </div>
                    <div>
                        <p className="text-sm font-black text-gray-900 leading-none">RDV Priority</p>
                        <p className="text-[10px] text-sky-500 font-semibold mt-0.5">Boss Panel</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 space-y-1 px-3">
                    {NAV_ITEMS.map((item) => {
                        const active =
                            pathname === item.href ||
                            (item.href !== "/dashboard/admin/boss" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold
                  transition-all duration-200 group
                  ${active
                                        ? "bg-sky-500 text-white shadow-lg shadow-sky-200"
                                        : "text-gray-500 hover:bg-sky-50 hover:text-sky-600"
                                    }
                `}
                            >
                                <span className="text-base">{item.icon}</span>
                                <span>{item.label}</span>
                                {active && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Server Status */}
                <div className="p-4 border-t border-sky-50">
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-semibold text-green-700">Serveur en ligne</span>
                    </div>
                    <Link
                        href="/dashboard/admin"
                        className="mt-2 flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ← Retour Admin
                    </Link>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ─── MAIN CONTENT ─── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-sky-100 flex items-center justify-between px-6 sticky top-0 z-30">
                    <button
                        className="md:hidden p-2 text-gray-500 hover:text-sky-500"
                        onClick={() => setSidebarOpen(true)}
                    >
                        ☰
                    </button>
                    <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
                        <Link href="/dashboard/admin" className="hover:text-sky-500">Admin</Link>
                        <span>/</span>
                        <span className="text-sky-600 font-semibold">Boss Panel</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                            <span className="text-xs font-semibold text-sky-600">Surveillance Active</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
