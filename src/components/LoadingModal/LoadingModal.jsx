export default function LoadingModal({
    message = "Loading..."
}) {
    return (

        <div className="
            fixed inset-0
            bg-black/40
            backdrop-blur-sm
            flex items-center justify-center
            z-50
        ">

            <div className="
                bg-white
                rounded-3xl
                px-8 py-6
                shadow-xl
                flex flex-col items-center
            ">

                <div className="
                    w-12 h-12
                    border-4
                    border-[#106A2E]/20
                    border-t-[#106A2E]
                    rounded-full
                    animate-spin
                " />

                <p className="
                    mt-4
                    text-sm
                    font-medium
                    text-[#1F1F1F]
                ">
                    {message}
                </p>

            </div>

        </div>

    );
}