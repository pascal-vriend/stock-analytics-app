"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface AddStockModalProps {
    symbol: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (symbol: string, quantity: number, buyPrice: number) => void;
}

export default function AddStockModal({ symbol, isOpen, onClose, onConfirm }: AddStockModalProps) {
    const [quantity, setQuantity] = useState<string>("1");
    const [buyPrice, setBuyPrice] = useState<string>("0");

    useEffect(() => {
        if (isOpen) {
            setQuantity("1");
            setBuyPrice("0");
        }
    }, [isOpen, symbol]);

    const handleConfirm = () => {
        const q = parseFloat(quantity);
        const price = parseFloat(buyPrice);

        if (isNaN(q) || q <= 0) return;
        if (isNaN(price) || price < 0) return;

        onConfirm(symbol, q, price);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm w-full">
                <DialogHeader>
                    <DialogTitle>Add {symbol} to Portfolio</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity</label>
                        <input
                            type="number"
                            min={0}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Purchase Price</label>
                        <input
                            type="number"
                            min={0}
                            value={buyPrice}
                            onChange={(e) => setBuyPrice(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <DialogFooter className="mt-4 flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirm}>Add</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
