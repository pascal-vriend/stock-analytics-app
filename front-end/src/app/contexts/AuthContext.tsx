// app/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AuthContextType = {
    accessToken: string | null;
    userId: string | null;
    setAccessToken: (token: string | null) => void;
    refreshAccessToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        refreshAccessToken();
    }, []);

    // Persist token to localStorage
    useEffect(() => {
        if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            fetchUserId(accessToken);
        } else {
            localStorage.removeItem('accessToken');
            setUserId(null);
        }
    }, [accessToken]);

    // Refresh access token using refresh token cookie
    async function refreshAccessToken(): Promise<string | null> {
        try {
            console.log('[AuthContext] calling /auth/refresh');
            const res = await fetch('https://localhost:8080/auth/refresh', {
                method: 'POST',
                credentials: 'include',
            });
            console.log('[AuthContext] /auth/refresh returned', res.status);
            if (!res.ok) {
                console.log("failed to refresh token");
                setAccessToken(null);
                setUserId(null);
                return null;
            }
            const body = await res.json();
            setAccessToken(body.accessToken);
            return body.accessToken as string;
        } catch {
            setAccessToken(null);
            setUserId(null);
            return null;
        }
    }


    async function fetchUserId(token: string) {
        try {
            console.log('[AuthContext] fetchUserId called with token:', token);

            const res = await fetch('https://localhost:8080/auth/me', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('[AuthContext] Response status:', res.status);
            console.log('[AuthContext] Response headers:', Array.from(res.headers.entries()));

            if (!res.ok) {
                const text = await res.text();
                console.error('[AuthContext] Response body (error):', text);
                throw new Error(`Failed to fetch user info (status ${res.status})`);
            }

            const body = await res.json();
            console.log('[AuthContext] Response body (success):', body);

            if (!body.id) {
                console.warn('[AuthContext] No "id" field in response');
                setUserId(null);
            } else {
                setUserId(body.id);
            }
        } catch (err) {
            console.error('[AuthContext] Failed to fetch user ID', err);
            setUserId(null);
        }
    }


    return (
        <AuthContext.Provider value={{ accessToken, userId, setAccessToken, refreshAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
