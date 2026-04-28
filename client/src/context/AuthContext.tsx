'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { logout as logoutAction, setCredentials, updateUser } from '../redux/slices/authSlice';

interface AuthContextType {
    user: any;
    isAuthenticated: boolean;
    loading: boolean;
    logout: () => void;
    login: (user: any, accessToken: string) => void;
    updateUserInfo: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const dispatch = useDispatch<AppDispatch>();
    const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

    const logout = () => {
        dispatch(logoutAction());
    };

    const login = (user: any, accessToken: string) => {
        dispatch(setCredentials({ user, accessToken }));
    };

    const updateUserInfo = (user: any) => {
        dispatch(updateUser(user));
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, logout, login, updateUserInfo }}>
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
