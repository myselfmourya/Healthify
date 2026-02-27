import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface UserProfile {
    userId: string;
    name: string;
    age: number;
    gender: "male" | "female" | "other" | string;
    address: string;
    height: number; // cm
    weight: number; // kg
    diseases: string[];
    allergies?: string[];
    bloodGroup?: string;
    language: string;
    languageCode: string;
    avatar?: string;
    onboardingComplete: boolean;
    appMode: "beginner" | "advanced";
    isCaregiverMode?: boolean;
    lowConnectivityMode?: boolean;
    cardiacRisk?: string;
    diabetesRisk?: string;
    mentalScore?: string;
    lifestyleScore?: string;
}

const DEFAULT_PROFILE: UserProfile = {
    userId: "",
    name: "",
    age: 0,
    gender: "other",
    address: "",
    height: 0,
    weight: 0,
    diseases: [],
    language: "English",
    languageCode: "en",
    avatar: "",
    onboardingComplete: false,
    appMode: "beginner",
    lowConnectivityMode: false,
};

interface UserContextType {
    user: UserProfile;
    setUser: (profile: Partial<UserProfile>) => void;
    updateUser: (profile: Partial<UserProfile>) => Promise<void>;
    bmi: number;
    bmiCategory: string;
    isOnboarded: boolean;
    completeOnboarding: (profile: Partial<UserProfile>) => void;
}

const UserContext = createContext<UserContextType | null>(null);

function generateUserId() {
    return "user_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [activeMode, setActiveModeState] = useState<"Beginner" | "Advanced">(() => {
        const stored = localStorage.getItem("healthify_mode");
        return (stored === "Advanced" || stored === "Beginner") ? stored : "Beginner";
    });

    const setActiveMode = (mode: "Beginner" | "Advanced") => {
        localStorage.setItem("healthify_mode", mode);
        setActiveModeState(mode);
    };
    const [user, setUserState] = useState<UserProfile>(() => {
        try {
            const stored = localStorage.getItem("healthify_user");
            if (stored) return JSON.parse(stored);
        } catch { }
        return { ...DEFAULT_PROFILE, userId: generateUserId() };
    });

    const bmi = user.height > 0 ? user.weight / Math.pow(user.height / 100, 2) : 0;
    const bmiRound = Math.round(bmi * 10) / 10;
    const bmiCategory =
        bmi === 0 ? "Unknown" :
            bmi < 18.5 ? "Underweight" :
                bmi < 25 ? "Normal" :
                    bmi < 30 ? "Overweight" : "Obese";

    const setUser = useCallback((update: Partial<UserProfile>) => {
        setUserState((prev) => {
            const next = { ...prev, ...update };
            localStorage.setItem("healthify_user", JSON.stringify(next));
            return next;
        });
    }, []);

    const updateUser = useCallback(async (profile: Partial<UserProfile>) => {
        setUser(profile);
        try {
            await fetch(`/api/user/profile/${user.userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            });
        } catch { }
    }, [user.userId, setUser]);

    const completeOnboarding = useCallback((profile: Partial<UserProfile>) => {
        setUser({ ...profile, onboardingComplete: true });
    }, [setUser]);

    return (
        <UserContext.Provider
            value={{
                user,
                setUser,
                updateUser,
                bmi: bmiRound,
                bmiCategory,
                isOnboarded: user.onboardingComplete,
                completeOnboarding,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be used within UserProvider");
    return ctx;
}
