'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout } from '@/redux/slices/authSlice';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUiStore } from '@/store/useUiStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
    LayoutDashboard, 
    CheckSquare, 
    Users, 
    Settings, 
    LogOut, 
    Menu, 
    X,
    Bell,
    User as UserIcon
} from 'lucide-react';
import styles from './DashboardLayout.module.css';

const SidebarItem = ({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active: boolean }) => (
    <Link href={href} className={`${styles.sidebarItem} ${active ? styles.active : ''}`}>
        <Icon size={20} />
        <span>{label}</span>
    </Link>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const { isSidebarOpen, toggleSidebar, closeSidebar } = useUiStore();
    const [mounted, setMounted] = React.useState(false);
    const [notifications, setNotifications] = React.useState<any[]>([]);
    const [showNotifications, setShowNotifications] = React.useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    React.useEffect(() => {
        setMounted(true);
        if (user) {
            fetchNotifications();
            // poll for notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark notifications as read', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            dispatch(logout());
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (error) {
            console.error('Logout failed', error);
            dispatch(logout());
            router.push('/login');
        }
    };

    const menuItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['Super Admin', 'Admin', 'Manager', 'Employee'] },
        { href: '/tasks', icon: CheckSquare, label: 'My Tasks', roles: ['Employee'] },
        { href: '/tasks/manage', icon: CheckSquare, label: 'Manage Tasks', roles: ['Admin', 'Manager'] },
        { href: '/users', icon: Users, label: 'User Management', roles: ['Super Admin', 'Admin', 'Manager'] },
        { href: '/settings', icon: Settings, label: 'Settings', roles: ['Super Admin', 'Admin', 'Manager', 'Employee'] },
    ];

    const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>T</div>
                        <span>TaskMaster</span>
                    </div>
                    <button className={styles.closeBtn} onClick={closeSidebar}>
                        <X size={20} />
                    </button>
                </div>

                <nav className={styles.sidebarNav}>
                    {mounted && filteredItems.map((item) => (
                        <SidebarItem 
                            key={item.href} 
                            href={item.href} 
                            icon={item.icon} 
                            label={item.label} 
                            active={pathname === item.href} 
                        />
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={styles.main}>
                <header className={styles.topbar}>
                    <button className={styles.menuBtn} onClick={toggleSidebar}>
                        <Menu size={24} />
                    </button>

                    <div className={styles.topbarRight}>
                        <div className={styles.notificationWrapper}>
                            <button className={styles.iconBtn} onClick={() => setShowNotifications(!showNotifications)}>
                                <Bell size={20} />
                                {mounted && unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                            </button>

                            {showNotifications && (
                                <div className={styles.notificationDropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <h3>Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button className={styles.markReadBtn} onClick={markAllAsRead}>
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>
                                    <div className={styles.notificationList}>
                                        {notifications.length > 0 ? (
                                            notifications.map((n) => (
                                                <div key={n._id} className={`${styles.notificationItem} ${!n.isRead ? styles.unread : ''}`}>
                                                    <span className={styles.notificationTitle}>{n.title}</span>
                                                    <p className={styles.notificationMsg}>{n.message}</p>
                                                    <span className={styles.notificationTime}>
                                                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className={styles.emptyNotifications}>
                                                No new notifications
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className={styles.profile}>
                            <div className={styles.profileInfo}>
                                <span className={styles.profileName}>{mounted ? user?.name : ''}</span>
                                <span className={styles.profileRole}>{mounted ? user?.role : ''}</span>
                            </div>
                            <div className={styles.avatar}>
                                <UserIcon size={20} />
                            </div>
                        </div>
                    </div>
                </header>


                <main className={styles.content}>
                    {children}
                </main>
            </div>
            
            {/* Overlay */}
            {isSidebarOpen && <div className={styles.overlay} onClick={closeSidebar} />}
        </div>
    );
}
