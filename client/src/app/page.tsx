'use client';

import React from 'react';
import Link from 'next/link';
import { 
    CheckCircle2, 
    Shield, 
    Zap, 
    BarChart3,
    ArrowRight
} from 'lucide-react';
import styles from './landing.module.css';

export default function LandingPage() {
    return (
        <div className={styles.container}>
            <nav className={styles.nav}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>T</div>
                    <span>TaskMaster</span>
                </div>
                <div className={styles.navLinks}>
                    <Link href="/login" className={styles.loginBtn}>Sign In</Link>
                    <Link href="/register" className={styles.registerBtn}>Get Started</Link>
                </div>
            </nav>

            <main className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1>Manage Tasks with <br /><span>Precision & Power</span></h1>
                    <p>The ultimate role-based task management system for modern teams. Secure, scalable, and stunningly beautiful.</p>
                    <div className={styles.heroBtns}>
                        <Link href="/register" className={styles.primaryBtn}>
                            Start Free Trial <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
                
                <div className={styles.heroImage}>
                    <div className={styles.mockup}>
                        <div className={styles.mockupHeader}>
                            <div className={styles.dots}><span /><span /><span /></div>
                        </div>
                        <div className={styles.mockupBody}>
                             <div className={styles.skeletonLine} style={{ width: '40%' }} />
                             <div className={styles.skeletonGrid}>
                                <div className={styles.skeletonCard} />
                                <div className={styles.skeletonCard} />
                                <div className={styles.skeletonCard} />
                                <div className={styles.skeletonCard} />
                             </div>
                             <div className={styles.skeletonLine} style={{ width: '100%', height: '100px' }} />
                        </div>
                    </div>
                </div>
            </main>

            <section className={styles.features}>
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: '#e0e7ff', color: '#6366f1' }}>
                        <Shield size={24} />
                    </div>
                    <h3>RBAC Security</h3>
                    <p>Granular permissions for Super Amdins, Admins, Managers, and Employees.</p>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: '#ecfdf5', color: '#10b981' }}>
                        <Zap size={24} />
                    </div>
                    <h3>JWT Auth</h3>
                    <p>Secure authentication with short-lived access tokens and refresh tokens.</p>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: '#fff7ed', color: '#f59e0b' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <h3>Task Lifecycle</h3>
                    <p>Track tasks from pending to completed with real-time status updates.</p>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: '#fef2f2', color: '#ef4444' }}>
                        <BarChart3 size={24} />
                    </div>
                    <h3>Performance</h3>
                    <p>Blazing fast Next.js frontend with optimized MongoDB queries.</p>
                </div>
            </section>

            <footer className={styles.footer}>
                <p>&copy; 2024 TaskMaster. All rights reserved.</p>
            </footer>
        </div>
    );
}
