import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircleQuestion, SendHorizontal, X } from "lucide-react";

import { FIND_SUGGESTIONS, answerFind } from "./lfAssistantBrain";

let nextId = 1;

const greeting = () => ({
    id: nextId++,
    from: "bot",
    text: "Hi! I'm the FIND helper. Ask me how to report, claim, or pick up an item - or tap a topic below.",
    links: [],
    ask: null,
});

// Follow-up chips per answer, so a beginner always knows what to tap next.
const FOLLOW_UPS = [
    { label: "How to report", ask: "how to report" },
    { label: "How to claim", ask: "how to claim" },
    { label: "Pickup guide", ask: "pickup" },
    { label: "Status meanings", ask: "status meaning" },
];

/**
 * FIND Assistant: floating button + chat sheet inside the Lost & Found
 * module. Fully on-device (lfAssistantBrain) - it never goes dead
 * offline, and every answer ends in the deep link that does the task.
 */
export default function LfAssistant() {
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([greeting()]);
    const [started, setStarted] = useState(false);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);

    const listRef = useRef(null);

    useEffect(() => {
        listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, typing, open]);

    const send = (raw) => {
        const text = (raw ?? "").trim();
        if (!text || typing) return;

        setStarted(true);
        setMessages((prev) => [...prev, { id: nextId++, from: "user", text }]);
        setInput("");
        setTyping(true);

        // Tiny beat so the reply feels conversational, not instant.
        window.setTimeout(() => {
            const answer = answerFind(text);
            setMessages((prev) => [...prev, { id: nextId++, from: "bot", ...answer }]);
            setTyping(false);
        }, 350);
    };

    return (
        <>
            {/* Floating entry point. Above the module bottom nav. */}
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Open FIND helper"
                    className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#106A2E] to-[#0E3B22] text-white shadow-xl shadow-emerald-900/30 transition active:scale-95"
                >
                    <MessageCircleQuestion size={24} aria-hidden="true" />
                </button>
            )}

            {open && (
                <div
                    role="dialog"
                    aria-label="FIND helper chat"
                    className="fixed inset-x-4 bottom-24 top-24 z-40 mx-auto flex w-auto max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 bg-gradient-to-br from-[#106A2E] to-[#0E3B22] px-4 py-3.5 text-white">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                            <MessageCircleQuestion size={18} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">FIND Helper</p>
                            <p className="truncate text-[11px] text-white/70">
                                Guides, FAQs and status meanings
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Close helper"
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
                                    aria-label="Helper is typing"
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

                    {/* Topic chips - starters first, follow-ups after */}
                    <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2.5">
                        {(started ? FOLLOW_UPS : FIND_SUGGESTIONS).map((item) => (
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

                    {/* Input */}
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            send(input);
                        }}
                        className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
                    >
                        <label htmlFor="find-helper-input" className="sr-only">
                            Ask the FIND helper
                        </label>
                        <input
                            id="find-helper-input"
                            type="text"
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder="Ask how to report, claim..."
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
