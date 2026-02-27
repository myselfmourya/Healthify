// Simple hook to read URL search params (wouter-compatible)
export function useSearchParams() {
    return new URLSearchParams(window.location.search);
}
