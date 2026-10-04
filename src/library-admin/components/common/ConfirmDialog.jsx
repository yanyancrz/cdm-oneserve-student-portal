import Modal from "./Modal";

const TONES = {
    danger: "bg-red-600 hover:bg-red-700",
    primary: "bg-[#106A2E] hover:opacity-90",
};

export default function ConfirmDialog({
    title,
    message,
    confirmLabel = "Confirm",
    tone = "primary",
    busy = false,
    onConfirm,
    onClose,
}) {
    return (
        <Modal
            open
            onClose={busy ? undefined : onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${TONES[tone] || TONES.primary}`}
                    >
                        {busy ? "Please wait..." : confirmLabel}
                    </button>
                </>
            }
        >
            <p className="text-sm text-gray-600">{message}</p>
        </Modal>
    );
}