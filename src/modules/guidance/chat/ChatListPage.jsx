import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

import { useGuidanceMe } from "../components/GuidanceGate";
import { CardListSkeleton, Empty, ErrorBox } from "../components/GuidanceStates";
import { Avatar } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";
import { onGuidanceEvent } from "../services/realtime";
import { formatStamp } from "../utils/dateTime";

const POLL_MS = 20 * 1000;

// =========================================================
// Chat conversation list. Used by BOTH sides: pass
// audience="student" or "counselor".
//
// The list refreshes live whenever a ChatMessage event
// arrives (and toasts a new incoming message); the
// 20s poll is only a safety net.
// =========================================================
export default function ChatListPage({ audience, accent = "green" }) {
    const navigate = useNavigate();
    const { me } = useGuidanceMe();
    const myId = me?.UserId;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [newOpen, setNewOpen] = useState(false);
    const [counselors, setCounselors] = useState([]);
    const [starting, setStarting] = useState(null);

    const itemsRef = useRef(items);

    // Keep the latest list in a ref so the live-event handler can
    // name the sender without re-subscribing.
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    const load = useCallback(
        async (signal) => {
            setError("");
            setLoading(true);
            try {
                setItems(await guidanceApi.getConversations(audience, signal));
            } catch (e) {
                if (e?.name !== "AbortError")
                    setError(e.message || "Could not load conversations.");
            } finally {
                setLoading(false);
            }
        },
        [audience]
    );

    useEffect(() => {
        const c = new AbortController();
        // First fetch runs off the effect body (microtask) so we don't
        // set state synchronously during the effect.
        queueMicrotask(() => load(c.signal));

        const refreshIfVisible = () => {
            if (!document.hidden) load(c.signal);
        };

        const timer = setInterval(refreshIfVisible, POLL_MS);
        document.addEventListener("visibilitychange", refreshIfVisible);

        // Live: a new message anywhere -> refresh the list,
        // and pop a toast if it is for a conversation the
        // user is not currently reading.
        const offEvent = onGuidanceEvent("ChatMessage", (payload) => {
            load();

            if (myId == null || payload?.senderId === myId) return; // my own echo

            const convo = itemsRef.current.find(
                (x) => x.id === Number(payload?.conversationId)
            );
            if (convo) {
                toast(
                    () => (
                        <span className="flex items-center gap-2.5">
                            <Avatar name={convo.partnerName} accent={accent} size="sm" />
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold">
                                    {convo.partnerName}
                                </span>
                                <span className="block truncate text-xs opacity-80">
                                    {payload.body}
                                </span>
                            </span>
                        </span>
                    ),
                    { duration: 3500 }
                );
            }
        });

        return () => {
            c.abort();
            clearInterval(timer);
            document.removeEventListener("visibilitychange", refreshIfVisible);
            offEvent();
        };
    }, [load, myId, accent]);

    // Student only: "New chat" picks a counselor and starts the conversation.
    const openNew = async () => {
        setNewOpen(true);
        if (counselors.length === 0) {
            try {
                setCounselors(await guidanceApi.getCounselors());
            } catch {
                /* picker stays empty; user can close */
            }
        }
    };

    const start = async (counselorId) => {
        setStarting(counselorId);
        try {
            const result = await guidanceApi.startConversation(counselorId);
            const convo = result?.data ?? result;
            navigate(
                `${audience === "counselor" ? "/guidance/counselor" : "/guidance"}/chat/${convo?.id}`
            );
        } catch (e) {
            toast.error(e.message || "Could not start the conversation.");
        } finally {
            setStarting(null);
        }
    };

    const chatBase = `${audience === "counselor" ? "/guidance/counselor" : "/guidance"}/chat`;

    return (
        <main className="space-y-3 p-4">
            {audience === "student" && (
                <button
                    type="button"
                    onClick={openNew}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#D9578F] to-[#B13C70] py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]"
                >
                    <Plus size={16} aria-hidden="true" /> New chat
                </button>
            )}

            {loading && items.length === 0 && <CardListSkeleton rows={3} label="Loading chats..." />}
            {error && <ErrorBox message={error} onRetry={() => load()} />}
            {!loading && !error && items.length === 0 && (
                <Empty
                    icon={MessageCircle}
                    title="No conversations yet"
                    note="Your counselor conversations will appear here."
                />
            )}

            {items.map((c) => (
                <Link
                    key={c.id}
                    to={`${chatBase}/${c.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm transition active:scale-[0.99]"
                >
                    <Avatar name={c.partnerName} accent={accent} />

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                            {c.partnerName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                            {c.lastMessageBody || "No messages yet"}
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-[10px] text-slate-400">
                            {c.lastMessageAt ? formatStamp(c.lastMessageAt) : ""}
                        </span>

                        {c.unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#D9578F] to-[#B13C70] px-1.5 text-[10px] font-bold text-white">
                                {c.unreadCount > 9 ? "9+" : c.unreadCount}
                            </span>
                        )}
                    </div>
                </Link>
            ))}

            {newOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNewOpen(false)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="New chat"
                        className="mx-auto max-h-[70vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />

                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-800">Choose a counselor</h2>
                            <button
                                type="button"
                                onClick={() => setNewOpen(false)}
                                aria-label="Close"
                                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {counselors.length === 0 && (
                            <p className="py-6 text-center text-xs text-slate-400">Loading counselors...</p>
                        )}

                        {counselors.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                disabled={starting === c.id}
                                onClick={() => start(c.id)}
                                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50 disabled:opacity-60"
                            >
                                <Avatar name={c.fullName} accent={accent} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-800">{c.fullName}</p>
                                    <p className="truncate text-xs text-slate-500">
                                        {c.title || c.department || "Guidance Counselor"}
                                    </p>
                                </div>
                                {starting === c.id && <span className="text-xs text-slate-400">...</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}
