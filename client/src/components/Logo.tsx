import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
    return (
        <svg
            className={cn("w-full h-full text-blue-600", className)}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Left and Right earpieces */}
            <circle cx="42" cy="20" r="4" fill="currentColor" />
            <circle cx="58" cy="20" r="4" fill="currentColor" />

            {/* The cord forming a heart shape */}
            <path
                d="M 42 20 
                   C 42 10, 25 10, 15 25 
                   C 5 45, 15 70, 50 90
                   C 85 70, 95 45, 85 25
                   C 75 10, 58 10, 58 20
                   L 58 35
                   C 58 45, 50 50, 50 60"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* The chest piece / stethoscope head */}
            <circle cx="50" cy="65" r="9" stroke="currentColor" strokeWidth="6" />
            <circle cx="50" cy="65" r="3" fill="currentColor" />
        </svg>
    );
}
