export default function Modal({
    isOpen,
    type = "confirm", // confirm | loading | success | error

    title,
    message,

    confirmText = "Confirm",
    cancelText = "Cancel",

    confirmColor = "bg-[#106A2E]",

    onConfirm,
    onClose,

    children
}) {

    if (!isOpen) return null;

    return (

        <div className="
            fixed inset-0
            z-50
            bg-black/40
            backdrop-blur-sm
            flex items-center justify-center
            p-4
        ">

            <div className="
                bg-white
                rounded-3xl
                shadow-2xl
                w-full
                max-w-md
                overflow-hidden
                animate-[fadeIn_.2s_ease]
            ">

                {/* HEADER */}

                <div className="px-6 pt-6">

                    <h2 className="text-2xl font-bold text-[#1F1F1F]">

                        {title}

                    </h2>

                    {message && (

                        <p className="mt-3 text-gray-600">

                            {message}

                        </p>

                    )}

                </div>

                {/* BODY */}

                <div className="px-6 py-6">

                    {type === "loading" ? (

                        <div className="flex flex-col items-center">

                            <div
                                className="
                                    w-12 h-12
                                    border-4
                                    border-[#106A2E]/20
                                    border-t-[#106A2E]
                                    rounded-full
                                    animate-spin
                                "
                            />

                        </div>

                    ) : (

                        children

                    )}

                </div>

                {/* FOOTER */}

                {type === "confirm" && (

                    <div className="
                        px-6
                        pb-6
                        flex
                        justify-end
                        gap-3
                    ">

                        <button
                            onClick={onClose}
                            className="
                                px-5
                                py-2.5
                                rounded-xl
                                border
                                border-gray-300
                                hover:bg-gray-100
                                transition
                            "
                        >

                            {cancelText}

                        </button>

                        <button
                            onClick={onConfirm}
                            className={`
                                px-5
                                py-2.5
                                rounded-xl
                                text-white
                                transition
                                hover:brightness-110
                                ${confirmColor}
                            `}
                        >

                            {confirmText}

                        </button>

                    </div>

                )}

                {(type === "success" || type === "error") && (

                    <div className="px-6 pb-6">

                        <button
                            onClick={onClose}
                            className="
                                w-full
                                py-3
                                rounded-xl
                                bg-[#106A2E]
                                text-white
                                font-semibold
                                hover:brightness-110
                            "
                        >

                            OK

                        </button>

                    </div>

                )}

            </div>

        </div>

    );

}