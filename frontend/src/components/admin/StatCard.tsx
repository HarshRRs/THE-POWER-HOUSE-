interface StatCardProps {
    icon: string;
    label: string;
    value: string | number;
    sub?: string;
    color?: "blue" | "green" | "red" | "purple" | "amber";
}

const colorMap = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    purple: "bg-purple-50 text-purple-700",
    amber: "bg-amber-50 text-amber-700",
};

export default function StatCard({ icon, label, value, sub, color = "blue" }: StatCardProps) {
    return (
        <div className="bg-white rounded-xl p-5 card-shadow border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${colorMap[color]}`}>{icon}</span>
                <span className="text-xs font-bold text-gray-500 uppercase">{label}</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    );
}
