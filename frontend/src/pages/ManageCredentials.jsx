import React, { useState, useEffect } from 'react'; 
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, collectionGroup } from 'firebase/firestore'; 
import { db } from '../firebase'; 
import { Trash2, ShieldAlert, ShieldCheck, Database, Calendar, Clock, Eye, EyeOff, Copy, User } from 'lucide-react'; 

export default function ManageCredentials({ user, userData }) {   
  const [credentials, setCredentials] = useState([]);   
  const [visibleKeys, setVisibleKeys] = useState({});
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {     
    // Admin reads all vaults via collectionGroup. Standard user reads their own vault.
    const q = isAdmin ? query(collectionGroup(db, 'vault')) : query(collection(db, `users/${user.uid}/vault`));     
    const unsubscribe = onSnapshot(q, (snapshot) => {       
      const entries = snapshot.docs.map(doc => ({ id: doc.id, refPath: doc.ref.path, ...doc.data() }));       
      entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));       
      setCredentials(entries);     
    });     
    return unsubscribe;   
  }, [user.uid, isAdmin]);   

  const toggleStatus = async (entry, currentStatus) => {     
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';     
    const updatePayload = { status: newStatus };     
    if (newStatus === 'Inactive') {       
      updatePayload.expiresAt = new Date().toISOString();     
    }     
    try {       
      await updateDoc(doc(db, entry.refPath), updatePayload);     
    } catch (err) {       
      alert("Failed to update status.");     
    }   
  };   

  const handleDelete = async (entry) => {     
    if (window.confirm("Are you sure you want to permanently delete this credential?")) {       
      try {         
        await deleteDoc(doc(db, entry.refPath));       
      } catch (err) {         
        alert("Failed to delete credential.");       
      }     
    }   
  };   

  const formatDateTime = (dateString) => {     
    if (!dateString) return 'N/A';     
    return new Date(dateString).toLocaleString(undefined, {       
      year: 'numeric', month: 'short', day: 'numeric',       
      hour: '2-digit', minute: '2-digit'     
    });   
  };   

  return (     
    <div className="dashboard-container">       
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>         
        <Database size={32} color="var(--primary)" />         
        <h1 style={{ margin: 0 }}>{isAdmin ? 'Global Fleet Credentials' : 'My Credential Management'}</h1>       
      </div>       
      <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>         
        {isAdmin ? 'Review and manage all dispatched keys across the organization.' : 'Review your history of generated keys. Copy credentials or mark them as inactive to instantly revoke operational status.'}       
      </p>       

      <div className="card" style={{ padding: '20px 0' }}>         
        <table className="mc-table">           
          <thead>             
            <tr>               
              {isAdmin && <th>Owner</th>}
              <th>Vault Label</th>               
              <th>Complete Credential Data</th>
              <th>Lifecycle</th>               
              <th>Status</th>               
              <th style={{ textAlign: 'center' }}>Actions</th>             
            </tr>           
          </thead>           
          <tbody>             
            {credentials.length === 0 && (               
              <tr>                 
                <td colSpan={isAdmin ? "6" : "5"} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>                   
                  No credentials found.                 
                </td>               
              </tr>             
            )}             
            {credentials.map(entry => {               
              const isAutoExpired = new Date() > new Date(entry.expiresAt);               
              const isManuallyInactive = entry.status === 'Inactive';               
              const isActive = !isManuallyInactive && !isAutoExpired;                              
              
              let displayStatus = 'Active';               
              if (isManuallyInactive) displayStatus = 'Inactive';               
              else if (isAutoExpired) displayStatus = 'Expired';               
              
              return (                 
                <tr key={entry.id} className={`mc-row ${!isActive ? 'mc-inactive-row' : ''}`}>                   
                  
                  {isAdmin && (
                    <td data-label="Owner" className="mc-cell">
                      <span className="mc-cell-content" style={{ fontWeight: 'bold', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14}/> {entry.userName || 'Unknown'}
                      </span>
                    </td>
                  )}

                  <td data-label="Vault Label" className="mc-cell">                     
                    <div className="mc-cell-content">                       
                      <strong style={{ color: 'var(--text)' }}>{entry.label}</strong><br/>
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{entry.purpose}</span>
                    </div>                   
                  </td>                   
                  
                  <td data-label="Complete Credential Data" className="mc-cell">                     
                    <div className="mc-cell-content" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                      <code className="key-display-box" style={{ margin: 0, flex: 1, minWidth: '120px' }}>
                        {visibleKeys[entry.id] ? entry.password : '••••••••••••••••••••'}
                      </code>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setVisibleKeys({...visibleKeys, [entry.id]: !visibleKeys[entry.id]})} className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', padding: '6px', color: 'var(--text)' }}>
                          {visibleKeys[entry.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(entry.password); alert('Copied!'); }} className="btn" style={{ background: 'var(--primary)', padding: '6px' }}>
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>                   
                  </td>                   
                  
                  <td data-label="Lifecycle" className="mc-cell">                     
                    <div className="mc-cell-content" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>                       
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>                         
                        <Calendar size={14} /> Created: {formatDateTime(entry.createdAt)}                       
                      </span>                       
                      {(!isActive && entry.expiresAt) && (                         
                        <span style={{ color: 'var(--danger)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>                           
                          <Clock size={14} /> {isManuallyInactive ? 'Revoked' : 'Expired'}: {formatDateTime(entry.expiresAt)}                         
                        </span>                       
                      )}                     
                    </div>                   
                  </td>                   
                  
                  <td data-label="Status" className="mc-cell">                     
                    <span className="mc-cell-content">                       
                      <span style={{ background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isActive ? 'var(--success)' : 'var(--danger)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>                         
                        {displayStatus}                       
                      </span>                     
                    </span>                   
                  </td>                   
                  
                  <td data-label="Actions" className="mc-cell mc-actions-cell">                     
                    <div className="mc-actions-wrapper">                       
                      <button onClick={() => toggleStatus(entry, entry.status || 'Active')} className="btn" style={{ background: 'transparent', border: `1px solid ${isActive ? 'var(--warning)' : 'var(--success)'}`, color: isActive ? 'var(--warning)' : 'var(--success)', padding: '8px 14px', fontSize: '13px', boxShadow: 'none', flex: 1 }}>                         
                        {isActive ? <><ShieldAlert size={14}/> Disable</> : <><ShieldCheck size={14}/> Enable</>}                       
                      </button>                       
                      <button onClick={() => handleDelete(entry)} style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', color: 'var(--danger)' }} title="Delete">                         
                        <Trash2 size={18} />                       
                      </button>                     
                    </div>                   
                  </td>                 
                </tr>               
              );             
            })}           
          </tbody>         
        </table>       
      </div>     
    </div>   
  ); 
}