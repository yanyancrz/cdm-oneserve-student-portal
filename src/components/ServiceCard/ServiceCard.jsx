export default function ServiceCard({
    icon,
    title,
    description,
    url
}) {

    const handleOpen = () => {
        window.open(url, "_blank");
    };

    return (
        <div
            onClick={handleOpen}
            className="
                bg-white
                rounded-2xl
                shadow
                p-4
                cursor-pointer
                hover:shadow-lg
                transition
            "
        >

            <div className="text-3xl mb-2">
                {icon}
            </div>

            <h3 className="font-bold text-lg">
                {title}
            </h3>

            <p className="text-gray-500 text-sm">
                {description}
            </p>

        </div>
    );
}