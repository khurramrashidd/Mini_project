import React, { useState, useEffect } from 'react';  
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';  
import { onAuthStateChanged } from 'firebase/auth';  
import { doc, getDoc } from 'firebase/firestore';  
import { auth, db } from './firebase';  
import './styles/global.css';  

// Components 
import Layout from './components/Layout';  
import ErrorBoundary from './components/ErrorBoundary';  

// Pages 
import Login from './pages/Login';  
import GeneratorDashboard from './pages/GeneratorDashboard';  
import PasswordVault from './pages/PasswordVault';  
import AdminRequests from './pages/AdminRequests';  
import SettingsPage from './pages/SettingsPage';  
import ManageCredentials from './pages/ManageCredentials'; 

export default function App() {      
    const [isDark, setIsDark] = useState(false);      
    const [user, setUser] = useState(null);      
    const [userData, setUserData] = useState(null);      
    const [authLoading, setAuthLoading] = useState(true);      

    useEffect(() => {          
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {              
            if (currentUser) {                  
                setUser(currentUser);                  
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));                  
                if (userDoc.exists()) {                      
                    setUserData(userDoc.data());                  
                }              
            } else {                  
                setUser(null);                  
                setUserData(null);              
            }              
            setAuthLoading(false);          
        });          
        return unsubscribe;      
    }, []);      

    if (authLoading) return <div style={{ textAlign: 'center', marginTop: '20%' }}>Loading Platform...</div>;      

    return (          
        <Router>              
            <ErrorBoundary>                  
                <Routes>                      
                    <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />                                            
                    
                    <Route path="/dashboard" element={                          
                        !user ? <Navigate to="/login" replace /> :                           
                        !userData ? <div style={{ textAlign: 'center', marginTop: '20%' }}>Fetching clearance level...</div> :                           
                        <Layout isDark={isDark} setIsDark={setIsDark} user={user} userData={userData}>                              
                            <GeneratorDashboard userData={userData} setUserData={setUserData} user={user} />                          
                        </Layout>                      
                    } />                                 
                    
                    <Route path="/vault" element={                          
                        !user ? <Navigate to="/login" replace /> :                           
                        !userData ? <div style={{ textAlign: 'center', marginTop: '20%' }}>Fetching clearance level...</div> :                           
                        <Layout isDark={isDark} setIsDark={setIsDark} user={user} userData={userData}>                              
                            <PasswordVault userData={userData} user={user} />                          
                        </Layout>                      
                    } />                                 
                    
                    <Route path="/manage-credentials" element={                          
                        !user ? <Navigate to="/login" replace /> :                           
                        !userData ? <div style={{ textAlign: 'center', marginTop: '20%' }}>Fetching clearance level...</div> :                           
                        <Layout isDark={isDark} setIsDark={setIsDark} user={user} userData={userData}>                              
                            <ManageCredentials user={user} userData={userData} />                          
                        </Layout>                      
                    } />           
                    
                    <Route path="/admin-requests" element={                          
                        !user || userData?.role !== 'admin' ? <Navigate to="/dashboard" replace /> :                           
                        <Layout isDark={isDark} setIsDark={setIsDark} user={user} userData={userData}>                              
                            <AdminRequests userData={userData} user={user} />                          
                        </Layout>                      
                    } />                                 
                    
                    <Route path="/settings" element={                          
                        !user ? <Navigate to="/login" replace /> :                           
                        <Layout isDark={isDark} setIsDark={setIsDark} user={user} userData={userData}>                              
                            <SettingsPage userData={userData} setUserData={setUserData} user={user} />                          
                        </Layout>                      
                    } />                                 
                    
                    <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />                  
                </Routes>              
            </ErrorBoundary>          
        </Router>      
    ); 
}