'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface AuthContextType {
    user: any;
    isAuthenticated: boolean;
    loading: boolean;
    login: (user: any, accessToken: string) => void;
    logout: () => void;
    updateUserInfo: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // rehydrate user from localStorage on every page load/refresh
    useEffect(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                setUser(parsed);
                setIsAuthenticated(true);
            }
        } catch (_) {
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = (userData: any, accessToken: string) => {
        setUser(userData);
        setIsAuthenticated(true);
        // only persist user info — token lives in the httpOnly cookie set by the server
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (_) {
            // ignore errors on logout
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('user');
        }
    };

    const updateUserInfo = (userData: any) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUserInfo }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
