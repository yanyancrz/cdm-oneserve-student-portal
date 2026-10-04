export default function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            {Icon && <Icon size={28} className="text-gray-300" />}
            <p className="text-sm font-medium text-gray-700">{title}</p>
            {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
    );
}