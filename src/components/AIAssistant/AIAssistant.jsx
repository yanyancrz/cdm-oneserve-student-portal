import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SendHorizontal, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { ASSISTANT_SUGGESTIONS, answerAssistant } from "./assistantBrain";
import { API_URL } from "../../config/api";

let nextId = 1;

const greeting = () => ({
    id: nextId++,
    from: "bot",
    text: "Hi! I'm your OneServe Assistant. Ask me about books, food orders, counseling, or lost items.",
    links: [],
    source: "local",
});

/**
 * Asks the campus AI first; anything but a real answer (no key, quota,
 * timeout, offline) falls back to the on-device brain silently, so the
 * assistant never goes dead.
 */
async function askRemote(text, signal) {
    const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) throw new Error("no token");

    const response = await fetch(`${API_URL}/api/assistant/ask`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: text }),
        signal,
    });

    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.success || !body?.text) throw new Error("fallback");
    return body;
}

/**
 * OneServe Assistant: floating button + chat sheet on the dashboard.
 *
 * Answers come from ./assistantBrain (on-device, no API key). This file only
 * renders messages, suggestion chips and deep-link buttons - it never decides
 * what anything means, so swapping the brain for an LLM endpoint later means
 * changing one import, not this UI.
 */
export default function AIAssistant() {
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([greeting()]);
    const [started, setStarted] = useState(false);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const [votes, setVotes] = useState({});

    const listRef = useRef(null);
    const abortRef = useRef(null);

    useEffect(() => {
        listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, typing, open]);

    useEffect(
        () => () => {
            if (abortRef.current) abortRef.current.abort();
        },
        []
    );

    const send = async (raw) => {
        const text = (raw ?? "").trim();
        if (!text || typing) return;

        setStarted(true);
        setMessages((prev) => [...prev, { id: nextId++, from: "user", text }]);
        setInput("");
        setTyping(true);

        // Deep links always come from the local intent map: deterministic,
        // and the model is never trusted with routes.
        const local = answerAssistant(text);

        try {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            const timer = setTimeout(() => controller.abort(), 25000);

            try {
                const remote = await askRemote(text, controller.signal);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: nextId++,
                        from: "bot",
                        text: remote.text,
                        links: local.links,
                        source: "ai",
                        usageId: remote.usageId ?? null,
                    },
                ]);
            } finally {
                clearTimeout(timer);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { id: nextId++, from: "bot", ...local, source: "local" },
            ]);
        } finally {
            setTyping(false);
        }
    };

    const vote = async (message, helpful) => {
        if (!message.usageId || votes[message.id]) return;

        setVotes((prev) => ({ ...prev, [message.id]: helpful ? "up" : "down" }));

        try {
            const token =
                localStorage.getItem("token") || localStorage.getItem("authToken");

            await fetch(`${API_URL}/api/assistant/feedback`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ usageId: message.usageId, helpful }),
            });
        } catch {
            // A lost vote is expendable; the answer already landed.
        }
    };

    return (
        <>
            {/* Floating entry point. Above the bottom nav, below modals. */}
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Open OneServe Assistant"
                    className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#106A2E] to-[#0E3B22] text-white shadow-xl shadow-emerald-900/30 transition active:scale-95"
                >
                    <Sparkles size={24} aria-hidden="true" />
                </button>
            )}

            {open && (
                <div
                    role="dialog"
                    aria-label="OneServe Assistant chat"
                    className="fixed inset-x-4 bottom-24 top-24 z-40 mx-auto flex w-auto max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 bg-gradient-to-br from-[#106A2E] to-[#0E3B22] px-4 py-3.5 text-white">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                            <Sparkles size={18} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                                OneServe Assistant
                            </p>
                            <p className="truncate text-[11px] text-white/70">
                                Instant answers about campus services
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Close assistant"
                            className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        ref={listRef}
                        role="log"
                        aria-live="polite"
                        className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F7F5EF] p-4"
                    >
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 ${
                                        message.from === "user"
                                            ? "bg-[#106A2E] text-white"
                                            : "border border-slate-200 bg-white text-slate-700 shadow-sm"
                                    }`}
                                >
                                    <p className="whitespace-pre-line">{message.text}</p>

                                    {message.from === "bot" && message.source === "ai" && (
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <span className="mr-1 text-[10px] text-slate-400">
                                                AI answer · helpful?
                                            </span>
                                            <button
                                                type="button"
                                                disabled={!!votes[message.id]}
                                                onClick={() => vote(message, true)}
                                                aria-label="Mark answer helpful"
                                                className={`rounded-full p-1.5 transition disabled:opacity-40 ${
                                                    votes[message.id] === "up"
                                                        ? "bg-[#106A2E]/15 text-[#106A2E]"
                                                        : "text-slate-400 hover:bg-slate-100"
                                                }`}
                                            >
                                                <ThumbsUp size={13} aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!!votes[message.id]}
                                                onClick={() => vote(message, false)}
                                                aria-label="Mark answer not helpful"
                                                className={`rounded-full p-1.5 transition disabled:opacity-40 ${
                                                    votes[message.id] === "down"
                                                        ? "bg-red-50 text-red-500"
                                                        : "text-slate-400 hover:bg-slate-100"
                                                }`}
                                            >
                                                <ThumbsDown size={13} aria-hidden="true" />
                                            </button>
                                        </div>
                                    )}

                                    {message.links?.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {message.links.map((link) => (
                                                <button
                                                    key={link.to + link.label}
                                                    type="button"
                                                    onClick={() => {
                                                        setOpen(false);
                                                        navigate(link.to);
                                                    }}
                                                    className="rounded-full bg-[#106A2E]/10 px-3 py-1.5 text-[11px] font-semibold text-[#106A2E] transition hover:bg-[#106A2E]/20"
                                                >
                                                    {link.label} →
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {typing && (
                            <div className="flex justify-start">
                                <div
                                    role="status"
                                    aria-label="Assistant is typing"
                                    className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                                >
                                    {[0, 1, 2].map((dot) => (
                                        <span
                                            key={dot}
                                            className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400"
                                            style={{ animationDelay: `${dot * 150}ms` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Suggestions until the first question */}
                    {!started && (
                        <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2.5">
                            {ASSISTANT_SUGGESTIONS.map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => send(item.ask)}
                                    className="shrink-0 rounded-full border border-[#106A2E]/25 bg-[#106A2E]/5 px-3 py-1.5 text-[11px] font-semibold text-[#106A2E] transition hover:bg-[#106A2E]/10"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            send(input);
                        }}
                        className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
                    >
                        <label htmlFor="ai-assistant-input" className="sr-only">
                            Ask the assistant
                        </label>
                        <input
                            id="ai-assistant-input"
                            type="text"
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder="Ask about books, orders..."
                            maxLength={300}
                            autoComplete="off"
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#106A2E] focus:bg-white"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || typing}
                            aria-label="Send message"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#106A2E] text-white transition hover:bg-[#0D5224] disabled:opacity-40"
                        >
                            <SendHorizontal size={17} aria-hidden="true" />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
