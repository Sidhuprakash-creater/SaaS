import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ShieldAlert, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminSetup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSetup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Create User in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Create User Profile in Firestore with 'admin' role
            await setDoc(doc(db, 'users', user.uid), {
                name: name,
                email: email,
                role: 'admin',
                createdAt: serverTimestamp(),
                isMasterAdmin: true
            });

            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: 'white' }}>
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <CheckCircle2 size={60} color="#10b981" style={{ marginBottom: '1rem' }} />
                    <h1 style={{ marginBottom: '1rem' }}>Success!</h1>
                    <p>Master Admin account created. Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a', padding: '1rem' }}>
            <div className="glass-card" style={{ maxWidth: '450px', width: '100%', padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <ShieldAlert size={48} color="#f59e0b" style={{ marginBottom: '1rem' }} />
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>One-Time Setup</h1>
                    <p style={{ color: '#94a3b8' }}>Create your Master Admin credentials.</p>
                </div>

                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(244,63,94,0.2)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Full Name</label>
                        <input 
                            required 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', color: 'white', marginTop: '0.4rem' }}
                        />
                    </div>
                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Admin Email</label>
                        <input 
                            required 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@platform.com"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', color: 'white', marginTop: '0.4rem' }}
                        />
                    </div>
                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Secure Password</label>
                        <input 
                            required 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', color: 'white', marginTop: '0.4rem' }}
                        />
                    </div>

                    <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Initialize Platform Admin'}
                    </button>
                </form>
                
                <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '2rem', textAlign: 'center' }}>
                    Note: This is a restricted setup page. Remove this route after first use.
                </p>
            </div>
        </div>
    );
};

export default AdminSetup;
