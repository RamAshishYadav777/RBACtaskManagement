'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './login.module.css';
import api from '@/lib/api';
import { LogIn, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setError('');
        setIsSubmitting(true);
        try {
            const response = await api.post('/auth/login', { email: email.trim(), password });
            
            if (response.data.success) {
                const { user, accessToken } = response.data.data;
                login(user, accessToken);
                
                // Using window.location.href as a more reliable redirect in some environments
                window.location.href = '/dashboard';
            } else {
                setError(response.data.message || 'Login failed');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message;
            setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>Welcome Back</h1>
                    <p>Enter your credentials to access your account</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.button} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={20} style={{ margin: '0 auto' }} />
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <LogIn size={18} /> Sign In
                            </span>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    Don't have an account? 
                    <Link href="/register" className={styles.link}>Sign Up</Link>
                </div>
            </div>
        </div>
    );
}
