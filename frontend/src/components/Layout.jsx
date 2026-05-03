import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, Menu, Shield, History, Settings, KeySquare, Database, FileText } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import '../styles/layout.css';

export default function Layout({ isDark, setIsDark, user, userData, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const location = useLocation();

    // Update time every second
    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timerId);
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
    };

    const navLinks = [
        { path: '/dashboard', icon: KeySquare, label: 'Crypto Engine' },
        { path: '/vault', icon: Shield, label: 'Identity Vault' },
        { path: '/manage-credentials', icon: Database, label: 'Manage Credentials' },
        ...(userData?.role === 'admin' ? [{ path: '/admin-requests', icon: History, label: 'Vault Requests' }] : []),
        { path: '/settings', icon: Settings, label: 'Settings' }
    ];

    // Format current date and time
    const formattedDateTime = currentTime.toLocaleString(undefined, {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    return (
        <div className="app-layout">
            {sidebarOpen && (
                <div 
                    className="sidebar-overlay" 
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                    role="button"
                    tabIndex={0}
                />
            )}
            
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Main Navigation">
                <div className="sidebar-header">
                    <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setSidebarOpen(false)}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', fontWeight: 800 }}>
                            <Shield className="text-primary" size={28} style={{ color: 'var(--primary)' }} /> 
                            <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CryptoKMS</span>
                        </h2>
                    </Link>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: '500' }}>
                        {formattedDateTime}
                    </div>
                </div>
                
                <nav className="sidebar-nav">
                    {navLinks.map((link) => (
                        <Link key={link.path} to={link.path} style={{ textDecoration: 'none' }} onClick={() => setSidebarOpen(false)}>
                            <div className={`nav-item ${location.pathname === link.path ? 'active' : ''}`}>
                                <link.icon size={20} />
                                <span>{link.label}</span>
                            </div>
                        </Link>
                    ))}

                    {/* MINI PROJECT INFO SECTION */}
                    <div className="project-info-box">
                        <h4>Mini Project Team</h4>
                        <ul>
                            <li>1. Khurram Rashid, A70405223016</li>
                            <li>2. Kinza Zahra, A70405223156</li>
                            <li>3. Prapti Patil, A70405223086</li>
                            <li>4. Shreya Deshpande, A70405223198</li>
                        </ul>
                        <p><strong>Guide:</strong> Dr. Sarang Maruti Patil</p>
                        <div className="pdf-links">
                            <a href="/synopsis.pdf" target="_blank" rel="noreferrer"><FileText size={14} /> Synopsis</a>
                            <a href="/report.pdf" target="_blank" rel="noreferrer"><FileText size={14} /> Project Report</a>
                            <a href="/research-paper.pdf" target="_blank" rel="noreferrer"><FileText size={14} /> Research Paper</a>
                        </div>
                    </div>
                </nav>
            </aside>

            <div className="main-wrapper">
                {/* PRIMARY HEADER */}
                <header className="top-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                            className="menu-toggle" 
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open Menu"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
                        >
                            <Menu size={28} />
                        </button>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, display: sidebarOpen ? 'none' : 'block' }}>
                            {navLinks.find(l => l.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                    </div>
                    
                    <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <button 
                            onClick={toggleTheme} 
                            aria-label="Toggle Theme"
                            style={{ background: 'rgba(128, 128, 128, 0.1)', border: 'none', padding: '10px', borderRadius: '50%', color: 'var(--text)', cursor: 'pointer', transition: 'var(--transition)' }}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        
                        {user && (
                            <button 
                                onClick={() => signOut(auth)} 
                                className="btn exit-btn"
                                style={{ background: 'var(--danger)', padding: '10px 20px', borderRadius: '10px', boxShadow: 'none' }}
                            >
                                <LogOut size={18} /> <span className="exit-text">Exit</span>
                            </button>
                        )}
                    </div>
                </header>

                {/* DEDICATED PROJECT TITLE BANNER */}
                <div style={{
                    padding: '12px 20px',
                    background: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border)',
                    textAlign: 'center',
                    fontSize: 'clamp(12px, 2.5vw, 15px)',
                    fontWeight: '600',
                    color: 'var(--primary)',
                    lineHeight: '1.4',
                    boxShadow: 'var(--shadow-sm)',
                    wordWrap: 'break-word',
                    whiteSpace: 'normal'
                }}>
                    A Multi-Agent Web-Based System for AI-Driven Secure Cryptographic Key Generation with Entropy Validation and Security Analysis
                </div>

                <main className="page-content" id="main-content">
                    {children}
                </main>

                {/* GLOBAL FOOTER */}
                <footer className="global-footer">
                    &copy; {new Date().getFullYear()} CryptoKMS SaaS Platform. Developed for Academic Mini Project.
                </footer>
            </div>
        </div>
    );
}