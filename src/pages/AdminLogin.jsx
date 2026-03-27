import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Loader2, 
  ChevronLeft,
  Settings
} from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // AuthContext handle karega data fetch karna, hum bas dashboard par bhejenge
      navigate('/dashboard');
    } catch (err) {
      setError('Admin access denied. Invalid credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="admin-login-page" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#0f172a' // Dark theme specifically for admin
    }}>
      <div className="mesh-bg" style={{ opacity: 0.2 }}></div>

      <div className="glass-card" style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '3rem',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <button 
          onClick={() => navigate('/login')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: '#94a3b8', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            marginBottom: '2rem',
            cursor: 'pointer'
          }}
        >
          <ChevronLeft size={18} />
          School Portal
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            background: 'rgba(99, 102, 241, 0.1)', 
            padding: '1rem', 
            borderRadius: '20px', 
            marginBottom: '1rem',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <ShieldCheck size={32} color="#6366f1" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', marginBottom: '0.4rem' }}>Admin Console</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Secure access to platform management.</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(244, 63, 94, 0.1)', 
            color: '#f43f5e', 
            padding: '0.8rem', 
            borderRadius: '10px', 
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            textAlign: 'center',
            border: '1px solid rgba(244, 63, 94, 0.2)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Admin Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@platform.com"
                style={{ 
                  width: '100%', 
                  padding: '0.8rem 1rem 0.8rem 2.8rem', 
                  borderRadius: '10px', 
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid #334155',
                  color: 'white',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Secure Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ 
                  width: '100%', 
                  padding: '0.8rem 1rem 0.8rem 2.8rem', 
                  borderRadius: '10px', 
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid #334155',
                  color: 'white',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <Settings size={18} />
                Access Control Center
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
