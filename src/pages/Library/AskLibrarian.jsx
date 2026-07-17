import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../components/Library/PageHeader";

import { mockMessages } from "../../data/mockLibraryData";

const AUTO_REPLY_DELAY_MS = 1200;
const AUTO_REPLY_TEXT =
    "Thanks for reaching out! A librarian will get back to you shortly.";

function nowLabel() {
    return new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function AskLibrarian() {

    const [messages, setMessages] = useState(mockMessages || []);
    const [draft, setDraft] = useState("");
    const [isWaitingForReply, setIsWaitingForReply] = useState(false);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();

        const text = draft.trim();
        if (!text) return;

        const studentMessage = {
            id: `msg-${Date.now()}`,
            sender: "student",
            text,
            time: nowLabel(),
        };

        setMessages((prev) => [...prev, studentMessage]);
        setDraft("");
        setIsWaitingForReply(true);

        // Placeholder only — no backend call yet. libraryService.sendMessage()
        // will replace this once that file exists. This just simulates an
        // acknowledgement so the conversation doesn't feel like a dead end.
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: `msg-${Date.now()}-auto`,
                    sender: "librarian",
                    text: AUTO_REPLY_TEXT,
                    time: nowLabel(),
                },
            ]);
            setIsWaitingForReply(false);
        }, AUTO_REPLY_DELAY_MS);
    };

    return (

        <div
            className="min-h-screen flex flex-col"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)",
            }}
        >

            <div className="max-w-md sm:max-w-2xl lg:max-w-3xl w-full mx-auto p-4 sm:p-6 flex flex-col flex-1 min-h-screen">

                <PageHeader
                    title="Ask a Librarian"
                    subtitle="Get help finding books, holds, and more"
                />

                {/* CONVERSATION */}
                <div className="flex-1 bg-white/70 rounded-[24px] shadow-sm p-4 sm:p-5 mb-4 overflow-y-auto">
                    <div className="space-y-3">
                        {messages.map((message) => {
                            const isStudent = message.sender === "student";
                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isStudent ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`
                                            max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                            ${isStudent
                                                ? "bg-[#106A2E] text-white rounded-br-md"
                                                : "bg-white text-[#1F1F1F] shadow-sm rounded-bl-md"
                                            }
                                        `}
                                    >
                                        <p>{message.text}</p>
                                        <p
                                            className={`
                                                text-[10px] mt-1
                                                ${isStudent ? "text-white/70" : "text-gray-400"}
                                            `}
                                        >
                                            {message.time}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {isWaitingForReply && (
                            <div className="flex justify-start">
                                <div className="bg-white text-gray-400 shadow-sm px-4 py-2.5 rounded-2xl rounded-bl-md text-sm italic">
                                    Librarian is typing...
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* INPUT */}
                <form onSubmit={handleSend} className="flex items-end gap-2 mb-2">
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        placeholder="Type your message..."
                        rows={1}
                        className="
                            flex-1 resize-none
                            bg-white rounded-xl px-4 py-3
                            text-sm text-[#1F1F1F]
                            shadow-sm
                            focus:outline-none focus:ring-2 focus:ring-[#106A2E]/30
                        "
                    />
                    <button
                        type="submit"
                        disabled={!draft.trim()}
                        className={`
                            w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                            ${draft.trim()
                                ? "bg-[#106A2E] text-white hover:brightness-105 active:scale-[0.97]"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }
                        `}
                        aria-label="Send message"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m22 2-7 20-4-9-9-4Z" />
                            <path d="M22 2 11 13" />
                        </svg>
                    </button>
                </form>

                <div className="text-center">
                    <Link
                        to="/library"
                        className="text-sm font-semibold text-[#106A2E] hover:underline"
                    >
                        Back to Library
                    </Link>
                </div>

            </div>

        </div>

    );

}