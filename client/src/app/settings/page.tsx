'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import styles from './settings.module.css';
import { User, Shield, Bell, Lock, Info, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const { user, updateUserInfo } = useAuth();
    const [mounted, setMounted] = React.useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');

    React.useEffect(() => {
        setMounted(true);
        if (user) setName(user.name);
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await api.patch('/users/profile', { name });
            updateUserInfo(res.data.data);
            toast.success('Profile updated successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;


    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Settings</h1>
                    <p style={{ color: '#64748b' }}>Manage your account settings and preferences</p>
                </div>

                <div className={styles.settingsCard}>
                    {/* Profile Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <User size={20} className={styles.infoIcon} />
                            Profile Information
                        </h2>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Full Name</label>
                                <input 
                                    type="text" 
                                    className={styles.input} 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email Address</label>
                                <input 
                                    type="email" 
                                    className={styles.input} 
                                    defaultValue={user?.email} 
                                    disabled
                                />
                            </div>
                        </div>
                        <div className={styles.infoBox}>
                            <Info size={18} className={styles.infoIcon} />
                            <p className={styles.infoText}>
                                Your email address is managed by the administrator and cannot be changed here.
                            </p>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '40px 0' }} />

                    {/* Role Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Shield size={20} style={{ color: '#8b5cf6' }} />
                            Account Security & Role
                        </h2>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Current Role</label>
                                <input 
                                    type="text" 
                                    className={styles.input} 
                                    value={user?.role || ''} 
                                    disabled
                                    style={{ color: '#8b5cf6', fontWeight: 600 }}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Account Status</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '44px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '40px 0' }} />

                    {/* Notifications Section (Mock) */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Bell size={20} style={{ color: '#f59e0b' }} />
                            Notifications
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600 }}>Email Notifications</p>
                                    <p style={{ fontSize: '12px', color: '#64748b' }}>Receive updates about your assigned tasks via email.</p>
                                </div>
                                <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600 }}>Task Reminders</p>
                                    <p style={{ fontSize: '12px', color: '#64748b' }}>Get notified when a task is nearing its due date.</p>
                                </div>
                                <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
