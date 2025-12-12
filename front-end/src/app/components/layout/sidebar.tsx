"use client";

import Link from "next/link";
import { Home, BarChart2, Newspaper, Star, Settings } from "lucide-react";

export default function Sidebar({ isOpen, currentHref }: { isOpen: boolean; currentHref: string }) {
    const currentPath = currentHref || "/";

    const items: { href: string; label: string; Icon: any }[] = [
        { href: "/dashboard", label: "Dashboard", Icon: Home },
        { href: "/portfolio", label: "Portfolio", Icon: BarChart2 },
        { href: "/news", label: "Market News", Icon: Newspaper },
        { href: "/analytics", label: "Analytics", Icon: Star },
        { href: "/settings", label: "Settings", Icon: Settings },
    ];

    const isActive = (href: string) => {
        if (href === "/") return currentPath === "/";
        return currentPath === href || currentPath.startsWith(href + "/");
    };

    return (
        <aside
            className={`
                fixed
                top-16
                left-0
                bottom-0
                w-64
                bg-white/80
                dark:bg-slate-900/80
                backdrop-blur-sm
                border-r
                border-slate-200
                dark:border-slate-700
                transition-transform transform
                z-40
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0
                overflow-y-auto
            `}
        >
            <nav className="px-4 py-4">
                <div className="space-y-2">
                    {items.map(({ href, label, Icon }) => {
                        const active = isActive(href);

                        const base = "flex items-center px-3 py-2 text-sm font-medium rounded-lg";

                        const activeClasses = "bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 text-green-700 dark:text-green-300";

                        const inactiveClasses = "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";

                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-current={active ? "page" : undefined}
                                className={`${base} ${active ? activeClasses : inactiveClasses}`}
                            >
                                <Icon className="h-5 w-5 mr-3" />
                                {label}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </aside>
    );
}