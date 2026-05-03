import React, { useState } from 'react';  
import axios from 'axios';  
import { Copy, CheckCircle2, Edit2, Save, X, ChevronDown, ChevronUp, Database } from 'lucide-react';  
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';  
import { db } from '../firebase';  
import '../styles/dashboard.css';  

export default function GeneratorDashboard({ userData, setUserData, user }) {      
    const [loading, setLoading] = useState(false);      
    const [results, setResults] = useState([]);      
    const [winner, setWinner] = useState(null);      
    const [error, setError] = useState('');      
    const [step, setStep] = useState(0);      
    const [purpose, setPurpose] = useState('Enterprise Data Encryption');      
    const [copied, setCopied] = useState(false);      
    
    const [showUserDetails, setShowUserDetails] = useState(false);      
    const [isEditing, setIsEditing] = useState(false);      
    const [editForm, setEditForm] = useState({ name: userData.name || '', mobile: userData.mobile || '', purpose: userData.purpose || '' });      
    
    const [saveForm, setSaveForm] = useState({ label: '', description: '' });   
    const [isSaving, setIsSaving] = useState(false);      
    const isAdmin = userData.role === 'admin';      

    const handleSaveProfile = async () => {          
        try {              
            const userRef = doc(db, "users", user.uid);              
            await updateDoc(userRef, editForm);              
            setUserData({ ...userData, ...editForm });              
            setIsEditing(false);          
        } catch (err) { alert("Failed to update profile."); }      
    };      

    const handleGenerate = async (e) => {          
        e.preventDefault();          
        setLoading(true); setError(''); setResults([]); setWinner(null); setStep(0); setCopied(false);      
        setSaveForm({ label: '', description: '' });          
        try {              
            const API_URL = 'https://minicrypto.onrender.com/api/generate-key';              
            const [aesRes, rsaRes, eccRes] = await Promise.all([                  
                axios.post(API_URL, { purpose, algorithm: 'AES', length: 256 }),                  
                axios.post(API_URL, { purpose, algorithm: 'RSA', length: 2048 }),                  
                axios.post(API_URL, { purpose, algorithm: 'ECC', length: 256 })              
            ]);              
            const fetchedResults = [aesRes.data, rsaRes.data, eccRes.data];              
            let highestScore = -1000;              
            let winningIndex = 0;              
            fetchedResults.forEach((res, index) => {                  
                let totalScore = res.pipeline_agents.Agent_2_AI.ai_confidence_score + ((res.pipeline_agents.Agent_3_Math.shannon_entropy / res.pipeline_agents.Agent_3_Math.max_theoretical_entropy) * 100);                  
                if (res.pipeline_agents.Agent_3_Math.nist_monobit.score === 'Fail') totalScore -= 50;                  
                if (res.pipeline_agents.Agent_4_Strength.verdict === 'Fail') totalScore -= 100;                  
                if (res.pipeline_agents.Agent_2_AI.recommendation === 'Reject') totalScore -= 50;                  
                res.heuristic_score = totalScore;                  
                if (totalScore > highestScore) { highestScore = totalScore; winningIndex = index; }              
            });              
            setResults(fetchedResults); setWinner(winningIndex); setStep(isAdmin ? 1 : 5);          
        } catch (err) { setError('Network Error: Ensure your FastAPI backend is running.'); }           
        finally { setLoading(false); }      
    };      

    const copyToClipboard = (text) => {          
        navigator.clipboard.writeText(text);          
        setCopied(true); setTimeout(() => setCopied(false), 2000);      
    };      

    const handleSaveToVault = async (e) => {     
        e.preventDefault();     
        setIsSaving(true);     
        const keyObj = results[winner];          
        const keyString = keyObj.key_data.key_hex || keyObj.key_data.private_key;     
        try {       
            if (isAdmin) {         
                await addDoc(collection(db, 'adminKeyPool'), {           
                    label: saveForm.label, purpose: saveForm.description, password: keyString,            
                    algorithm: keyObj.metadata.algorithm, createdAt: new Date().toISOString()         
                });         
                alert("Key saved to Admin Pool for future dispatch.");       
            } else {         
                const defaultDate = new Date(); defaultDate.setDate(defaultDate.getDate() + 30);         
                await addDoc(collection(db, `users/${user.uid}/vault`), {           
                    label: saveForm.label, purpose: saveForm.description, password: keyString,            
                    algorithm: keyObj.metadata.algorithm, status: 'Active', source: 'Self-Generated (Dashboard)',            
                    createdAt: new Date().toISOString(), expiresAt: defaultDate.toISOString(),           
                    userId: user.uid, userName: userData.name          
                });         
                alert("Key securely saved to your Identity Vault.");       
            }       
            setSaveForm({ label: '', description: '' });     
        } catch(err) {       
            console.error(err);       
            alert(`Failed to save key: ${err.message}`);     
        } finally {       
            setIsSaving(false);     
        }   
    };   

    const ProgressBar = ({ label, value, color }) => (          
        <div style={{ marginTop: '10px' }}>       
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>         
                <span>{label}</span><span style={{ color: color, fontWeight: 'bold' }}>{value.toFixed(1)}%</span>       
            </div>       
            <div style={{ width: '100%', background: 'var(--border)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>         
                <div style={{ width: `${(value / 100) * 100}%`, background: color, height: '100%', transition: 'width 1s ease-in-out' }}></div>       
            </div>     
        </div>      
    );      

    const AgentSection = ({ title, icon, color, children }) => (          
        <div className="agent-section" style={{ borderLeft: `3px solid ${color}` }}>       
            <h4 style={{ color: color }}>{icon} {title}</h4><div className="agent-content">{children}</div>     
        </div>      
    );      

    return (          
        <div className="dashboard-container">              
            <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid var(--border)' }}>                  
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>                      
                    
                    {/* CRITICAL UI FIX FOR MOBILE: Removed aggressive overflow ellipsis, allowed wrap */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>                          
                        <h2 style={{ margin: 0, fontSize: 'clamp(1.1rem, 5vw, 1.3rem)', lineHeight: '1.3' }}>
                            Hello, {userData.name || 'User'} 👋
                        </h2>                          
                        <span style={{ background: isAdmin ? 'var(--danger)' : 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            {userData.role.toUpperCase()}
                        </span>                      
                    </div>                      
                    
                    <button onClick={() => setShowUserDetails(!showUserDetails)} className="btn" style={{ padding: '8px 12px', fontSize: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', boxShadow: 'none' }}>
                        {showUserDetails ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    </button>                  
                </div>                  
                {showUserDetails && (                      
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)', animation: 'fadeIn 0.3s ease-out' }}>                          
                        {isEditing ? (                              
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>                                  
                                <input type="text" className="input-field" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full Name" />                                  
                                <input type="text" className="input-field" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} placeholder="Mobile Number" />                                  
                                <input type="text" className="input-field" value={editForm.purpose} onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })} placeholder="Purpose" />                                  
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>                                      
                                    <button onClick={handleSaveProfile} className="btn" style={{ background: 'var(--success)', flex: 1 }}><Save size={16} /> Save</button>                                      
                                    <button onClick={() => setIsEditing(false)} className="btn" style={{ background: 'var(--border)', color: 'var(--text)', flex: 1 }}><X size={16} /> Cancel</button>                                  
                                </div>                              
                            </div>                          
                        ) : (                              
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>                                  
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>                                      
                                    <div><strong>Mobile:</strong> {userData.mobile}</div><div><strong>Purpose:</strong> {userData.purpose}</div>                                  
                                </div>                                  
                                <button onClick={() => setIsEditing(true)} className="btn" style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '6px 12px', fontSize: '13px', boxShadow: 'none' }}><Edit2 size={14} /> Edit Profile</button>                              
                            </div>                          
                        )}                      
                    </div>                  
                )}              
            </div>              
            
            <header className="dashboard-header"><h1>{isAdmin ? 'Command Center' : 'Secure Key Generator'}</h1></header>                     
            
            <form className="controls-panel" onSubmit={handleGenerate}>                  
                <input type="text" className="input-field" placeholder="Key Identifier (e.g., AWS S3 Bucket)" value={purpose} onChange={(e) => setPurpose(e.target.value)} required style={{ maxWidth: '500px' }} />                  
                <button type="submit" className="btn" disabled={loading} style={{ maxWidth: '250px' }}>{loading ? 'Processing...' : 'Generate Secure Key'}</button>              
            </form>                     
            
            {error && <div style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>{error}</div>}                     
            
            {results.length > 0 && (                  
                isAdmin ? (                      
                    <>                          
                        <div className="results-grid">                              
                            {results.map((res, index) => {                                  
                                const isWinner = step === 5 && index === winner;                                  
                                return (                                      
                                    <div key={index} className={`algo-card ${isWinner ? 'winner' : ''}`}>                                          
                                        {isWinner && <div className="winner-badge">⭐ Optimal Key Selected</div>}                                          
                                        <div className="card-header"><h2>{res.metadata.algorithm}</h2><span className="security-badge">{res.metadata.bits}-bit</span></div>                                          
                                        
                                        {step >= 1 && <AgentSection title="Agent 1: Generator" icon="⚙️" color="#64748b"><div className="key-box">{res.key_data.key_hex || res.key_data.private_key}</div></AgentSection>}                                          
                                        {step >= 2 && <AgentSection title="Agent 4: Strength" icon="🛡️" color="#f59e0b"><div>Resistance: <strong>{res.pipeline_agents.Agent_4_Strength.brute_force_resistance}</strong></div></AgentSection>}                                          
                                        {step >= 3 && <AgentSection title="Agent 3: Math Model" icon="📊" color="var(--primary)"><ProgressBar label="Entropy Health" value={(res.pipeline_agents.Agent_3_Math.shannon_entropy / res.pipeline_agents.Agent_3_Math.max_theoretical_entropy) * 100} color="var(--primary)" /></AgentSection>}                                          
                                        {step >= 4 && <AgentSection title="Agent 2: AI Scan" icon="🧠" color="#8b5cf6"><ProgressBar label="AI Confidence" value={res.pipeline_agents.Agent_2_AI.ai_confidence_score} color="#8b5cf6" /></AgentSection>}                                          
                                        {step >= 5 && <div className="score-box">Heuristic Score: {res.heuristic_score.toFixed(1)} pts</div>}                                      
                                    </div>                                  
                                );                              
                            })}                          
                        </div>                          
                        
                        {step > 0 && step < 5 && (                              
                            <div className="action-bar">                                  
                                {step === 1 && <button className="btn" style={{ background: '#f59e0b', maxWidth: '400px', margin: '0 auto' }} onClick={() => setStep(2)}>Verify Strength 🛡️</button>}                                  
                                {step === 2 && <button className="btn" style={{ background: 'var(--primary)', maxWidth: '400px', margin: '0 auto' }} onClick={() => setStep(3)}>Run Math Tests 📊</button>}                                  
                                {step === 3 && <button className="btn" style={{ background: '#8b5cf6', maxWidth: '400px', margin: '0 auto' }} onClick={() => setStep(4)}>AI Pattern Scan 🧠</button>}                                  
                                {step === 4 && <button className="btn" style={{ background: 'var(--success)', maxWidth: '400px', margin: '0 auto' }} onClick={() => setStep(5)}>Finalize Key ⭐</button>}                              
                            </div>                          
                        )}                                     
                    </>                  
                ) : (                      
                    <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--card)', padding: '30px', borderRadius: '12px', border: '1px solid var(--success)', boxShadow: '0 0 25px rgba(16, 185, 129, 0.15)', textAlign: 'center' }}>                          
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'inline-block', padding: '10px', borderRadius: '50%', marginBottom: '15px' }}><CheckCircle2 size={40} /></div>                          
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>Secure Key Generated</h2>                          
                        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Algorithm: <strong>{results[winner].metadata.algorithm} ({results[winner].metadata.bits}-bit)</strong></p>                          
                        
                        <div className="key-box" style={{ marginBottom: '20px', textAlign: 'left', maxHeight: '150px' }}>{results[winner].key_data.key_hex || results[winner].key_data.private_key}</div>                          
                        
                        <button onClick={() => copyToClipboard(results[winner].key_data.key_hex || results[winner].key_data.private_key)} className="btn" style={{ background: copied ? 'var(--success)' : 'var(--primary)', width: '100%' }}>                              
                            {copied ? 'Copied to Clipboard!' : <><Copy size={18} /> Copy Key to Clipboard</>}                          
                        </button>                     
                    </div>                  
                )              
            )}            

            {/* SAVE TO VAULT FORM (For both User and Admin) */}       
            {(step === 5 || (!isAdmin && results.length > 0)) && (         
                <div className="card" style={{ marginTop: '30px', borderLeft: '4px solid var(--success)' }}>           
                    <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>             
                        <Database size={20} /> {isAdmin ? 'Save to Admin Key Pool' : 'Save to Identity Vault'}           
                    </h3>           
                    <form onSubmit={handleSaveToVault} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>             
                        <input className="input-field" placeholder="Label (e.g., Target Database)" value={saveForm.label} onChange={(e)=>setSaveForm({...saveForm, label: e.target.value})} required style={{ flex: 1, minWidth: '200px' }} />             
                        <input className="input-field" placeholder="Description or Purpose" value={saveForm.description} onChange={(e)=>setSaveForm({...saveForm, description: e.target.value})} required style={{ flex: 2, minWidth: '200px' }} />             
                        <button type="submit" className="btn" disabled={isSaving} style={{ background: 'var(--success)' }}>               
                            <Save size={18}/> {isSaving ? 'Saving...' : 'Save Credential'}             
                        </button>           
                    </form>         
                </div>       
            )}     
        </div>      
    );  
}