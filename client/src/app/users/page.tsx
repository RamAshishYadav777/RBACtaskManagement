'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import styles from '../dashboard/dashboard.module.css'; // Reusing some table styles
import api from '@/lib/api';
import { UserCog, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
}

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const fetchUsers = async () => {
            try {
                const res = await api.get('/users');
                setUsers(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/users/${id}/status`, { isActive: !currentStatus });
            setUsers(users.map((u: any) => u._id === id ? { ...u, isActive: !currentStatus } : u));
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const changeRole = async (id: string, newRole: string) => {
        const result = await Swal.fire({
            title: 'Change Role?',
            text: `Are you sure you want to change the role to ${newRole}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Yes, change it!'
        });

        if (!result.isConfirmed) return;

        try {
            await api.patch(`/users/${id}/role`, { role: newRole });
            setUsers(users.map((u: any) => u._id === id ? { ...u, role: newRole } : u));
            toast.success('Role updated successfully');
        } catch (err) {
            toast.error('Only Super Admin can change roles');
        }
    };

    const deleteUser = async (id: string) => {
        const result = await Swal.fire({
            title: 'Delete User?',
            text: "This action cannot be undone!",
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Yes, delete user'
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter((u: any) => u._id !== id));
            toast.success('User deleted successfully');
        } catch (err) {
            toast.error('Failed to delete user');
        }
    };

    if (!mounted) return <DashboardLayout><div className={styles.loading}>Loading...</div></DashboardLayout>;

    if (!['Super Admin', 'Admin', 'Manager'].includes(currentUser?.role || '')) {
        return <DashboardLayout><div className={styles.empty}>Access Denied</div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>User Management</h1>
                    <p className={styles.subtitle}>Manage roles and account permissions</p>
                </div>
            </div>

            <div className={styles.tasksSection}>
                <div className={styles.taskTable}>
                    <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 1fr 1fr 1.5fr' }}>
                        <span>Name & Email</span>
                        <span>Role</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>
                    {loading ? (
                        <div className={styles.loading}>Loading users...</div>
                    ) : (
                        users.map((user: any) => (
                            <div key={user._id} className={styles.tableRow} style={{ gridTemplateColumns: '2fr 1fr 1fr 1.5fr' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className={styles.taskTitle}>{user.name}</span>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</span>
                                </div>
                                <span>
                                    <select 
                                        className={styles.status} 
                                        value={user.role}
                                        onChange={(e) => changeRole(user._id, e.target.value)}
                                        disabled={currentUser?.role !== 'Super Admin' || user._id === currentUser.id}
                                        style={{ border: 'none', background: '#f8fafc', padding: '4px 8px' }}
                                    >
                                        <option value="Super Admin">Super Admin</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Employee">Employee</option>
                                    </select>
                                </span>
                                <span>
                                    <span 
                                        className={`${styles.status} ${user.isActive ? styles.completed : styles.high}`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => toggleStatus(user._id, user.isActive)}
                                    >
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </span>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {['Super Admin', 'Admin'].includes(currentUser?.role || '') && (
                                        <>
                                            <button 
                                                className={styles.iconBtn} 
                                                onClick={() => toggleStatus(user._id, user.isActive)}
                                                title={user.isActive ? "Deactivate" : "Activate"}
                                            >
                                                {user.isActive ? <ShieldCheck size={18} color="#10b981" /> : <ShieldAlert size={18} color="#ef4444" />}
                                            </button>
                                            {currentUser?.role === 'Super Admin' && user._id !== currentUser.id && (
                                                <button className={styles.iconBtn} onClick={() => deleteUser(user._id)}>
                                                    <Trash2 size={18} color="#ef4444" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
