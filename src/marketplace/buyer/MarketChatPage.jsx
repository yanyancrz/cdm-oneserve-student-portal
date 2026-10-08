import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import toast from "react-hot-toast";

import { buyerApi } from "../services/marketApi";
import { SENDER } from "../config/marketVocabulary";
import { formatDateTime, formatRelative } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketNotice,
    MarketPanel,
    marketInputClass,
} from "../components/marketUi";

/**
 * The buyer's Chat / Concerns thread.
 *
 * There is exactly ONE thread per buyer - asking again reopens the same
 * conversation rather than fragmenting the history, so there is no list screen
 * here. Only Marketplace Staff can reply; the OneServe Admin cannot read or
 * answer in this thread at all.
 */
export default function MarketChatPage() {
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [subject, setSubject] = useState("");
    const [showSubject, setShowSubject] = useState(false);

    const bottomRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const response = await buyerApi.conversation();
                if (cancelled) return;

                const data = response.data;
                setConversation(data);
                setMessages(data?.messages || []);
            } catch (err) {
                if (!cancelled) toast.error(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages.length]);

    const send = async () => {
        const text = message.trim();
        if (text.length === 0) return;

        setSending(true);

        try {
            if (!conversation?.conversationId) {
                // First message opens the thread.
                const response = await buyerApi.startConversation({
                    subject: subject.trim(),
                    message: text,
                });

                setConversation(response.data);
                setMessages(response.data?.messages || []);
                setSubject("");
                setShowSubject(false);
            } else {
                const response = await buyerApi.sendMessage(
                    conversation.conversationId,
                    text
                );
                setMessages(response.data?.messages || []);
            }

            setMessage("");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSending(false);
        }
    };

    const isFirst = !conversation?.conversationId;

    return (
        <div className="flex min-h-[calc(100vh-9rem)] flex-col gap-4">
            <MarketNotice tone="info" icon={<MessageCircle size={14} />}>
                Questions about an order, a uniform size or campus delivery? Message
                Marketplace Staff here. One thread per account, so your history stays
                together.
            </MarketNotice>

            <MarketPanel className="flex flex-1 flex-col">
                <div className="flex-1 space-y-3 p-3.5">
                    {loading ? (
                        <p className="py-8 text-center text-xs text-slate-400">
                            Loading your conversation...
                        </p>
                    ) : messages.length === 0 ? (
                        <MarketEmpty
                            icon={<MessageCircle size={20} />}
                            title="No messages yet"
                            hint="Send your first message and Marketplace Staff will reply here."
                        />
                    ) : (
                        messages.map((item) => (
                            <Bubble key={item.messageId} item={item} />
                        ))
                    )}

                    <div ref={bottomRef} />
                </div>

                {isFirst && showSubject && (
                    <div className="border-t border-slate-100 px-3.5 py-2.5">
                        <input
                            type="text"
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            placeholder="Subject (optional), e.g. Uniform sizing"
                            className={marketInputClass}
                        />
                    </div>
                )}

                <div className="flex items-end gap-2 border-t border-slate-100 p-3">
                    {isFirst && (
                        <MarketButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSubject((current) => !current)}
                        >
                            {showSubject ? "Hide subject" : "Add subject"}
                        </MarketButton>
                    )}

                    <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        onKeyDown={(event) => {
                            // Enter sends on desktop; Shift+Enter makes a new line.
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                send();
                            }
                        }}
                        rows={1}
                        placeholder="Write your message..."
                        className={`${marketInputClass} resize-none py-2.5`}
                    />

                    <MarketButton
                        size="sm"
                        className="h-10 w-10 shrink-0 p-0"
                        onClick={send}
                        disabled={sending || message.trim().length === 0}
                        aria-label="Send message"
                    >
                        <Send size={14} />
                    </MarketButton>
                </div>
            </MarketPanel>
        </div>
    );
}

function Bubble({ item }) {
    const isStaff = item.senderType === SENDER.STAFF;

    return (
        <div className={`flex ${isStaff ? "" : "justify-end"}`}>
            <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                    isStaff
                        ? "rounded-bl-md border border-slate-200 bg-white"
                        : "rounded-br-md bg-[#106A2E] text-white"
                }`}
            >
                <p className="text-[9px] font-semibold uppercase tracking-[.14em] opacity-60">
                    {isStaff ? "Marketplace Staff" : "You"}
                </p>

                <p className="mt-0.5 text-xs leading-5 whitespace-pre-wrap">
                    {item.message}
                </p>

                <p
                    className={`mt-1 text-[9px] ${
                        isStaff ? "text-slate-400" : "text-white/50"
                    }`}
                    title={formatDateTime(item.createdAt)}
                >
                    {formatRelative(item.createdAt)}
                </p>
            </div>
        </div>
    );
}