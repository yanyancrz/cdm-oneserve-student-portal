import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Inbox, MessageCircle, Send } from "lucide-react";
import toast from "react-hot-toast";

import { staffApi } from "../services/marketApi";
import {
    CHAT_STATUS,
    CHAT_STATUS_OPTIONS,
    SENDER,
    chatStatusLabel,
} from "../config/marketVocabulary";
import { formatDateTime, formatRelative } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
} from "../components/marketUi";
import { StaffPageHeader } from "./MarketStaffLayout";

/**
 * Chat / Concerns - the staff inbox.
 *
 * Because there is exactly ONE Marketplace Staff account, every buyer's thread
 * lands in this single list; there is no "mine / others" split.
 *
 * The CDM OneServe Admin cannot appear in this thread at all: the server writes
 * `SenderType = staff` only for a marketplace_staff row, and only Marketplace
 * Staff can read or reply. The Admin has no chat route in the marketplace.
 */
export default function MarketStaffChatPage() {
    const navigate = useNavigate();
    const { conversationId } = useParams();

    const [conversations, setConversations] = useState([]);
    const [active, setActive] = useState(null);
    const [loading, setLoading] = useState(true);
    const [threadLoading, setThreadLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const bottomRef = useRef(null);

    const loadList = async () => {
        try {
            setLoading(true);
            const response = await staffApi.conversations();
            setConversations(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadList();
    }, []);

    useEffect(() => {
        if (!conversationId) {
            setActive(null);
            return;
        }

        let cancelled = false;

        const load = async () => {
            try {
                setThreadLoading(true);
                const response = await staffApi.conversation(Number(conversationId));
                if (cancelled) return;

                setActive(response.data);

                // Opening the thread clears the unread badge on both sides.
                setConversations((current) =>
                    current.map((item) =>
                        item.conversationId === Number(conversationId)
                            ? { ...item, unreadCount: 0 }
                            : item
                    )
                );
            } catch (err) {
                if (!cancelled) toast.error(err.message);
            } finally {
                if (!cancelled) setThreadLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [conversationId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [active?.messages?.length]);

    const reply = async () => {
        const text = message.trim();
        if (text.length === 0 || !active) return;

        setSending(true);

        try {
            const response = await staffApi.reply(active.conversationId, text);
            setActive(response.data);
            setMessage("");
            loadList();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSending(false);
        }
    };

    const setStatus = async (status) => {
        if (!active) return;

        try {
            await staffApi.setConversationStatus(active.conversationId, status);
            setActive((current) => ({ ...current, status }));
            loadList();
            toast.success(`Marked ${chatStatusLabel(status).toLowerCase()}.`);
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="space-y-4">
            <StaffPageHeader
                title="Chat / Concerns"
                subtitle="One inbox for every buyer"
            />

            {error && (
                <MarketNotice tone="error" title="Could not load conversations">
                    {error}
                </MarketNotice>
            )}

            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                {/* Inbox */}
                <MarketPanel
                    title="Conversations"
                    action={
                        <button
                            type="button"
                            onClick={loadList}
                            className="text-[10px] font-medium text-[#106A2E]"
                        >
                            Refresh
                        </button>
                    }
                    className="lg:max-h-[70vh] lg:overflow-hidden"
                >
                    {loading ? (
                        <MarketSkeleton rows={4} />
                    ) : conversations.length === 0 ? (
                        <MarketEmpty
                            icon={<Inbox size={18} />}
                            title="No concerns yet"
                            hint="A buyer opening Chat from their orders lands here."
                        />
                    ) : (
                        <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto lg:max-h-[55vh]">
                            {conversations.map((conversation) => (
                                <li key={conversation.conversationId}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/marketplace/staff/chat/${conversation.conversationId}`
                                            )
                                        }
                                        className={`w-full p-3 text-left transition hover:bg-slate-50 ${
                                            conversation.conversationId ===
                                            Number(conversationId)
                                                ? "bg-[#106A2E]/5"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate text-xs font-semibold text-slate-800">
                                                {conversation.userName}
                                            </p>

                                            {conversation.unreadCount > 0 && (
                                                <span className="shrink-0 rounded-full bg-[#106A2E] px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                    {conversation.unreadCount}
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                            {conversation.accountType}
                                            {conversation.orderReference
                                                ? ` \u00b7 ${conversation.orderReference}`
                                                : ""}
                                        </p>

                                        <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                                            {conversation.lastMessage || "No messages yet"}
                                        </p>

                                        <div className="mt-1 flex items-center justify-between">
                                            <span
                                                className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${
                                                    conversation.status === CHAT_STATUS.RESOLVED
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : conversation.status === CHAT_STATUS.IN_PROGRESS
                                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                                          : "bg-sky-50 text-sky-700 border-sky-200"
                                                }`}
                                            >
                                                {chatStatusLabel(conversation.status)}
                                            </span>

                                            <span className="text-[9px] text-slate-400">
                                                {formatRelative(
                                                    conversation.lastMessageAt
                                                )}
                                            </span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </MarketPanel>

                {/* Thread */}
                <MarketPanel
                    title={active ? active.userName : "Select a conversation"}
                    subtitle={
                        active
                            ? `${active.accountType}${
                                  active.orderReference
                                      ? ` \u00b7 ${active.orderReference}`
                                      : ""
                              }`
                            : undefined
                    }
                    action={
                        active ? (
                            <select
                                value={active.status}
                                onChange={(event) => setStatus(event.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600"
                            >
                                {CHAT_STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        ) : null
                    }
                    className="flex flex-col"
                >
                    {!active ? (
                        <MarketEmpty
                            icon={<MessageCircle size={18} />}
                            title="No conversation selected"
                            hint="Pick a thread on the left to read and reply."
                        />
                    ) : (
                        <>
                            <div className="max-h-[52vh] min-h-[240px] flex-1 space-y-3 overflow-y-auto p-4">
                                {threadLoading && (
                                    <p className="text-center text-[11px] text-slate-400">
                                        Loading...
                                    </p>
                                )}

                                {active.subject && (
                                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                                        Subject: {active.subject}
                                    </p>
                                )}

                                {active.messages?.map((item) => (
                                    <Bubble key={item.messageId} item={item} />
                                ))}

                                <div ref={bottomRef} />
                            </div>

                            <div className="flex items-end gap-2 border-t border-slate-100 p-3">
                                <textarea
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" && !event.shiftKey) {
                                            event.preventDefault();
                                            reply();
                                        }
                                    }}
                                    rows={1}
                                    placeholder="Reply as Marketplace Staff..."
                                    className={`${marketInputClass} resize-none`}
                                />

                                <MarketButton
                                    className="h-10 w-10 shrink-0 p-0"
                                    onClick={reply}
                                    disabled={sending || message.trim().length === 0}
                                    aria-label="Send reply"
                                >
                                    <Send size={14} />
                                </MarketButton>
                            </div>
                        </>
                    )}
                </MarketPanel>
            </div>
        </div>
    );
}

function Bubble({ item }) {
    // Staff replies sit on the right, buyer messages on the left - the mirror of
    // the buyer's own chat view.
    const isStaff = item.senderType === SENDER.STAFF;

    return (
        <div className={`flex ${isStaff ? "justify-end" : ""}`}>
            <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                    isStaff
                        ? "rounded-br-md bg-[#106A2E] text-white"
                        : "rounded-bl-md border border-slate-200 bg-white"
                }`}
            >
                <p
                    className={`text-[9px] font-semibold uppercase tracking-wider ${
                        isStaff ? "text-white/50" : "text-slate-400"
                    }`}
                >
                    {isStaff ? "Marketplace Staff" : "Buyer"}
                </p>

                <p className="mt-0.5 text-xs leading-5 whitespace-pre-wrap">
                    {item.message}
                </p>

                <p
                    className={`mt-0.5 text-[9px] ${
                        isStaff ? "text-white/40" : "text-slate-400"
                    }`}
                    title={formatDateTime(item.createdAt)}
                >
                    {formatRelative(item.createdAt)}
                    {item.isRead ? " \u00b7 read" : ""}
                </p>
            </div>
        </div>
    );
}
