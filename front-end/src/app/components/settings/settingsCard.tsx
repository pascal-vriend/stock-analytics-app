"use client";

import { ReactNode } from "react";
import { Pencil, RefreshCw } from "lucide-react";

type ActionType =
    | { type: "edit"; onClick: () => void }
    | { type: "button"; label: string; onClick: () => void }
    | { type: "refresh"; onClick: () => void }
    | { type: "toggle"; enabled: boolean; onToggle: (value: boolean) => void }
    | { type: "dropdown"; options: string[]; value: string; onChange: (value: string) => void };

type SettingRow = {
    label: string;
    value?: ReactNode;
    action?: ActionType;
};

type SettingsCardProps = {
    title: string;
    settings: SettingRow[];
};

export default function SettingsCard({ title, settings }: SettingsCardProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            {settings.map((row, index) => (
                <div key={index}>
                    <div className="flex justify-between items-center py-2">
                        {/* Left side: single button */}
                        <div className="flex-1 flex items-center gap-4">
                            {row.action?.type === "button" && (
                                <button
                                    onClick={row.action.onClick}
                                    className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 text-sm"
                                >
                                    {row.action.label}
                                </button>
                            )}

                            <div>
                                <p className="font-bold">{row.label}</p>
                                <p className="text-gray-700">{row.value}</p>
                            </div>
                        </div>

                        {/* Right side: edit / toggle / dropdown */}
                        {row.action && row.action.type !== "button" && (
                            <div>
                                {row.action.type === "edit" && (
                                    <button
                                        onClick={row.action.onClick}
                                        className="text-blue-600 hover:text-blue-800 p-2 rounded"
                                        title={`Edit ${row.label}`}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                )}
                                {row.action.type === "refresh" && (
                                    <button
                                        onClick={row.action.onClick}
                                        className="text-blue-600 hover:text-blue-800 p-2 rounded"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                )}
                                {row.action.type === "toggle" && (
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={row.action.enabled}
                                            onChange={(e) => row.action.onToggle(e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div
                                            className={`w-11 h-6 flex items-center bg-gray-300 rounded-full p-1 transition-colors ${
                                                row.action.enabled ? "bg-blue-600" : ""
                                            }`}
                                        >
                                            <div
                                                className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                                                    row.action.enabled ? "translate-x-5" : ""
                                                }`}
                                            />
                                        </div>
                                    </label>
                                )}
                                {row.action.type === "dropdown" && (
                                    <select
                                        value={row.action.value}
                                        onChange={(e) => row.action.onChange(e.target.value)}
                                        className="border rounded px-2 py-1 text-gray-700"
                                    >
                                        {row.action.options.map((opt, idx) => (
                                            <option key={idx} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </div>
                    {index < settings.length - 1 && <hr className="border-gray-200" />}
                </div>
            ))}
        </div>
    );
}
