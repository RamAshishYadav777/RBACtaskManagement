'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import styles from './manage.module.css';
import api from '@/lib/api';
import { Plus, X, UserPlus, Loader2, Edit2, Trash2, Paperclip, FileText, Download, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
    _id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    dueDateFormatted?: string;
    attachments?: { filename: string; path: string; mimetype: string }[];
    assignedTo?: { _id: string; name: string; role: string; };
    assignedBy?: { _id: string; name: string; role: string; };
    assignmentChain?: { userId: string; name: string; role: string; assignedAt: string }[];
}

interface User {
    _id: string;
    name: string;
    role: string;
}

function ManageTasksContent() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [availableAssignees, setAvailableAssignees] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        assignedTo: '',
        dueDate: ''
    });
    const [attachments, setAttachments] = useState<FileList | null>(null);

    const searchParams = useSearchParams();
    const shouldCreate = searchParams.get('create');

    useEffect(() => {
        if (shouldCreate === 'true') {
            setShowModal(true);
        }
    }, [shouldCreate]);

    useEffect(() => {
        setMounted(true);
        // wait until user is loaded from localStorage before filtering assignees
        if (!user?.role) return;

        const fetchData = async () => {
            try {
                const [tasksRes, usersRes] = await Promise.all([
                    api.get('/tasks'),
                    api.get('/users')
                ]);
                setTasks(tasksRes.data.data);

                // filter assignees based on the logged-in user's role
                const allUsers = usersRes.data.data;
                if (user.role === 'Admin') {
                    setAvailableAssignees(allUsers.filter((u: any) => u.role === 'Manager'));
                } else if (user.role === 'Manager') {
                    setAvailableAssignees(allUsers.filter((u: any) => u.role === 'Employee'));
                } else if (user.role === 'Super Admin') {
                    setAvailableAssignees(allUsers.filter((u: any) => u._id !== user._id));
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.role]);

    const handleEdit = (task: Task) => {
        setEditingTask(task);
        setFormData({
            title: task.title,
            description: task.description,
            priority: task.priority,
            assignedTo: task.assignedTo?._id || '',
            dueDate: new Date(task.dueDate).toISOString().split('T')[0]
        });
        setShowModal(true);
    };

    const confirmDelete = (id: string, title: string) => {
        toast(
            (t) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>Delete Task?</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        "<strong>{title}</strong>" will be permanently removed.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={async () => {
                                toast.dismiss(t.id);
                                try {
                                    await api.delete(`/tasks/${id}`);
                                    setTasks(prev => prev.filter((tk: any) => tk._id !== id));
                                    toast.success('Task deleted successfully');
                                } catch (err: any) {
                                    toast.error(err.response?.data?.message || 'Failed to delete task');
                                }
                            }}
                            style={{
                                background: '#ef4444', color: 'white', border: 'none',
                                padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                                fontWeight: 600, fontSize: '13px'
                            }}
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            style={{
                                background: '#f1f5f9', color: '#334155', border: 'none',
                                padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                                fontWeight: 600, fontSize: '13px'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ),
            { duration: 10000 }
        );
    };

    const handleDelete = async (id: string) => {
        // handled inside confirmDelete
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(e.target.files);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('priority', formData.priority);
        data.append('assignedTo', formData.assignedTo);
        data.append('dueDate', formData.dueDate);

        if (attachments) {
            for (let i = 0; i < attachments.length; i++) {
                data.append('attachments', attachments[i]);
            }
        }

        try {
            if (editingTask) {
                const res = await api.patch(`/tasks/${editingTask._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setTasks(tasks.map((t: any) => t._id === editingTask._id ? res.data.data : t));
                toast.success('Task updated successfully!');
            } else {
                const res = await api.post('/tasks', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setTasks([res.data.data, ...tasks]);
                toast.success('Task created successfully!');
            }
            setShowModal(false);
            setEditingTask(null);
            setFormData({ title: '', description: '', priority: 'Medium', assignedTo: '', dueDate: '' });
            setAttachments(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to process task');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return <DashboardLayout><div className={styles.loading}>Loading...</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Task Management</h1>
                    <p className={styles.subtitle}>
                        {user?.role === 'Super Admin'
                            ? 'Overview of all tasks and assignment flows'
                            : user?.role === 'Admin'
                            ? 'Create and assign tasks to your team'
                            : 'View and reassign tasks assigned to you'}
                    </p>
                </div>
                {user?.role === 'Admin' && (
                    <button className={styles.createBtn} onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        <span>New Task</span>
                    </button>
                )}
            </div>

            <div className={styles.grid}>
                {loading ? (
                    <div className={styles.loading}>Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className={styles.empty}>No tasks created yet.</div>
                ) : (
                    tasks.map((task: any) => (
                        <div key={task._id} className={styles.taskCard}>
                            <div className={styles.taskHeader}>
                                <span className={`${styles.priority} ${styles[task.priority.toLowerCase()]}`}>
                                    {task.priority}
                                </span>
                                <span className={`${styles.status} ${styles[task.status.toLowerCase().replace(' ', '')]}`}>
                                    {task.status}
                                </span>
                            </div>
                            <h3 className={styles.taskTitle}>{task.title}</h3>
                            <p className={styles.taskDesc}>{task.description}</p>

                            <div className={styles.taskMeta}>
                                <div className={styles.metaRow}>
                                    <User size={13} />
                                    <span className={styles.metaLabel}>Assigned to:</span>
                                    <span className={styles.metaValue}>
                                        {task.assignedTo?.name || 'Unassigned'}
                                        {task.assignedTo?.role && (
                                            <span className={styles.roleBadge}>{task.assignedTo.role}</span>
                                        )}
                                    </span>
                                </div>
                                <div className={styles.metaRow}>
                                    <Calendar size={13} />
                                    <span className={styles.metaLabel}>Due:</span>
                                    <span className={`${styles.metaValue} ${new Date(task.dueDate) < new Date() && task.status !== 'Completed' ? styles.overdue : ''}`}>
                                        {task.dueDateFormatted || new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {task.attachments && task.attachments.length > 0 && (
                                <div className={styles.attachments}>
                                    <div className={styles.attachmentLabel}>
                                        <Paperclip size={13} />
                                        <span>{task.attachments.length} attachment{task.attachments.length > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className={styles.attachmentList}>
                                        {task.attachments.map((file: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={`http://localhost:5000/${file.path.replace(/\\/g, '/')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.attachmentItem}
                                                title={file.filename}
                                            >
                                                <FileText size={13} />
                                                <span>{file.filename.length > 20 ? file.filename.slice(0, 20) + '...' : file.filename}</span>
                                                <Download size={12} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Super Admin: Full assignment chain */}
                            {user?.role === 'Super Admin' && task.assignmentChain && task.assignmentChain.length > 0 && (
                                <div className={styles.chainContainer}>
                                    <span className={styles.chainTitle}>Assignment Flow</span>
                                    <div className={styles.chain}>
                                        {task.assignmentChain.map((step: any, idx: number) => (
                                            <React.Fragment key={idx}>
                                                <div className={styles.chainStep}>
                                                    <span className={`${styles.chainRole} ${styles['chain_' + step.role.toLowerCase().replace(' ', '_')]}`}>
                                                        {step.role}
                                                    </span>
                                                    <span className={styles.chainName}>{step.name}</span>
                                                </div>
                                                {idx < task.assignmentChain!.length - 1 && (
                                                    <span className={styles.chainArrow}>→</span>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.taskFooter}>
                                <div className={styles.meta}>
                                    <UserPlus size={14} />
                                    <span>{task.assignedTo?.name || 'Unassigned'} <em style={{fontSize:'11px',color:'#94a3b8'}}>({task.assignedTo?.role})</em></span>
                                </div>
                                <div className={styles.actions}>
                                    <button className={styles.actionBtn} onClick={() => handleEdit(task)} title="Edit Task">
                                        <Edit2 size={16} />
                                    </button>
                                    <button className={`${styles.actionBtn} ${styles.delete}`} onClick={() => confirmDelete(task._id, task.title)} title="Delete Task">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
                            <button onClick={() => {
                                setShowModal(false);
                                setEditingTask(null);
                                setFormData({ title: '', description: '', priority: 'Medium', assignedTo: '', dueDate: '' });
                            }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.field}>
                                <label>Task Title</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter task title" 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Description</label>
                                <textarea 
                                    placeholder="Describe the task details..." 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Priority</label>
                                    <select 
                                        value={formData.priority}
                                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label>Assign To</label>
                                    <select 
                                        value={formData.assignedTo}
                                        onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                                        required
                                    >
                                        <option value="">{availableAssignees.length === 0 ? 'No Assignees Found' : 'Select Assignee'}</option>
                                        {availableAssignees.map((emp: any) => (
                                            <option key={emp._id} value={emp._id}>{emp.name} ({emp.role})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className={styles.field}>
                                <label>Due Date</label>
                                <input 
                                    type="date" 
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Attachments (Max 5 files)</label>
                                <div className={styles.fileInputWrapper}>
                                    <input 
                                        type="file" 
                                        multiple 
                                        onChange={handleFileChange}
                                        id="file-upload"
                                        className={styles.fileInput}
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                    />
                                    <label htmlFor="file-upload" className={styles.fileLabel}>
                                        <Paperclip size={18} />
                                        <span>{attachments ? `${attachments.length} files selected` : 'Choose files'}</span>
                                    </label>
                                </div>
                            </div>
                            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : editingTask ? 'Update Task' : 'Create Task'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default function ManageTasksPage() {
    return (
        <Suspense fallback={<DashboardLayout><div>Loading...</div></DashboardLayout>}>
            <ManageTasksContent />
        </Suspense>
    );
}
