export default function LoadingSpinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
    const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className={`${sizes[size]} border-3 border-gray-200 border-t-primary rounded-full animate-spin`} />
        </div>
    );
}
