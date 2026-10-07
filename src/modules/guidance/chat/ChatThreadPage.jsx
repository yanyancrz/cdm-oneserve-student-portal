import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, CheckCheck, Send } from "lucide-react";

import { useGuidanceMe } from "../components/GuidanceGate";
import { ACCENTS, Avatar } from "../components/GuidanceUi";
import { ErrorBox } from "../components/GuidanceStates";
import { guidanceApi } from "../services/guidanceApi";
import { invokeGuidanceHub, onGuidanceEvent } from "../services/realtime";

const FALLBACK_POLL_MS = 30 * 1000;

// "2026-10-05" -> Today / Yesterday / Oct 5
function dayLabel(iso) {
    const [y, m, d] = String(iso || "").slice(0, 10).split("-").map(Number);
    if (!y || !m || !d) return "";

    const date = new Date(y, m - 1, d);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const same = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    if (same(date, today)) return "Today";
    if (same(date, yesterday)) return "Yesterday";

    return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

// The API may send dates without a timezone suffix (naive datetime).
// Treat those as UTC so the browser converts them to PH local time.
const parseDate = (iso) => {
    const raw = String(iso || "");
    // No timezone info -> append Z so it's parsed as UTC
    if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
        return new Date(`${raw}Z`);
    }
    return new Date(raw);
};

const timeOf = (iso) =>
    parseDate(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });

// =========================================================
// Single chat thread — shared by student and counselor via the
// audience prop.
//
// New messages arrive LIVE over SignalR (JoinConversation on
// mount); the 30s poll is only a safety net for anything
// missed while offline.
// =========================================================
export default function ChatThreadPage({ audience }) {
    const { conversationId } = useParams();
    const { me } = useGuidanceMe();

    const accent = audience === "counselor" ? "green" : "pink";
    const A = ACCENTS[accent];

    const id = Number(conversationId);
    const myId = me?.UserId;

    const [messages, setMessages] = useState([]);
    const [partnerName, setPartnerName] = useState("");
    const [error, setError] = useState("");
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [showJump, setShowJump] = useState(false);

    const scrollRef = useRef(null);
    const bottomRef = useRef(null);
    const nearBottomRef = useRef(true);

    const isMine = useCallback(
        (m) => (m.mine ?? (myId != null && m.senderId === myId)),
        [myId]
    );

    const load = useCallback(
        async (signal) => {
            try {
                const list = await guidanceApi.getMessages(audience, id, signal);

                setMessages((prev) => {
                    const seen = new Set(prev.map((m) => m.id));
                    const fresh = list.filter((m) => !seen.has(m.id));
                    return fresh.length
                        ? [...prev, ...fresh].sort((a, b) => a.id - b.id)
                        : list;
                });
                setError("");
            } catch (e) {
                if (e?.name !== "AbortError") setError(e.message || "Could not load messages.");
            }
        },
        [audience, id]
    );

    // Partner name (from the conversation list) for the header.
    useEffect(() => {
        const c = new AbortController();
        guidanceApi
            .getConversations(audience, c.signal)
            .then((convos) => {
                const convo = convos.find((x) => x.id === id);
                if (convo) setPartnerName(convo.partnerName || "");
            })
            .catch(() => {});
        return () => c.abort();
    }, [audience, id]);

    // Initial load + safety poll.
    useEffect(() => {
        const c = new AbortController();
        // Kick the first fetch off the effect body (microtask) so the
        // rule that bans synchronous setState inside effects is happy.
        const kick = () => load(c.signal);
        queueMicrotask(kick);
        guidanceApi.markChatRead(audience, id).catch(() => {});

        const timer = setInterval(() => {
            if (!document.hidden) load(c.signal);
        }, FALLBACK_POLL_MS);
        const onVisible = () => {
            if (!document.hidden) load(c.signal);
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            c.abort();
            clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [load, audience, id]);

    // Watch this thread live.
    useEffect(() => {
        invokeGuidanceHub("JoinConversation", id);

        const offMessage = onGuidanceEvent("ChatMessage", (payload) => {
            if (Number(payload?.conversationId) !== id) return;

            setMessages((prev) => {
                if (prev.some((m) => m.id === payload.id)) return prev;

                const mine = myId != null && payload.senderId === myId;

                const message = {
                    id: payload.id,
                    conversationId: payload.conversationId,
                    senderId: payload.senderId,
                    body: payload.body,
                    createdAt: payload.createdAt,
                    // We're viewing the thread -> treat incoming as read at once.
                    readAt: mine ? undefined : new Date().toISOString(),
                    mine,
                };
                return [...prev, message];
            });

            // I opened the thread -> read it straight away (live read receipt).
            guidanceApi.markChatRead(audience, id).catch(() => {});
        });

        return () => {
            offMessage();
            invokeGuidanceHub("LeaveConversation", id);
        };
    }, [id, audience, myId]);

    // Pin to the bottom on new messages (unless the user scrolled up).
    useEffect(() => {
        if (nearBottomRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
            setShowJump(true);
        }
    }, [messages.length]);

    // First render: jump to the newest message instantly.
    useEffect(() => {
        bottomRef.current?.scrollIntoView();
    }, []);

    // Mark read whenever an incoming message is on screen.
    const hasUnreadIncoming = messages.some((m) => !isMine(m) && !m.readAt);
    useEffect(() => {
        if (hasUnreadIncoming) guidanceApi.markChatRead(audience, id).catch(() => {});
    }, [hasUnreadIncoming, audience, id]);

    const onScroll = () => {
        const el = scrollRef.current;
        if (!el) return;

        const near = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
        nearBottomRef.current = near;
        if (near) setShowJump(false);
    };

    const send = async () => {
        const body = draft.trim();
        if (!body || sending) return;

        setSending(true);
        setDraft("");

        const clientId = crypto.randomUUID();
        try {
            const result = await guidanceApi.sendMessage(audience, id, body, clientId);

            // The POST response is the saved message (deduped against
            // the SignalR echo by id below).
            const dto = result?.data ?? result;
            if (dto?.id) {
                setMessages((prev) =>
                    prev.some((m) => m.id === dto.id)
                        ? prev
                        : [...prev, { ...dto, mine: true }]
                );
            }

            nearBottomRef.current = true;
            setShowJump(false);
            requestAnimationFrame(() =>
                bottomRef.current?.scrollIntoView({ behavior: "smooth" })
            );
        } catch (e) {
            setError(e.message || "Could not send the message.");
            setDraft(body);
        } finally {
            setSending(false);
        }
    };

    // Group messages by day + sender for bubble clusters.
    const rows = useMemo(() => {
        const out = [];
        let lastDay = "";
        let lastMine = null;

        messages.forEach((m, i) => {
            const day = parseDate(m.createdAt).toISOString().slice(0, 10);
            if (day !== lastDay) {
                out.push({ kind: "day", label: dayLabel(day), key: `day-${day}-${i}` });
                lastDay = day;
                lastMine = null;
            }

            const mine = isMine(m);
            const firstOfGroup = mine !== lastMine;
            const isLast = i === messages.length - 1;

            out.push({ kind: "msg", m, mine, firstOfGroup, isLast, key: m.id });
            lastMine = mine;
        });

        return out;
    }, [messages, isMine]);

    return (
        // Fill the viewport minus the real header + bottom-nav heights
        // (measured by the layout into CSS vars), so the composer ends
        // flush with the top of the nav — no dead space in between.
        <main
            className="flex flex-col bg-[#F7F5EF]"
            style={{
                height:
                    "calc(100dvh - var(--guidance-nav-h, 4rem) - var(--guidance-header-h, 0px))",
            }}
        >
            {/* Header */}
            <div
                className="flex items-center gap-3 border-b border-black/[0.05] bg-white px-3 py-3"
                style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
            >
                <Link
                    to={`${audience === "counselor" ? "/guidance/counselor" : "/guidance"}/chat`}
                    aria-label="Back to messages"
                    className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100"
                >
                    <ArrowLeft size={18} />
                </Link>

                <Avatar name={partnerName} accent={accent} size="sm" />

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                        {partnerName || "Messages"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                        {audience === "counselor" ? "Student" : "Guidance Counselor"}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} onScroll={onScroll} className="relative flex-1 overflow-y-auto">
                <div className="space-y-1.5 px-3 py-4">
                    {error && <ErrorBox message={error} onRetry={() => load()} />}

                    {rows.map((row) => {
                        if (row.kind === "day") {
                            return (
                                <div
                                    key={row.key}
                                    className="flex items-center gap-3 pt-4 pb-1"
                                >
                                    <span className="h-px flex-1 bg-black/[0.06]" />
                                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-400 shadow-sm">
                                        {row.label}
                                    </span>
                                    <span className="h-px flex-1 bg-black/[0.06]" />
                                </div>
                            );
                        }

                        const { m, mine, firstOfGroup, isLast } = row;

                        return (
                            <div
                                key={row.key}
                                className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
                            >
                                {!mine && (
                                    <span className="w-7 shrink-0">
                                        {firstOfGroup && (
                                            <Avatar
                                                name={partnerName}
                                                accent={accent}
                                                size="sm"
                                            />
                                        )}
                                    </span>
                                )}

                                <div
                                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                                        mine
                                            ? `rounded-br-md bg-gradient-to-br ${A.gradient} text-white`
                                            : "rounded-bl-md border border-black/[0.04] bg-white text-slate-700"
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap leading-5 break-words">{m.body}</p>

                                    <p
                                        className={`mt-1 text-right text-[9px] ${
                                            mine ? "text-white/70" : "text-slate-400"
                                        }`}
                                    >
                                        {timeOf(m.createdAt)}
                                    </p>
                                </div>

                                {/* read receipt on the last of my messages */}
                                {mine && isLast && (
                                    <span
                                        className={`flex items-center gap-1 pb-1 pl-1 text-[10px] font-medium ${
                                            m.readAt ? "text-emerald-600" : "text-slate-400"
                                        }`}
                                    >
                                        <CheckCheck size={13} aria-hidden="true" />
                                        {m.readAt ? "Read" : "Sent"}
                                    </span>
                                )}
                            </div>
                        );
                    })}

                    <div ref={bottomRef} />
                </div>

                {/* Jump to latest */}
                {showJump && (
                    <button
                        type="button"
                        onClick={() => {
                            nearBottomRef.current = true;
                            setShowJump(false);
                            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                        }}
                        aria-label="Jump to latest message"
                        className="sticky bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg"
                    >
                        <ArrowDown size={12} aria-hidden="true" /> New message
                    </button>
                )}
            </div>

            {/* Composer — sits flush on the nav (the nav already owns
                the safe-area inset, so don't repeat it here). */}
            <div className="flex items-center gap-2 border-t border-black/[0.05] bg-white p-3">
                <input
                    aria-label="Type a message"
                    placeholder="Type a message..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${A.within}`}
                />

                <button
                    type="button"
                    onClick={send}
                    disabled={sending || !draft.trim()}
                    aria-label="Send message"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${A.gradient} text-white shadow-sm transition active:scale-95 disabled:opacity-40`}
                >
                    <Send size={17} aria-hidden="true" />
                </button>
            </div>
        </main>
    );
}
