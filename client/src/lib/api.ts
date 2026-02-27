import debounce from "lodash.debounce";

interface AIRequestConfig {
    endpoint: string;
    payload: Record<string, any>;
    retries?: number;
    delay?: number;
}

class AIClientInstance {
    private static instance: AIClientInstance;
    private requestQueue: Set<string> = new Set();

    private constructor() { }

    public static getInstance(): AIClientInstance {
        if (!AIClientInstance.instance) {
            AIClientInstance.instance = new AIClientInstance();
        }
        return AIClientInstance.instance;
    }

    // Exponential backoff executor for 429 requests
    private async executeWithBackoff(url: string, options: RequestInit, retries = 3, backoffTime = 1000): Promise<Response> {
        try {
            const response = await fetch(url, options);

            if (response.status === 429 && retries > 0) {
                console.warn(`[AIClient] 429 Too Many Requests. Retrying in ${backoffTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                return this.executeWithBackoff(url, options, retries - 1, backoffTime * 2);
            }

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Error ${response.status}: ${errText}`);
            }
            return response;
        } catch (error) {
            if (retries > 0) {
                console.warn(`[AIClient] Network error. Retrying in ${backoffTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                return this.executeWithBackoff(url, options, retries - 1, backoffTime * 2);
            }
            throw error;
        }
    }

    public async fetchAI<T>(config: AIRequestConfig): Promise<T> {
        const cacheKey = JSON.stringify(config);
        if (this.requestQueue.has(cacheKey)) {
            throw new Error("Duplicate request ignored");
        }
        this.requestQueue.add(cacheKey);

        try {
            const response = await this.executeWithBackoff(config.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config.payload)
            });
            return await response.json();
        } finally {
            this.requestQueue.delete(cacheKey);
        }
    }
}

// Export a singleton instance globally
export const AIClient = AIClientInstance.getInstance();

// Exported standard debounced wrapper for text inputs
export const debouncedAIFetch = debounce(
    async (
        config: AIRequestConfig,
        onSuccess: (data: any) => void,
        onError: (err: any) => void
    ) => {
        try {
            const data = await AIClient.fetchAI(config);
            onSuccess(data);
        } catch (e: any) {
            // Ignore duplicate throw to prevent UI flickering
            if (e.message !== "Duplicate request ignored") {
                onError(e.message || "Failed to fetch AI response");
            }
        }
    },
    800 // 800ms debounce
);
