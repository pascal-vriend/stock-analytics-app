"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/lib/useApi";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useEffect, useState } from "react";
import { StockCard } from "@/components/cards/stockInfo";

type Holding = {
    symbol: string;
    quantity: number;
    averagePrice: number;
};

type PriceData = {
    symbol: string;
    current: number;
    change: number;
    percent: number;
};

export default function Dashboard() {
    const { apiFetch } = useApi();
    const { userId } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [prices, setPrices] = useState<Record<string, PriceData>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;

        async function fetchHoldings() {
            setLoading(true);
            setError(null);

            try {
                const res = await apiFetch(`https://localhost:8080/portfolio/${userId}`);
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`API error ${res.status}: ${text}`);
                }

                const json = await res.json(); // Should match PortfolioResponse from backend
                if (!cancelled) {
                    setHoldings(json.holdings || []);
                    setLoading(false);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err?.message ?? "Failed to fetch portfolio");
                    setLoading(false);
                }
            }
        }

        fetchHoldings();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    useEffect(() => {
        if (holdings.length === 0) return;
        let cancelled = false;

        async function fetchPrices() {
            const newPrices: Record<string, PriceData> = {};
            await Promise.all(
                holdings.map(async (h) => {
                    try {
                        const res = await apiFetch(`https://localhost:8080/stocks/${h.symbol}`);
                        if (!res.ok) return;
                        const json = await res.json();
                        newPrices[h.symbol] = json;
                    } catch {}
                })
            );
            if (!cancelled) setPrices(newPrices);
        }

        fetchPrices();

        return () => {
            cancelled = true;
        };
    }, [holdings]);

    return (
        <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
            <Header
                onToggleSidebar={() => setSidebarOpen((s) => !s)}
                onAddStock={(symbol, quantity, buyPrice) => {
                    setHoldings((prev) => [
                        ...prev,
                        { symbol, quantity, averagePrice: buyPrice },
                    ]);
                }}
            />
            <Sidebar isOpen={sidebarOpen} currentHref="/dashboard" />

            <div
                className={`fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity duration-200 ${
                    sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setSidebarOpen(false)}
                aria-hidden={true}
            />

            <main
                className={`flex-1 p-6 pt-6 h-[calc(100vh-4rem)] flex flex-col transition-all duration-300
                    ${sidebarOpen ? "ml-64" : "ml-0"} lg:ml-64`}
            >
                <div className="overflow-auto flex-1 scrollbar-none">
                    {loading && <p>Loading portfolio...</p>}
                    {error && <p className="text-red-500">{error}</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {holdings.map((h) => (
                            <StockCard
                                key={h.symbol}
                                symbol={h.symbol}
                                companyName={h.symbol} // Optional: fetch real name from backend
                                priceData={prices[h.symbol] || null}
                                loading={!prices[h.symbol]}
                                error={!prices[h.symbol] ? "Failed to load price" : null}
                            />
                        ))}
                    </div>
                </div>
            </main>

            <style>{`
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
