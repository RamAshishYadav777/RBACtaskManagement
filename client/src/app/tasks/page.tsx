'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from './tasks.module.css';
import api from '@/lib/api';
import { CheckCircle2, Clock, PlayCircle } from 'lucide-react';

interface Task {
    _id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
}

export default function MyTasksPage() {
    const queryClient = useQueryClient();

    // fetch tasks using React Query
    const { data: tasks, isLoading, error } = useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            const res = await api.get('/tasks');
            return res.data.data;
        },
    });

    // mutation for updating status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            await api.patch(`/tasks/${id}`, { status });
        },
        onSuccess: () => {
            // invalidate and refetch tasks
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const handleUpdateStatus = (id: string, status: string) => {
        updateStatusMutation.mutate({ id, status });
    };

    return (
        <DashboardLayout>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>My Assigned Tasks</h1>
                    <p className={styles.subtitle}>Track and update your daily goals</p>
                </div>
            </div>

            <div className={styles.grid}>
                {isLoading ? (
                    <div className={styles.loading}>Loading...</div>
                ) : error ? (
                    <div className={styles.error}>Failed to load tasks</div>
                ) : tasks?.length === 0 ? (
                    <div className={styles.empty}>No tasks assigned to you.</div>
                ) : (
                    tasks?.map((task: Task) => (
                        <div key={task._id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={`${styles.priority} ${styles[task.priority.toLowerCase()]}`}>{task.priority}</span>
                                <span className={styles.dueDate}>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                            <h3 className={styles.taskTitle}>{task.title}</h3>
                            <p className={styles.taskDesc}>{task.description}</p>
                            
                            <div className={styles.statusSection}>
                                <label>Status: <strong>{task.status}</strong></label>
                                <div className={styles.statusBtns}>
                                    <button 
                                        className={`${styles.statusBtn} ${task.status === 'Pending' ? styles.active : ''}`}
                                        disabled={updateStatusMutation.isPending}
                                        onClick={() => handleUpdateStatus(task._id, 'Pending')}
                                    >
                                        <Clock size={16} /> Pending
                                    </button>
                                    <button 
                                        className={`${styles.statusBtn} ${task.status === 'In Progress' ? styles.active : ''}`}
                                        disabled={updateStatusMutation.isPending}
                                        onClick={() => handleUpdateStatus(task._id, 'In Progress')}
                                    >
                                        <PlayCircle size={16} /> In Progress
                                    </button>
                                    <button 
                                        className={`${styles.statusBtn} ${task.status === 'Completed' ? styles.active : ''}`}
                                        disabled={updateStatusMutation.isPending}
                                        onClick={() => handleUpdateStatus(task._id, 'Completed')}
                                    >
                                        <CheckCircle2 size={16} /> Completed
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </DashboardLayout>
    );
}
