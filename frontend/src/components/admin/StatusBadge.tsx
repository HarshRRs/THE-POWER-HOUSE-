interface StatusBadgeProps {
    status: string;
    size?: "sm" | "md";
}

const statusStyles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PAUSED: "bg-amber-100 text-amber-700",
    ERROR: "bg-red-100 text-red-700",
    CAPTCHA: "bg-purple-100 text-purple-700",
    COMPLETED: "bg-green-100 text-green-700",
    PENDING: "bg-amber-100 text-amber-700",
    FAILED: "bg-red-100 text-red-700",
    REFUNDED: "bg-gray-100 text-gray-600",
    SENT: "bg-green-100 text-green-700",
    USER: "bg-gray-100 text-gray-600",
    ADMIN: "bg-purple-100 text-purple-700",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
    const style = statusStyles[status] || "bg-gray-100 text-gray-600";
    const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

    return (
        <span className={`inline-flex items-center rounded-full font-bold ${style} ${sizeClass}`}>
            {status}
        </span>
    );
}
