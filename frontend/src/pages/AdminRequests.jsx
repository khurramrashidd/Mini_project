import React, { useState, useEffect } from 'react';  
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';  
import { db } from '../firebase';  
import axios from 'axios';  
import { CheckCircle2, Clock, Shield, Send, Activity, Eye, EyeOff, Copy, AlertTriangle, XCircle, Database } from 'lucide-react';  

export default function AdminRequests() {      
    const [requests, setRequests] = useState([]);      
    const [adminPoolKeys, setAdminPoolKeys] = useState([]);    
    const [visibleKeys, setVisibleKeys] = useState({});      
    const [activeRequest, setActiveRequest] = useState(null);      
    const [pipelineState, setPipelineState] = useState('idle');       
    const [pipelineResults, setPipelineResults] = useState([]);      
    const [selectedPoolKey, setSelectedPoolKey] = useState('');    

    useEffect(() => {          
        const q = query(collection(db, 'passwordRequests'));          
        const unsubscribeReqs = onSnapshot(q, (snapshot) => {              
            const fetchedRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));              
            fetchedRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));              
            setRequests(fetchedRequests);          
        });          
        const qPool = query(collection(db, 'adminKeyPool'));     
        const unsubscribePool = onSnapshot(qPool, (snapshot) => {       
            const fetchedPool = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));       
            setAdminPoolKeys(fetchedPool);     
        });     
        return () => { unsubscribeReqs(); unsubscribePool(); };   
    }, []);      

    const handleAcceptRequest = (req) => {          
        setActiveRequest(req);          
        setPipelineState('idle');          
        setPipelineResults([]);        
        setSelectedPoolKey('');   
    };      

    const declineRequest = async (requestId) => {          
        if (window.confirm("Are you sure you want to decline this request?")) {              
            try {                  
                await updateDoc(doc(db, 'passwordRequests', requestId), {                      
                    status: 'Declined',                      
                    processedAt: new Date().toISOString()                  
                });              
            } catch (err) {                  
                console.error("Failed to decline request:", err);              
            }          
        }      
    };      

    const checkCompliance = (key, reqLength, reqChars) => {          
        const isLongEnough = key.length >= parseInt(reqLength || 0);          
        const hasUpper = reqChars?.upper ? /[A-Z]/.test(key) : true;          
        const hasLower = reqChars?.lower ? /[a-z]/.test(key) : true;          
        const hasNumbers = reqChars?.numbers ? /[0-9]/.test(key) : true;          
        const hasSymbols = reqChars?.symbols ? /[^A-Za-z0-9]/.test(key) : true;          
        const passes = isLongEnough && hasUpper && hasLower && hasNumbers && hasSymbols;               
        return { passes };      
    };      

    const runCompleteSynthesisPipeline = async () => {          
        setPipelineState('running');          
        try {              
            const API_URL = '[https://minicrypto.onrender.com/api/generate-key](https://minicrypto.onrender.com/api/generate-key)';                     
            const [aesRes, rsaRes, eccRes] = await Promise.all([                  
                axios.post(API_URL, { purpose: activeRequest.purpose, algorithm: 'AES', length: 256 }),                  
                axios.post(API_URL, { purpose: activeRequest.purpose, algorithm: 'RSA', length: 2048 }),                  
                axios.post(API_URL, { purpose: activeRequest.purpose, algorithm: 'ECC', length: 256 })              
            ]);              
            setPipelineResults([aesRes.data, rsaRes.data, eccRes.data]);              
            setPipelineState('generated');          
        } catch (err) {              
            alert('Pipeline execution failed. Ensure backend is running.');              
            setPipelineState('idle');          
        }      
    };      

    const executeDispatch = async (credential, algorithm, sourceLabel, poolKeyIdToDelete = null) => {     
        try {              
            await addDoc(collection(db, `users/${activeRequest.userId}/vault`), {                  
                label: activeRequest.label,                  
                purpose: activeRequest.purpose,                  
                password: credential,                  
                algorithm: algorithm,                  
                source: sourceLabel,                  
                createdAt: new Date().toISOString(),                  
                expiresAt: activeRequest.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),                  
                status: 'Active',         
                userId: activeRequest.userId,         
                userName: activeRequest.userName       
            });              
            
            await updateDoc(doc(db, 'passwordRequests', activeRequest.id), {                  
                status: 'Completed',                  
                processedAt: new Date().toISOString(),                  
                dispatchedAlgorithm: algorithm              
            });                     
            
            if (poolKeyIdToDelete) {         
                await deleteDoc(doc(db, 'adminKeyPool', poolKeyIdToDelete));       
            }       
            setActiveRequest(null);              
            setPipelineResults([]);              
            setPipelineState('idle');            
            alert("Dispatched Successfully");     
        } catch (err) {              
            alert('Failed to dispatch credential to user.');          
        }    
    };   

    const dispatchSelectedKey = async (selectedResult) => {          
        const credential = selectedResult.key_data.key_hex || selectedResult.key_data.private_key;     
        executeDispatch(credential, selectedResult.metadata.algorithm, 'Admin-Issued (Pipeline)');   
    };      

    const dispatchFromPool = async () => {     
        if (!selectedPoolKey) return alert("Select a key first.");     
        const keyData = adminPoolKeys.find(k => k.id === selectedPoolKey);     
        if (!keyData) return;     
        executeDispatch(keyData.password, keyData.algorithm, 'Admin-Issued (Pool)', keyData.id);   
    };   

    const pendingRequests = requests.filter(r => r.status === 'Pending');      
    const processedRequests = requests.filter(r => r.status === 'Completed' || r.status === 'Declined');      

    return (          
        <div className="dashboard-container">              
            <h1>Admin Command Center</h1>              
            <p style={{ color: 'var(--text-muted)' }}>Review user requests, run the 3-Way Crypto Pipeline, or dispatch from the Admin Pool.</p>                     
            
            <h3 style={{ marginTop: '30px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Pending Action Queue</h3>              
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>                  
                {pendingRequests.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No pending requests at this time.</p>}                  
                {pendingRequests.map(req => (                      
                    <div key={req.id} className="card" style={{ borderLeft: '4px solid #f59e0b' }}>                          
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>                              
                            <div>                                  
                                <h2 style={{ fontSize: '1.2rem', margin: '0 0 10px 0' }}>{req.label}</h2>                                  
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>                                      
                                    <span><strong>User:</strong> {req.userName}</span>                                      
                                    <span><strong>Purpose:</strong> {req.purpose}</span>                                      
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>                                          
                                        <Clock size="{14}"/> Expiry: {new Date(req.expiresAt).toLocaleDateString()}                                      
                                    </span>                                  
                                </div>                                  
                                <div style={{ fontSize: '13px', marginTop: '8px', color: '#8b5cf6' }}>                                      
                                    <strong>User Requested Params:</strong> Length: {req.reqLength || 'N/A'} | Chars: {req.reqChars?.upper ? 'A-Z ' : ''}{req.reqChars?.lower ? 'a-z ' : ''}{req.reqChars?.numbers ? '0-9 ' : ''}{req.reqChars?.symbols ? '!@#' : ''}                                  
                                </div>                              
                            </div>                              
                            <div>                                  
                                {activeRequest?.id !== req.id && (                                      
                                    <div style={{ display: 'flex', gap: '10px' }}>                                          
                                        <button className="btn" onClick={() => declineRequest(req.id)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}>                                              
                                            Decline                                          
                                        </button>                                          
                                        <button className="btn" onClick={() => handleAcceptRequest(req)} style={{ background: '#f59e0b' }}>                                              
                                            Review Request                                          
                                        </button>                                      
                                    </div>                                  
                                )}                              
                            </div>                          
                        </div>                          
                        
                        {activeRequest?.id === req.id && (                              
                            <div style={{ marginTop: '20px', padding: '20px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--primary)' }}>                                  
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>                                      
                                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)', fontSize: '1.1rem' }}>                                          
                                        <Shield size="{20}"/> Resolution Workspace                                      
                                    </h4>                                      
                                    <button onClick={() => setActiveRequest(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Close Workspace</button>                                  
                                </div>                                                                    
                                
                                {pipelineState === 'idle' && (                                      
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>                     
                                        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>                       
                                            <h5 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Database size="{16}"/> Dispatch from Key Pool</h5>                       
                                            <select className="input-field" style={{ marginBottom: '15px' }} value={selectedPoolKey} onChange={(e) => setSelectedPoolKey(e.target.value)}>                         
                                                <option value="">-- Select an Available Key --</option>                         
                                                {adminPoolKeys.map(k => (                           
                                                    <option key={k.id} value={k.id}>{k.label} ({k.algorithm})</option>                         
                                                ))}                       
                                            </select>                       
                                            <button className="btn" onClick={dispatchFromPool} disabled={!selectedPoolKey} style={{ background: 'var(--success)', width: '100%' }}>                         
                                                <Send size="{16}"/> Dispatch Selected Key                       
                                            </button>                     
                                        </div>                     
                                        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>                       
                                            <h5 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size="{16}"/> Real-time Synthesis</h5>                       
                                            <button className="btn" onClick={runCompleteSynthesisPipeline} style={{ background: '#8b5cf6', width: '100%', padding: '15px' }}>                         
                                                Initialize Complete Pipeline                       
                                            </button>                     
                                        </div>                   
                                    </div>                 
                                )}                                                   
                                
                                {pipelineState === 'running' && (                                      
                                    <div style={{ textAlign: 'center', color: '#8b5cf6', padding: '20px', fontWeight: 'bold' }}>                                          
                                        Engaging Math & AI Agents across 3 Algorithms...                                      
                                    </div>                                  
                                )}                                                   
                                
                                {pipelineState === 'generated' && (                                      
                                    <div className="results-grid" style={{ animation: 'slideDown 0.4s ease-out' }}>                                          
                                        {pipelineResults.map((res, index) => {                                               
                                            const keyString = res.key_data.key_hex || res.key_data.private_key;                                               
                                            const compliance = checkCompliance(keyString, req.reqLength, req.reqChars);                                               
                                            return (                                                  
                                                <div key={index} className="algo-card" style={{ background: 'var(--card)', border: compliance.passes ? '2px solid var(--success)' : '1px solid var(--border)' }}>                                                      
                                                    <div className="card-header">                                                          
                                                        <h2>{res.metadata.algorithm}</h2>                                                          
                                                        <span className="security-badge">{res.metadata.bits}-bit</span>                                                      
                                                    </div>                                                                                 
                                                    
                                                    <div style={{ padding: '10px', background: compliance.passes ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' }}>                                                          
                                                        <strong style={{ color: compliance.passes ? 'var(--success)' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>                                                              
                                                            {compliance.passes ? <CheckCircle2 size="{14}"/> : <AlertTriangle size="{14}"/>}                                                               
                                                            {compliance.passes ? ' Meets User Criteria' : ' Fails User Criteria'}                                                          
                                                        </strong>                                                      
                                                    </div>                                                      
                                                    
                                                    <div className="key-box">{keyString}</div>                                                      
                                                    
                                                    <button className="btn" onClick={() => dispatchSelectedKey(res)} style={{ background: 'var(--success)', marginTop: '15px', width: '100%' }}>                                                          
                                                        <Send size="{16}"/> Dispatch this Key                                                      
                                                    </button>                                                  
                                                </div>                                              
                                            )                                          
                                        })}                                      
                                    </div>                                  
                                )}                              
                            </div>                          
                        )}                      
                    </div>                  
                ))}              
            </div>            
        </div>      
    );  
}