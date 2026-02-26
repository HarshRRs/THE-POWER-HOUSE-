"use client";

interface Column<T> {
    key: string;
    label: string;
    render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    pagination?: {
        total: number;
        page: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T extends Record<string, any>>({
    columns,
    data,
    loading = false,
    emptyMessage = "Aucune donnee",
    pagination,
}: DataTableProps<T>) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl card-shadow border border-gray-100 overflow-hidden">
                <div className="p-8 text-center">
                    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-gray-400 mt-3">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl card-shadow border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            {columns.map((col) => (
                                <th key={col.key} className="text-left text-[11px] font-bold text-gray-500 uppercase px-4 py-3">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-8 text-sm text-gray-400">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, i) => (
                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                                            {col.render ? col.render(row) : String(row[col.key] ?? "")}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                        {pagination.total} resultats - Page {pagination.page}/{pagination.totalPages}
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Prec.
                        </button>
                        <button
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Suiv.
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
