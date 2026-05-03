import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Phone, Target, Save, ShieldCheck } from 'lucide-react';

export default function SettingsPage({ userData, setUserData, user }) {
  const [form, setForm] = useState({
    name: userData?.name || '',
    mobile: userData?.mobile || '',
    purpose: userData?.purpose || ''
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), form);
      setUserData({ ...userData, ...form });
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '600px' }}>
      <h1>Account Settings</h1>
      <p style={{ color: 'var(--text-muted)' }}>Manage your KMS profile and clearance information.</p>

      <div className="card" style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', padding: '15px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
          <ShieldCheck size={30} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Security Clearance</div>
            <div style={{ fontSize: '14px', color: 'var(--primary)' }}>Role: {userData?.role?.toUpperCase()}</div>
          </div>
        </div>

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input className="input-field" style={{ paddingLeft: '40px' }} value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Mobile Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input className="input-field" style={{ paddingLeft: '40px' }} value={form.mobile} onChange={e=>setForm({...form, mobile: e.target.value})} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Organization Purpose</label>
            <div style={{ position: 'relative' }}>
              <Target size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input className="input-field" style={{ paddingLeft: '40px' }} value={form.purpose} onChange={e=>setForm({...form, purpose: e.target.value})} required />
            </div>
          </div>

          <button className="btn" disabled={loading} style={{ background: 'var(--primary)', marginTop: '10px' }}>
            <Save size={18} /> {loading ? 'Saving Changes...' : 'Update KMS Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}