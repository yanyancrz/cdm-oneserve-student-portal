import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const SIZES = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
};

export default function Modal({ open, title, onClose, size = "md", footer, children }) {
    const dialogRef = useRef(null);
    const onCloseRef = useRef(onClose);

    // Always call the latest onClose without re-running the open/close effect.
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        if (!open) return undefined;

        const onKey = (e) => {
            if (e.key === "Escape") onCloseRef.current?.();
        };

        window.addEventListener("keydown", onKey);

        // Stop the page behind the modal from scrolling.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        dialogRef.current?.focus();

        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open) return null;

    // Rendered in document.body so no parent (sidebar, transformed layout)
    // can sit on top of it or clip it.
    return createPortal(
        // lg:pl-64 = sidebar width (15rem) + 1rem gap, so on desktop the dialog is
        // centered in the content area instead of on top of the sidebar. The dimmed
        // overlay below is absolute inset-0, so it still covers the whole screen.
        // If the sidebar width or its breakpoint ever changes, change only lg:pl-64.
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4 lg:pl-64">
            <div className="absolute inset-0 bg-black/45" onClick={onClose} aria-hidden="true" />

            <div
                ref={dialogRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`relative flex max-h-[92vh] w-full ${SIZES[size] || SIZES.md} flex-col rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl`}
            >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] px-6 py-4">
                    <h2 className="text-base font-semibold text-[#1F1F1F]">{title}</h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

                {footer && (
                    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-black/[0.06] px-6 py-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}