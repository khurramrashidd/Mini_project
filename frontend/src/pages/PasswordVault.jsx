import React, { useState, useEffect } from 'react'; 
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, where, updateDoc } from 'firebase/firestore'; 
import { db } from '../firebase'; 
import { Copy, Eye, EyeOff, Trash2, Clock, CheckCircle2, Hourglass, XCircle, Edit2, BarChart3, Save, X, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'; 
import axios from 'axios'; 
import { Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'; 

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend); 

export default function PasswordVault({ userData, user }) {   
  const [vault, setVault] = useState([]);   
  const [myRequests, setMyRequests] = useState([]);   
  const [visibleKeys, setVisibleKeys] = useState({});   
  const [loading, setLoading] = useState(false);   
  const isAdmin = userData?.role === 'admin';   
  const [mode, setMode] = useState('self');   
  
  const [osbvExpanded, setOsbvExpanded] = useState(false);   
  const defaultDate = new Date();   
  defaultDate.setDate(defaultDate.getDate() + 30);   
  const [expiryDate, setExpiryDate] = useState(defaultDate.toISOString().split('T')[0]);   
  
  const [label, setLabel] = useState('');   
  const [purpose, setPurpose] = useState('');   
  
  const [reqLength, setReqLength] = useState(16);   
  const [reqChars, setReqChars] = useState({ upper: true, lower: true, numbers: true, symbols: true });   
  
  const [editingId, setEditingId] = useState(null);   
  const [editFields, setEditFields] = useState({ label: '', purpose: '' });   
  const [chartData, setChartData] = useState(null);   
  const [activeChartLabel, setActiveChartLabel] = useState('');   
  
  useEffect(() => {     
    const vaultQuery = query(collection(db, `users/${user.uid}/vault`));     
    const unsubVault = onSnapshot(vaultQuery, (snapshot) => {       
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));       
      entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));       
      setVault(entries);     
    });     
    
    const reqQuery = query(collection(db, 'passwordRequests'), where('userId', '==', user.uid));     
    const unsubReqs = onSnapshot(reqQuery, (snapshot) => {       
      const fetchedRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));       
      fetchedRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));       
      setMyRequests(fetchedRequests);     
    });     
    
    return () => { unsubVault(); unsubReqs(); };   
  }, [user.uid]);   
  
  const generateAndSave = async (e) => {     
    e.preventDefault();     
    if (!label.trim() || !purpose.trim()) {       
      alert("Validation Error: Please provide both a Vault Label and a Description/Purpose.");       
      return;     
    }     
    setLoading(true);     
    try {       
      const API_URL = 'https://minicrypto.onrender.com/api/generate-key';       
      const [aesRes, rsaRes, eccRes] = await Promise.all([         
        axios.post(API_URL, { purpose, algorithm: 'AES', length: 256 }),         
        axios.post(API_URL, { purpose, algorithm: 'RSA', length: 2048 }),         
        axios.post(API_URL, { purpose, algorithm: 'ECC', length: 256 })       
      ]);       
      const results = [aesRes.data, rsaRes.data, eccRes.data];       
      let bestResult = results[0];       
      let highestScore = -1000;              
      
      results.forEach((res) => {         
        const aiScore = res.pipeline_agents.Agent_2_AI.ai_confidence_score;         
        const mathScore = (res.pipeline_agents.Agent_3_Math.shannon_entropy / res.pipeline_agents.Agent_3_Math.max_theoretical_entropy) * 100;         
        let totalScore = aiScore + mathScore;         
        if (res.pipeline_agents.Agent_3_Math.nist_monobit.score === 'Fail') totalScore -= 50;         
        if (res.pipeline_agents.Agent_4_Strength.verdict === 'Fail') totalScore -= 100;         
        if (totalScore > highestScore) { highestScore = totalScore; bestResult = res; }       
      });       
      
      const generatedCredential = bestResult.key_data.key_hex || bestResult.key_data.private_key;       
      const expirationISO = new Date(expiryDate).toISOString();       
      
      await addDoc(collection(db, `users/${user.uid}/vault`), {         
        label, purpose, password: generatedCredential,         
        algorithm: bestResult.metadata.algorithm,         
        heuristicScore: 'Auto-Selected Best Fit', source: 'Self-Generated (Optimized)',         
        createdAt: new Date().toISOString(), expiresAt: expirationISO, status: 'Active',
        userId: user.uid, userName: userData.name
      });       
      
      setLabel(''); setPurpose('');     
    } catch (err) {       
      alert("Pipeline Error: Failed to generate secure credential.");     
    } finally {       
      setLoading(false);     
    }   
  };   
  
  const submitAdminRequest = async (e) => {     
    e.preventDefault();     
    if (!label.trim() || !purpose.trim()) {       
      alert("Validation Error: Please provide both a Vault Label and a Description/Purpose.");       
      return;     
    }     
    await addDoc(collection(db, 'passwordRequests'), {       
      userId: user.uid, userName: userData.name, label, purpose, reqLength, reqChars,       
      expiresAt: new Date(expiryDate).toISOString(), status: 'Pending', createdAt: new Date().toISOString()     
    });     
    alert("Requirement parameters sent to Synthesis Command Center.");     
    setLabel(''); setPurpose('');   
  };   
  
  const startEdit = (entry) => {     
    setEditingId(entry.id);     
    setEditFields({ label: entry.label, purpose: entry.purpose });   
  };   
  
  const saveEdit = async (id) => {     
    if (!editFields.label.trim() || !editFields.purpose.trim()) return alert("Fields cannot be empty.");     
    await updateDoc(doc(db, `users/${user.uid}/vault`, id), editFields);     
    setEditingId(null);   
  };   
  
  const showHeatmap = (password, entryLabel) => {     
    const chars = password.split('');     
    const counts = {};     
    chars.forEach(c => counts[c] = (counts[c] || 0) + 1);     
    setActiveChartLabel(entryLabel);     
    setChartData({       
      labels: Object.keys(counts),       
      datasets: [{ label: 'Character Frequency (Entropy Spread)', data: Object.values(counts), backgroundColor: '#8b5cf6' }]     
    });   
  };   
  
  const calculateDaysLeft = (dateString) => {     
    if (!dateString) return 0;     
    const diff = new Date(dateString) - new Date();     
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));   
  };   

  return (     
    <div className="dashboard-container">              
      {/* EXTERNAL INTEGRATION: OSBV */}       
      {!isAdmin && (         
        <div className="card osbv-card" style={{ marginBottom: '30px', borderLeft: '4px solid #10b981' }}>           
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>             
            <div>               
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>                 
                <ExternalLink color="#10b981" /> Omni-Signal Behavioral Vault               
              </h2>               
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '8px 0 0 0', maxWidth: '600px' }}>                 
                A zero-trust digital estate platform addressing traditional password manager vulnerabilities via behavioral biometrics and distributed trust.               
              </p>             
            </div>             
            <a href="https://osbv-frontend-umber.vercel.app/" target="_blank" rel="noreferrer" className="btn osbv-link-btn" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', textDecoration: 'none', padding: '8px 16px', border: '1px solid #10b981' }}>               
              Open OSBV             
            </a>           
          </div>           
          <button className="osbv-mobile-toggle" onClick={() => setOsbvExpanded(!osbvExpanded)}>             
            {osbvExpanded ? <><ChevronUp size={16}/> Hide Details</> : <><ChevronDown size={16}/> View 3 Core Pillars</>}           
          </button>           
          
          <div className={`osbv-details-grid ${osbvExpanded ? 'expanded' : ''}`}>             
            <div style={{ background: 'var(--bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>               
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)' }}>1. Behavioral Verification</h4>               
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>                 
                <li>Uses AI-driven keystroke dynamics</li>                 
                <li>Detects typing anomalies</li>                 
                <li>Triggers system lockdown on coercion</li>               
              </ul>             
            </div>             
            <div style={{ background: 'var(--bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>               
              <h4 style={{ margin: '0 0 10px 0', color: '#8b5cf6' }}>2. Distributed Trust</h4>               
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>                 
                <li>Local AES-256 encryption</li>                 
                <li>Shamir's Secret Sharing (M-of-N)</li>                 
                <li>Prevents centralized breaches</li>               
              </ul>             
            </div>             
            <div style={{ background: 'var(--bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>               
              <h4 style={{ margin: '0 0 10px 0', color: '#f59e0b' }}>3. Automated Inheritance</h4>               
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>                 
                <li>Monitors user activity signals</li>                 
                <li>Time-To-Live (TTL) mechanism</li>                 
                <li>Secure fiduciary access upon inactivity</li>               
              </ul>             
            </div>           
          </div>         
        </div>       
      )}       
      
      <h1 style={{ marginBottom: '20px' }}>Identity & Credential Vault</h1>       
      
      {/* CONTROLS */}       
      <div className="controls-panel" style={{ alignItems: 'flex-start', flexDirection: 'column' }}>         
        {!isAdmin && (           
          <div className="vault-mode-toggles">             
            <button onClick={() => setMode('self')} className="btn" style={{ background: mode === 'self' ? 'var(--primary)' : 'transparent', color: mode === 'self' ? 'white' : 'var(--text)', border: mode === 'self' ? 'none' : '1px solid var(--border)', flex: 1 }}>Self-Generate Credential</button>             
            <button onClick={() => setMode('request')} className="btn" style={{ background: mode === 'request' ? '#8b5cf6' : 'transparent', color: mode === 'request' ? 'white' : 'var(--text)', border: mode === 'request' ? 'none' : '1px solid var(--border)', flex: 1 }}>Submit Requirements</button>           
          </div>         
        )}                  
        <form style={{ width: '100%', display: 'flex', gap: '15px', flexDirection: 'column' }}>                      
          <div className="vault-inputs-container">             
            <input className="input-field vault-input-label" placeholder="Vault Label (e.g., AWS Root) *" value={label} onChange={(e)=>setLabel(e.target.value)} required />             
            <input className="input-field vault-input-desc" placeholder="Description / Purpose *" value={purpose} onChange={(e)=>setPurpose(e.target.value)} required />             
            <div className="vault-input-date" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>               
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Expires On:</span>               
              <input type="date" className="input-field" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} style={{ padding: '8px' }} required />             
            </div>           
          </div>           
          {mode === 'self' && (             
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>               
              <button className="btn" onClick={generateAndSave} disabled={loading} style={{ background: 'var(--success)', maxWidth: '300px', width: '100%' }}>                 
                {loading ? 'Running 3-Way Optimization...' : 'Generate Optimal Credential'}               
              </button>             
            </div>           
          )}           
          {mode === 'request' && !isAdmin && (             
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--bg)', padding: '15px', borderRadius: '8px' }}>               
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>                 
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Required Length:</span>                 
                <input type="number" className="input-field" value={reqLength} onChange={(e)=>setReqLength(e.target.value)} style={{ width: '100px' }} />               
              </div>               
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px' }}>                 
                <label><input type="checkbox" checked={reqChars.upper} onChange={(e)=>setReqChars({...reqChars, upper: e.target.checked})} /> Uppercase (A-Z)</label>                 
                <label><input type="checkbox" checked={reqChars.lower} onChange={(e)=>setReqChars({...reqChars, lower: e.target.checked})} /> Lowercase (a-z)</label>                 
                <label><input type="checkbox" checked={reqChars.numbers} onChange={(e)=>setReqChars({...reqChars, numbers: e.target.checked})} /> Numbers (0-9)</label>                 
                <label><input type="checkbox" checked={reqChars.symbols} onChange={(e)=>setReqChars({...reqChars, symbols: e.target.checked})} /> Symbols (!@#$)</label>               
              </div>               
              <button className="btn" onClick={submitAdminRequest} disabled={loading} style={{ background: '#8b5cf6', alignSelf: 'flex-end', width: '100%', maxWidth: '300px' }}>                 
                Submit Parameter Request               
              </button>             
            </div>           
          )}         
        </form>       
      </div>       
      
      {/* HEATMAP MODAL */}       
      {chartData && (         
        <div className="card" style={{ marginBottom: '20px', position: 'relative', border: '1px solid #8b5cf6' }}>           
          <button onClick={() => setChartData(null)} style={{ position: 'absolute', right: '15px', top: '15px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '50%', cursor: 'pointer', padding: '5px' }}><X size={18}/></button>           
          <h3 style={{ marginTop: 0 }}>Visual Entropy Heatmap: <span style={{ color: '#8b5cf6' }}>{activeChartLabel}</span></h3>           
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>Displays the frequency and distribution of bytes/characters in the cryptographic string to verify randomness.</p>           
          <div style={{ height: '300px' }}>             
            <Bar data={chartData} options={{ maintainAspectRatio: false, responsive: true }} />           
          </div>         
        </div>       
      )}       
      
      {/* MY REQUESTS STATUS SECTION */}       
      {!isAdmin && myRequests.length > 0 && (         
        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #8b5cf6' }}>           
          <h3 style={{ marginTop: 0 }}>My Dispatch Requests</h3>           
          <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>             
            {myRequests.map(req => (               
              <div key={req.id} style={{ minWidth: '250px', background: 'var(--bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>                 
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>                   
                  <strong>{req.label}</strong>                   
                  {req.status === 'Pending' && <span style={{ color: '#f59e0b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><Hourglass size={14}/> Pending</span>}                   
                  {req.status === 'Completed' && <span style={{ color: 'var(--success)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14}/> Completed</span>}                   
                  {req.status === 'Declined' && <span style={{ color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={14}/> Declined</span>}                 
                </div>                 
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>                   
                  <p style={{ margin: '0 0 5px 0' }}>{req.purpose}</p>                   
                  <p style={{ margin: 0 }}>Length: {req.reqLength} | Expires: {new Date(req.expiresAt).toLocaleDateString()}</p>                 
                </div>               
              </div>             
            ))}           
          </div>         
        </div>       
      )}       
      
      {/* VAULT TABLE - UPGRADED TO MC-TABLE */}       
      <div className="card" style={{ padding: '20px 0' }}>         
        <h3 style={{ marginTop: 0, padding: '0 20px' }}>Active Credentials</h3>         
        <table className="mc-table">           
          <thead>             
            <tr>               
              <th>Vault Label</th>               
              <th>Complete Credential Data</th>               
              <th>Lifecycle</th>               
              <th style={{ textAlign: 'center' }}>Actions</th>             
            </tr>           
          </thead>           
          <tbody>             
            {vault.map(entry => {               
              const daysLeft = calculateDaysLeft(entry.expiresAt);               
              const isExpired = daysLeft === 0;               
              return (                 
                <tr key={entry.id} className={`mc-row ${isExpired ? 'mc-inactive-row' : ''}`}>                                          
                  <td data-label="Vault Label" className="mc-cell">                     
                    <div className="mc-cell-content">
                      {editingId === entry.id ? (                       
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>                         
                          <input className="input-field" style={{ padding: '6px', fontSize: '13px' }} value={editFields.label} onChange={(e) => setEditFields({...editFields, label: e.target.value})} placeholder="Label" />                         
                          <input className="input-field" style={{ padding: '6px', fontSize: '13px' }} value={editFields.purpose} onChange={(e) => setEditFields({...editFields, purpose: e.target.value})} placeholder="Purpose" />                       
                        </div>                     
                      ) : (                       
                        <>                         
                          <strong style={{ color: 'var(--text)' }}>{entry.label}</strong><br/>                         
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{entry.purpose}</span>                       
                        </>                     
                      )}                     
                    </div>
                  </td>                                          
                  
                  <td data-label="Complete Credential Data" className="mc-cell">                     
                    <div className="mc-cell-content" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                      <code className="key-display-box" style={{ margin: 0, flex: 1, minWidth: '120px' }}>
                        {visibleKeys[entry.id] ? entry.password : '••••••••••••••••••••'}
                      </code>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setVisibleKeys({...visibleKeys, [entry.id]: !visibleKeys[entry.id]})} className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', padding: '6px', color: 'var(--text)' }} title="Reveal Key">                           
                          {visibleKeys[entry.id] ? <EyeOff size={16} /> : <Eye size={16} />}                         
                        </button>                         
                        <button onClick={() => { navigator.clipboard.writeText(entry.password); alert('Credential Copied to Clipboard!'); }} className="btn" style={{ background: 'var(--primary)', padding: '6px' }} title="Copy full key">                           
                          <Copy size={16} />                         
                        </button>                       
                      </div>
                    </div>                   
                  </td>                   
                  
                  <td data-label="Lifecycle" className="mc-cell">                     
                    <div className="mc-cell-content">
                      {isExpired ? (                       
                        <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold' }}>EXPIRED</span>                     
                      ) : (                       
                        <span style={{ color: daysLeft < 7 ? '#f59e0b' : 'var(--success)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>                         
                          <Clock size={14} /> {daysLeft} days left                       
                        </span>                     
                      )}                     
                    </div>
                  </td>                                          
                  
                  <td data-label="Actions" className="mc-cell mc-actions-cell">                     
                    <div className="mc-actions-wrapper">                       
                      {editingId === entry.id ? (                         
                        <>                           
                          <button onClick={() => saveEdit(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)' }} title="Save"><Save size={18} /></button>                           
                          <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Cancel"><X size={18} /></button>                         
                        </>                       
                      ) : (                         
                        <>                           
                          <button onClick={() => showHeatmap(entry.password, entry.label)} className="btn" style={{ background: 'transparent', border: '1px solid #8b5cf6', color: '#8b5cf6', padding: '6px 12px' }} title="View Entropy Heatmap">                             
                            <BarChart3 size={16} />                           
                          </button>                           
                          <button onClick={() => startEdit(entry)} className="btn" style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '6px 12px' }} title="Edit Label/Purpose">                             
                            <Edit2 size={16} />                           
                          </button>                           
                          <button onClick={() => deleteDoc(doc(db, `users/${user.uid}/vault`, entry.id))} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: 'var(--danger)', cursor: 'pointer' }} title="Delete Entry">                             
                            <Trash2 size={16} />                           
                          </button>                         
                        </>                       
                      )}                     
                    </div>                   
                  </td>                 
                </tr>               
              )             
            })}           
          </tbody>         
        </table>       
      </div>     
    </div>   
  ); 
}