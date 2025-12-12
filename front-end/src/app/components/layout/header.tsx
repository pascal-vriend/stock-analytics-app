"use client";

import { useRouter } from "next/navigation";
import { Menu, Bell, Settings, ChartNoAxesCombined, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import AddStockModal from "@/components/windows/AddStockModal";
import { useState, useEffect, useRef, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import {useAuth} from "@/contexts/AuthContext"

export default function Header({
                                   onToggleSidebar,
                                   onAddStock,
                               }: {
    onToggleSidebar: () => void;
    onAddStock: (symbol: string, quantity: number, buyPrice: number) => void;
}) {
    const router = useRouter();
    const { apiFetch } = useApi();
    const { userId } = useAuth();
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLUListElement>(null);

    // Logout handler
    const handleLogout = useCallback(async () => {
        await fetch("https://localhost:8080/auth/logout", {
            method: "POST",
            credentials: "include",
        });
        router.push("/login");
    }, [router]);

    // Handle selecting a suggestion
    const handleSelectSuggestion = useCallback((symbol: string) => {
        setSelectedSymbol(symbol);
        setModalOpen(true);
        setQuery("");
        setShowSuggestions(false);
    }, []);

    // Handle confirm from modal
    const handleConfirmAdd = async (symbol: string, quantity: number, buyPrice: number) => {
        if (!userId) {
            console.error("No user ID found!");
            return;
        }

        try {
            const res = await apiFetch(
                `https://localhost:8080/portfolio/${userId}/holdings`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ symbol, quantity, buyPrice }),
                }
            );

            if (!res.ok) {
                console.error("Failed to add holding", await res.text());
                return;
            }

            const savedItem = await res.json();
            // Optionally update local state
            onAddStock(savedItem.symbol, savedItem.quantity, savedItem.buyPrice);

            setModalOpen(false);
            setSelectedSymbol(null);
        } catch (err) {
            console.error("Error adding holding:", err);
        }
    };


    // Fetch autocomplete suggestions with debounce
    useEffect(() => {
        if (!query) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const res = await apiFetch(`https://localhost:8080/search?query=${encodeURIComponent(query)}`, { method: "GET" });
                if (!res.ok) return;
                const json = await res.json();
                setSuggestions(json);
                setShowSuggestions(true);
            } catch (err) {
                console.error("Autocomplete error:", err);
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!dropdownRef.current?.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Left: Sidebar toggle + logo */}
                        <div className="flex items-center space-x-3">
                            <Button variant="ghost" size="sm" className="lg:hidden mr-2" onClick={onToggleSidebar}>
                                <Menu className="h-6 w-6" />
                            </Button>
                            <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                                    <ChartNoAxesCombined className="h-6 w-6 text-white" />
                                </div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Stock Analytics</h1>
                            </div>
                        </div>

                        {/* Middle: Search bar */}
                        <div className="flex-1 mx-4 max-w-md relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search stocks..."
                                className="w-full pl-10 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />

                            {showSuggestions && suggestions.length > 0 && (
                                <ul
                                    ref={dropdownRef}
                                    className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg max-h-60 overflow-auto shadow-lg"
                                >
                                    {suggestions.map((s) => (
                                        <li
                                            key={s.symbol}
                                            onClick={() => handleSelectSuggestion(s.symbol)}
                                            className="px-3 py-2 cursor-pointer hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600"
                                        >
                                            {s.symbol} - {s.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Right: Icons + Avatar */}
                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm">
                                <Bell className="h-5 w-5" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/settings")}>
                                <Settings className="h-5 w-5" />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Avatar className="h-8 w-8 cursor-pointer">
                                        <AvatarImage src="/placeholder.svg" />
                                        <AvatarFallback>YU</AvatarFallback>
                                    </Avatar>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={handleLogout}>
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </header>

            {/* Add Stock Modal */}
            {selectedSymbol && (
                <AddStockModal
                    symbol={selectedSymbol}
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onConfirm={handleConfirmAdd}
                />
            )}
        </>
    );
}
