"use client";

import * as React from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    CardAction,
} from "@/components/ui/Card";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface StockCardProps {
    symbol: string;
    companyName: string;
    priceData?: {
        current: number;
        change: number;
        percent: number;
    } | null;
    loading?: boolean;
    error?: string | null;
}

interface PricePoint {
    time: string;
    price: number;
}

// mock data:
function synthesizeHistory(current: number, points = 20): PricePoint[] {
    const data: PricePoint[] = [];
    let price = current;
    for (let i = 0; i < points; i++) {
        const delta = (Math.random() - 0.5) * (current * 0.002);
        price = Math.max(0.01, price + delta);
        data.push({ time: `T${i}`, price: parseFloat(price.toFixed(2)) });
    }
    return data;
}

export function StockCard({
                              symbol,
                              companyName,
                              priceData,
                              loading,
                              error,
                          }: StockCardProps) {
    const current = priceData?.current ?? 0;
    const change = priceData?.change ?? 0;
    const percent = priceData?.percent ?? 0;

    const history = React.useMemo(
        () =>
            priceData ? synthesizeHistory(priceData.current) : synthesizeHistory(100),
        [priceData]
    );

    const isPositive = change >= 0;

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>{companyName}</CardTitle>
                <CardAction>
                    {loading ? (
                        <span className="text-sm text-slate-500">Loading…</span>
                    ) : error ? (
                        <span className="text-sm text-red-600">{error}</span>
                    ) : (
                        <span
                            className={`flex items-center gap-1 text-sm font-semibold ${
                                isPositive ? "text-green-600" : "text-red-600"
                            }`}
                        >
              {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            {percent.toFixed(2)}%
            </span>
                    )}
                </CardAction>
                <CardDescription>{symbol}</CardDescription>
            </CardHeader>

            <CardContent>
                <p className="text-lg font-bold">
                    {loading ? "—" : `$${current.toFixed(2)}`}
                </p>

                <div style={{ width: "100%", height: 100 }}>
                    <ResponsiveContainer>
                        <LineChart data={history}>
                            <XAxis dataKey="time" hide />
                            <YAxis domain={["auto", "auto"]} hide />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke={isPositive ? undefined : undefined}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>

            <CardFooter>
                <button className="text-sm text-blue-600 hover:underline">View More</button>
            </CardFooter>
        </Card>
    );
}
