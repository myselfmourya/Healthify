import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
    return (
        <img
            src="/logo.png"
            alt="Healthify Logo"
            className={cn("w-full h-full object-contain", className)}
        />
    );
}
