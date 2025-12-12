"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useState, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from "recharts";

// Mock data generators
const portfolioTimeSeries = [
    { date: "2025-11-01", value: 10000 },
    { date: "2025-11-02", value: 10150 },
    { date: "2025-11-03", value: 10080 },
    { date: "2025-11-04", value: 10300 },
    { date: "2025-11-05", value: 10450 },
    { date: "2025-11-06", value: 10300 },
    { date: "2025-11-07", value: 10520 },
    { date: "2025-11-08", value: 10600 },
    { date: "2025-11-09", value: 10500 },
    { date: "2025-11-10", value: 10750 },
];

const holdingsMock = [
    { symbol: "AAPL", name: "Apple Inc.", qty: 10, price: 170, costBasis: 150 },
    { symbol: "TSLA", name: "Tesla, Inc.", qty: 5, price: 220, costBasis: 200 },
    { symbol: "MSFT", name: "Microsoft Corp.", qty: 8, price: 320, costBasis: 300 },
    { symbol: "AMZN", name: "Amazon.com, Inc.", qty: 2, price: 145, costBasis: 160 },
];

const COLORS = ["#4f46e5", "#06b6d4", "#16a34a", "#f59e0b", "#ef4444"];

export default function PortfolioPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [holdings, setHoldings] = useState(holdingsMock);

    // Derived numbers
    const summary = useMemo(() => {
        const totalValue = holdings.reduce((acc, h) => acc + h.qty * h.price, 0);
        const totalCost = holdings.reduce((acc, h) => acc + h.qty * h.costBasis, 0);
        const pnl = totalValue - totalCost;
        const pnlPct = totalCost === 0 ? 0 : (pnl / totalCost) * 100;
        return { totalValue, totalCost, pnl, pnlPct };
    }, [holdings]);

    const allocationData = useMemo(() => {
        return holdings.map((h) => ({ name: h.symbol, value: h.qty * h.price }));
    }, [holdings]);

    const dailyReturns = useMemo(() => {
        // simple daily returns mock from portfolioTimeSeries
        return portfolioTimeSeries.map((p) => ({ date: p.date, value: p.value }));
    }, []);

    return (
        <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
            <Header
                onToggleSidebar={() => setSidebarOpen((s) => !s)}
                onAddStock={(symbol: string) => {
                    // quick-add behaviour for demo: add as 1 share with mock price
                    setHoldings((s) => [...s, { symbol, name: symbol, qty: 1, price: 10, costBasis: 10 }]);
                }}
            />

            {/* Sidebar stays fixed (so it overlays on mobile) but the main content will shift using margin-left.
          - On lg screens we always reserve the sidebar width (ml-64).
          - On smaller screens we transition from ml-0 -> ml-64 when sidebarOpen is true, making the main move.
          This gives a smooth transition both when resizing and when toggling the sidebar on mobile. */}
            <Sidebar isOpen={sidebarOpen} currentHref="/portfolio" />

            <main
                className={`overflow-auto flex-1 scrollbar-none p-6 pt-20 h-[calc(100vh-4rem)] flex flex-col transition-all duration-300 ${
                    sidebarOpen ? "ml-64" : "ml-0"
                } lg:ml-64`}
            >
                {/* Top summary row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="text-sm text-slate-500 dark:text-slate-400">Total portfolio value</div>
                        <div className="mt-2 text-2xl font-bold">€{summary.totalValue.toLocaleString()}</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="text-sm text-slate-500 dark:text-slate-400">Profit / Loss</div>
                        <div className="mt-2 text-2xl font-bold">
                            {summary.pnl >= 0 ? "+" : "-"}€{Math.abs(summary.pnl).toLocaleString()} ({summary.pnlPct.toFixed(2)}%)
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="text-sm text-slate-500 dark:text-slate-400">Holdings</div>
                        <div className="mt-2 text-2xl font-bold">{holdings.length}</div>
                    </div>
                </div>

                {/* Main content area: charts + holdings */}
                <div className="flex-1 flex gap-6 overflow-hidden">
                    <div className="w-full lg:w-2/3 flex flex-col gap-6 overflow-hidden">
                        {/* Portfolio value time series */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex-1 overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold">Portfolio performance</h3>
                                <div className="text-sm text-slate-500">Last {dailyReturns.length} days</div>
                            </div>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dailyReturns}>
                                        <XAxis dataKey="date" hide />
                                        <YAxis hide />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bar chart: daily P/L (mocked) */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 overflow-hidden">
                            <h3 className="text-lg font-semibold mb-2">Daily P/L (mock)</h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyReturns}>
                                        <XAxis dataKey="date" hide />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#06b6d4" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent trades / activity (simple list) */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 overflow-auto">
                            <h3 className="text-lg font-semibold mb-4">Recent activity</h3>
                            <ul className="space-y-3">
                                <li className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">Bought AAPL</div>
                                        <div className="text-sm text-slate-500">2 shares — €170</div>
                                    </div>
                                    <div className="text-sm text-slate-500">2025-11-09</div>
                                </li>
                                <li className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">Sold TSLA</div>
                                        <div className="text-sm text-slate-500">1 share — €220</div>
                                    </div>
                                    <div className="text-sm text-slate-500">2025-11-07</div>
                                </li>
                                <li className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">Dividend MSFT</div>
                                        <div className="text-sm text-slate-500">€5.00</div>
                                    </div>
                                    <div className="text-sm text-slate-500">2025-11-03</div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right column: allocation + holdings table */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6 overflow-hidden">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-2">Allocation</h3>
                            <div className="h-48 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie dataKey="value" data={allocationData} outerRadius={60} fill="#8884d8" label>
                                            {allocationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 overflow-auto">
                            <h3 className="text-lg font-semibold mb-2">Holdings</h3>
                            <table className="w-full text-sm">
                                <thead className="text-slate-500 text-left">
                                <tr>
                                    <th>Symbol</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Value</th>
                                    <th>P/L</th>
                                </tr>
                                </thead>
                                <tbody>
                                {holdings.map((h) => {
                                    const value = h.qty * h.price;
                                    const cost = h.qty * h.costBasis;
                                    const pl = value - cost;
                                    return (
                                        <tr key={h.symbol} className="border-t border-slate-100 dark:border-slate-800">
                                            <td className="py-2 font-medium">{h.symbol}</td>
                                            <td className="py-2">{h.qty}</td>
                                            <td className="py-2">€{h.price}</td>
                                            <td className="py-2">€{value}</td>
                                            <td className={`py-2 ${pl >= 0 ? "text-green-600" : "text-red-600"}`}>{pl >= 0 ? "+" : "-"}€{Math.abs(pl)}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
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
