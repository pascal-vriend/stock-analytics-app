"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useState } from "react";
import { useApi } from "@/lib/useApi";

type Message = {
    id: string;
    role: "user" | "agent" | "system" | "error";
    text: string;
};

export default function AgentPage() {
    const { apiFetch } = useApi();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    function pushMessage(m: Message) {
        setMessages((prev) => [...prev, m]);
    }

    function extractTextFromAgentResponse(json: any): string {
        // Try several common ADK / agent response shapes (best-effort)
        try {
            if (!json) return "";

            // 1) Some ADK A2A / to_a2a endpoints return an events array
            if (Array.isArray(json)) {
                // try to find the last 'message' event
                for (let i = json.length - 1; i >= 0; i--) {
                    const e = json[i];
                    if (!e) continue;
                    if (typeof e === "string") return e;
                    if (e.type === "final_response" && e.text) return e.text;
                    if (e.type === "message" && e.text) return e.text;
                    if (e.output && Array.isArray(e.output)) {
                        const maybe = e.output.map((o: any) => o.text || (o.content && o.content[0]?.text)).filter(Boolean)[0];
                        if (maybe) return maybe;
                    }
                }
            }

            // 2) Top-level result / output
            if (json.result?.output?.length) {
                const firstOut = json.result.output[0];
                if (firstOut.content && firstOut.content[0]?.text) return firstOut.content[0].text;
                if (firstOut.text) return firstOut.text;
            }

            // 3) Simple shape: { text: "..." } or { output_text: "..." }
            if (json.text && typeof json.text === "string") return json.text;
            if (json.output_text && typeof json.output_text === "string") return json.output_text;

            // 4) If ADK returns messages array
            if (json.messages && Array.isArray(json.messages)) {
                const last = json.messages[json.messages.length - 1];
                if (last?.text) return last.text;
                if (last?.content && last.content[0]?.text) return last.content[0].text;
            }

            // 5) If tool responses are embedded
            if (json.events && Array.isArray(json.events)) {
                const msg = json.events.find((e: any) => e.type === "message" || e.type === "final_response");
                if (msg?.text) return msg.text;
            }

            // fallback: pretty JSON
            return JSON.stringify(json, null, 2);
        } catch (err) {
            return String(err);
        }
    }

    async function handleSend(e?: React.FormEvent) {
        e?.preventDefault();
        const trimmed = prompt.trim();
        if (!trimmed) return;

        const userMsg: Message = {
            id: String(Date.now()) + "-u",
            role: "user",
            text: trimmed,
        };
        pushMessage(userMsg);
        setPrompt("");
        setLoading(true);
        setLastError(null);

        try {
            const resp = await apiFetch("/agent/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: trimmed }),
            });

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(text || "Unknown error from AI service");
            }

            const json = await resp.json();
            const extracted = json.text || JSON.stringify(json, null, 2); // AgentClient returns {text, sources}
            pushMessage({ id: String(Date.now()) + "-a", role: "agent", text: extracted });
        } catch (err: any) {
            const msg = String(err.message || err);
            setLastError(msg);
            pushMessage({ id: String(Date.now()) + "-err", role: "error", text: msg });
        } finally {
            setLoading(false);
        }
    }

    function lastAttemptError(endpoint: string, status: number, detail: any) {
        const msg = `Attempt to ${endpoint} failed (status=${status}) - ${typeof detail === "string" ? detail : JSON.stringify(detail)}`;
        setLastError((prev) => (prev ? prev + "\n" + msg : msg));
    }

    return (
        <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
            <Header onToggleSidebar={() => setSidebarOpen((s) => !s)} onAddStock={() => {}} />
            <Sidebar isOpen={sidebarOpen} />

            <div
                className={`fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity duration-200 ${
                    sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setSidebarOpen(false)}
                aria-hidden={true}
            />

            <main
                className={`flex-1 p-6 pt-6 h-[calc(100vh-4rem)] flex flex-col transition-all duration-300 ${
                    sidebarOpen ? "ml-64" : "ml-0"
                } lg:ml-64`}
            >
                <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
                    <div className="mb-4">
                        <h1 className="text-2xl font-semibold">Agent console</h1>
                        <p className="text-sm text-slate-500">Ask the agent anything. Responses appear below.</p>
                    </div>

                    <div className="flex-1 overflow-auto mb-4 p-4 bg-white rounded shadow-sm">
                        {messages.length === 0 ? (
                            <div className="text-sm text-slate-500">No messages yet — ask something using the prompt below.</div>
                        ) : (
                            <div className="space-y-3">
                                {messages.map((m) => (
                                    <div key={m.id} className={`p-3 rounded ${m.role === "user" ? "bg-sky-50 self-end" : m.role === "agent" ? "bg-slate-50" : "bg-rose-50"}`}>
                                        <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                                        <div className="text-xs text-slate-400 mt-1">{m.role === "user" ? "You" : m.role === "agent" ? "Agent" : "Error"}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSend} className="flex items-center gap-3">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your question for the agent..."
                className="flex-1 p-3 rounded border border-slate-200 focus:outline-none focus:ring focus:ring-sky-200 resize-none h-20"
            />
                        <div className="flex flex-col items-end gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 rounded bg-sky-600 text-white disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMessages([]);
                                    setLastError(null);
                                }}
                                className="text-xs text-slate-500"
                            >
                                Clear
                            </button>
                        </div>
                    </form>

                    {lastError && (
                        <div className="mt-3 text-sm text-rose-600 whitespace-pre-wrap">{lastError}</div>
                    )}
                </div>
            </main>

            <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}
