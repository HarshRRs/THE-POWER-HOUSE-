import type { Prefecture } from "@/hooks/usePrefectures";

const statusStyles: Record<string, { dot: string; label: string; bg: string }> = {
    ACTIVE: { dot: "bg-success", label: "Active", bg: "bg-success-light text-success" },
    ERROR: { dot: "bg-accent", label: "Erreur", bg: "bg-accent-light text-accent" },
    CAPTCHA: { dot: "bg-warning", label: "CAPTCHA", bg: "bg-warning-light text-warning" },
    PAUSED: { dot: "bg-gray-400", label: "En pause", bg: "bg-gray-100 text-gray-500" },
};

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "Jamais";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
}

interface PrefectureCardProps {
    prefecture: Prefecture;
    onCreateAlert?: (prefectureId: string) => void;
    compact?: boolean;
}

export default function PrefectureCard({ prefecture, onCreateAlert, compact = false }: PrefectureCardProps) {
    const status = statusStyles[prefecture.status] || statusStyles.PAUSED;

    return (
        <div className={`bg-white rounded-xl card-shadow p-4 flex items-center justify-between hover:shadow-md transition-shadow ${prefecture.status === "ACTIVE" ? "ring-1 ring-success/20" : ""
            }`}>
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 bg-primary-light text-primary rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0">
                    {prefecture.department}
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{prefecture.name}</h3>
                    {!compact && (
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${status.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${prefecture.status === "ACTIVE" ? "animate-pulse-slow" : ""}`} />
                                {status.label}
                            </span>
                            <span className="text-[10px] text-gray-400">{timeAgo(prefecture.lastSlotFoundAt)}</span>
                        </div>
                    )}
                </div>
            </div>

            {onCreateAlert && (
                <button
                    onClick={() => onCreateAlert(prefecture.id)}
                    className="flex-shrink-0 gradient-urgent text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90"
                >
                    + Alerte
                </button>
            )}
        </div>
    );
}
