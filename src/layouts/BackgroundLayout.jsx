export default function BackgroundLayout({ children }) {
    return (
        <div
            className="
                min-h-screen
                relative
                overflow-hidden
                bg-gradient-to-br
                from-[#d7ead9]
                via-[#cfe9de]
                to-[#fcf0c8]
            "
        >

            <div className="relative z-10">
                {children}
            </div>

        </div>
    );
}
