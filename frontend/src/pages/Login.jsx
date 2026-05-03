import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { Mail, Key, ShieldCheck, User, Phone, Target, Users, BookOpen, FileText } from 'lucide-react';

// Add your new admin email to this list!
const ADMIN_EMAILS = ['khurramrashid0786@gmail.com', 'khurramrashid786@gmail.com'];

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', mobile: '', purpose: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Creates a brand new user profile
    const saveUserProfile = async (uid, email, name, mobile, purpose) => {
        const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'user';
        await setDoc(doc(db, "users", uid), { name, email, mobile, purpose, role });
    };

    // Forces existing accounts to upgrade to Admin if added to the list later
    const enforceAdminRole = async (uid, email) => {
        if (ADMIN_EMAILS.includes(email)) {
            await updateDoc(doc(db, "users", uid), { role: 'admin' });
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            if (isRegistering) {
                const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                await saveUserProfile(cred.user.uid, formData.email, formData.name, formData.mobile, formData.purpose);
            } else {
                const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                await enforceAdminRole(cred.user.uid, cred.user.email); // Force upgrade on login
            }
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        try {
            const res = await signInWithPopup(auth, googleProvider);
            const userDoc = await getDoc(doc(db, 'users', res.user.uid));
            if (!userDoc.exists()) {
                await saveUserProfile(res.user.uid, res.user.email, res.user.displayName || 'Google User', 'Not Provided', 'General Access');
            } else {
                await enforceAdminRole(res.user.uid, res.user.email); // Force upgrade on login
            }
        } catch (err) {
            setError('Google Login Failed.');
        }
    };

    return (
        <div className="login-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            
            {/* Embedded Responsive Styles */}
            <style>
                {`
                    .login-grid {
                        display: grid;
                        grid-template-columns: 1fr 450px 1fr;
                        gap: 24px;
                        width: 100%;
                        max-width: 1400px;
                        align-items: stretch;
                    }
                    .grid-card {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        animation: fadeIn 0.6s ease-out;
                    }
                    @media (max-width: 1024px) {
                        .login-grid {
                            grid-template-columns: 1fr;
                            max-width: 500px;
                        }
                        /* Custom Mobile Ordering */
                        .order-mobile-login { order: 1; }
                        .order-mobile-project { order: 2; }
                        .order-mobile-team { order: 3; }
                    }
                `}
            </style>

            <div className="login-grid">
                
                {/* LEFT CARD: Team Details (Mobile Order: 3) */}
                <div className="card grid-card order-mobile-team">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--primary)' }}>
                            <Users size={28} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text)' }}>Mini Project Team</h3>
                            <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold', marginTop: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                Semester 6 • Batch 2023-27
                            </div>
                        </div>
                    </div>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-muted)' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>1.</span> Khurram Rashid (A70405223016)
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>2.</span> Kinza Zahra (A70405223156)
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>3.</span> Prapti Patil (A70405223086)
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>4.</span> Shreya Deshpande (A70405223198)
                        </li>
                    </ul>

                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                        <p style={{ margin: 0, color: 'var(--text)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Project Guide</p>
                        <p style={{ margin: '8px 0 0 0', color: 'var(--primary)', fontSize: '1.1rem', fontWeight: '600' }}>Dr. Sarang Maruti Patil</p>
                    </div>
                </div>

                {/* MIDDLE CARD: Login Form (Mobile Order: 1) */}
                <div className="card grid-card order-mobile-login" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                        <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '16px', borderRadius: '50%', color: 'white', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)' }}>
                            <ShieldCheck size={48} />
                        </div>
                    </div>
                    
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: 800 }}>SaaS Access Hub</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1rem' }}>
                        {isRegistering ? 'Provision your Enterprise Clearance' : 'Authenticate to access the CryptoKMS'}
                    </p>

                    {error && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '10px', border: '1px solid var(--danger)', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                        {isRegistering && (
                            <>
                                <div style={{ position: 'relative' }}>
                                    <User size={20} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                                    <input type="text" placeholder="Full Name" required value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} className="input-field" style={{ paddingLeft: '48px' }} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={20} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                                    <input type="tel" placeholder="Mobile Number" required value={formData.mobile} onChange={(e)=>setFormData({...formData, mobile: e.target.value})} className="input-field" style={{ paddingLeft: '48px' }} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Target size={20} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                                    <input type="text" placeholder="Purpose of Use" required value={formData.purpose} onChange={(e)=>setFormData({...formData, purpose: e.target.value})} className="input-field" style={{ paddingLeft: '48px' }} />
                                </div>
                            </>
                        )}
                        <div style={{ position: 'relative' }}>
                            <Mail size={20} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                            <input type="email" placeholder="Email Address" required value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} className="input-field" style={{ paddingLeft: '48px' }} />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Key size={20} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                            <input type="password" placeholder="Password" required value={formData.password} onChange={(e)=>setFormData({...formData, password: e.target.value})} className="input-field" style={{ paddingLeft: '48px' }} />
                        </div>
                        <button type="submit" className="btn" disabled={loading} style={{ marginTop: '8px', padding: '16px' }}>
                            {loading ? <span className="spinner">Processing...</span> : (isRegistering ? 'Establish Clearance' : 'Secure Authorization')}
                        </button>
                    </form>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginBottom: '24px', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-surface)', padding: '0 10px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
                        <button onClick={handleGoogleAuth} className="btn" style={{ background: 'transparent', color: 'var(--text)', border: '2px solid var(--border)', boxShadow: 'none', width: '100%' }}>
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '24px' }} /> 
                            Continue with Google
                        </button>
                    </div>
                    <button onClick={() => setIsRegistering(!isRegistering)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
                        {isRegistering ? 'Already provisioned? Authorize here.' : 'Require access? Request clearance.'}
                    </button>
                </div>

                {/* RIGHT CARD: Title & PDFs (Mobile Order: 2) */}
                <div className="card grid-card order-mobile-project">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--secondary)' }}>
                            <BookOpen size={28} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text)' }}>Project Details</h3>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--text)', lineHeight: '1.5', fontSize: '1.1rem' }}>
                            A Multi-Agent Web-Based System for AI-Driven Secure Cryptographic Key Generation with Entropy Validation and Security Analysis
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                            An advanced zero-trust credential provisioning platform featuring a 3-way hybrid algorithmic pipeline.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                        <a href="/synopsis.pdf" target="_blank" rel="noreferrer" className="btn" style={{ background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', justifyContent: 'flex-start', padding: '12px 20px', boxShadow: 'none' }}>
                            <FileText size={18} /> View Synopsis
                        </a>
                        <a href="/report.pdf" target="_blank" rel="noreferrer" className="btn" style={{ background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', justifyContent: 'flex-start', padding: '12px 20px', boxShadow: 'none' }}>
                            <FileText size={18} /> View Project Report
                        </a>
                        <a href="/research-paper.pdf" target="_blank" rel="noreferrer" className="btn" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', border: 'none', justifyContent: 'flex-start', padding: '14px 20px' }}>
                            <FileText size={18} /> View Research Paper
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}