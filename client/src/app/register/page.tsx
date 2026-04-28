'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../login/login.module.css'; // Reusing login styles for consistency
import { UserPlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Employee'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await api.post('/auth/register', formData);
            setSuccess(true);
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>Create Account</h1>
                    <p>Join our task management platform</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {success && (
                    <div style={{ background: '#ecfdf5', color: '#10b981', padding: '10px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>
                        Registration successful! Redirecting...
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            className={styles.input}
                            placeholder="Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className={styles.input}
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            name="password"
                            className={styles.input}
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Role</label>
                        <select 
                            name="role" 
                            className={styles.input} 
                            value={formData.role} 
                            onChange={handleChange}
                        >
                            <option value="Employee">Employee</option>
                            <option value="Manager">Manager</option>
                        </select>
                    </div>

                    <button type="submit" className={styles.button} disabled={isSubmitting || success}>
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={20} style={{ margin: '0 auto' }} />
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <UserPlus size={18} /> Sign Up
                            </span>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    Already have an account? 
                    <Link href="/login" className={styles.link}>Sign In</Link>
                </div>
            </div>
        </div>
    );
}
