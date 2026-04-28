'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import styles from './dashboard.module.css';
import { 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Plus,
    ArrowUpRight,
    TrendingUp
} from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className={styles.statCard}>
        <div className={styles.statInfo}>
            <p className={styles.statTitle}>{title}</p>
            <h3 className={styles.statValue}>{value}</h3>
            {trend && <div className={styles.statTrend}><TrendingUp size={14} /> {trend} this week</div>}
        </div>
        <div className={styles.statIcon} style={{ backgroundColor: `${color}15`, color }}>
            <Icon size={24} />
        </div>
    </div>
);

interface Task {
    _id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    createdAt: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const fetchTasks = async () => {
            try {
                const res = await api.get('/tasks');
                setTasks(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    // Calculate trends and stats
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const recentTasks = tasks.filter(t => new Date(t.createdAt) > last7Days).length;
    const totalTrend = tasks.length > 0 ? `+${Math.round((recentTasks / tasks.length) * 100)}%` : '0%';

    const reminders = tasks
        .filter(t => t.status !== 'Completed')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3);

    const stats = [
        { title: 'Total Tasks', value: tasks.length, icon: CheckCircle2, color: '#6366f1', trend: totalTrend },
        { title: 'Pending', value: tasks.filter((t: Task) => t.status === 'Pending').length, icon: Clock, color: '#f59e0b' },
        { title: 'Completed', value: tasks.filter((t: Task) => t.status === 'Completed').length, icon: CheckCircle2, color: '#10b981' },
        { title: 'High Priority', value: tasks.filter((t: Task) => t.priority === 'High').length, icon: AlertCircle, color: '#ef4444' },
    ];


    return (
        <DashboardLayout>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Welcome back, {mounted ? user?.name : ''}!</h1>
                    <p className={styles.subtitle}>Here's what's happening with your tasks today.</p>
                </div>
                {mounted && ['Manager', 'Admin'].includes(user?.role || '') && (
                    <button className={styles.createBtn} onClick={() => router.push('/tasks/manage?create=true')}>
                        <Plus size={20} />
                        <span>Create Task</span>
                    </button>
                )}
            </div>

            <div className={styles.statsGrid}>
                {stats.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.leftColumn}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>Recent Tasks</h3>
                            <button className={styles.viewAllBtn} onClick={() => router.push('/tasks/manage')}>View All</button>
                        </div>
                        
                        <div className={styles.taskTable}>
                            <div className={styles.tableHeader}>
                                <span>Task Title</span>
                                <span>Status</span>
                                <span>Priority</span>
                                <span>Due Date</span>
                            </div>
                            {loading ? (
                                <div className={styles.loading}>Loading tasks...</div>
                            ) : tasks.length === 0 ? (
                                <div className={styles.empty}>No tasks found.</div>
                            ) : (
                                tasks.slice(0, 5).map((task: Task) => (
                                    <div key={task._id} className={styles.tableRow}>
                                        <span className={styles.taskTitle}>{task.title}</span>
                                        <span>
                                            <span className={`${styles.status} ${styles[task.status.toLowerCase().replace(' ', '')]}`}>
                                                {task.status}
                                            </span>
                                        </span>
                                        <span>
                                            <span className={`${styles.priority} ${styles[task.priority.toLowerCase()]}`}>
                                                {task.priority}
                                            </span>
                                        </span>
                                        <span className={styles.date}>{new Date(task.dueDate).toLocaleDateString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Upcoming Deadlines</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {reminders.length > 0 ? reminders.map(reminder => (
                                <div key={reminder._id} className={styles.reminderItem}>
                                    <div className={styles.reminderIcon}><AlertCircle size={16} /></div>
                                    <div className={styles.reminderText}>
                                        <p>{reminder.title}</p>
                                        <span>Due {new Date(reminder.dueDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            )) : (
                                <p style={{ fontSize: '13px', color: '#64748b' }}>No upcoming deadlines.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
