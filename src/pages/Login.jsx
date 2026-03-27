import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  LogIn, 
  Mail, 
  Lock, 
  Loader2, 
  ChevronLeft, 
  Building2, 
  LayoutDashboard,
  ChevronDown
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [schools, setSchools] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSchools, setFetchingSchools] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsQuery = query(collection(db, 'schools'), orderBy('name'));
        const querySnapshot = await getDocs(schoolsQuery);
        const fetchedSchools = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSchools(fetchedSchools);
      } catch (err) {
        console.error("Error fetching schools:", err);
        setError('Failed to load schools. Please refresh the page.');
      }
      setFetchingSchools(false);
    };

    fetchSchools();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedSchool) {
      setError('Please select your school first.');
      return;
    }

    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      
      await login(trimmedEmail, trimmedPassword);
      navigate('/dashboard');
    } catch (err) {
      console.error("Login attempt failed:", err);
      // More descriptive errors for the user
      if (err.code === 'auth/user-not-found') {
          setError('No account found with this email for the selected school.');
      } else if (err.code === 'auth/wrong-password') {
          setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
          setError('The email address format is invalid.');
      } else {
          setError('Access Denied: ' + err.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-page" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      padding: '0'
    }}>
      <div className="mesh-bg"></div>

      {/* Floating 3D Elements for Login Page */}
      <div style={{ 
          position: 'absolute', 
          top: '15%', 
          left: '10%', 
          width: '80px', 
          height: '80px', 
          background: 'var(--primary)', 
          borderRadius: '50%',
          opacity: 0.3,
          animation: 'float 7s infinite ease-in-out',
          filter: 'blur(30px)'
        }}></div>
      <div style={{ 
          position: 'absolute', 
          bottom: '15%', 
          right: '10%', 
          width: '120px', 
          height: '120px', 
          background: 'var(--secondary)', 
          borderRadius: '24px',
          opacity: 0.1,
          animation: 'float 9s infinite ease-in-out reverse',
          filter: 'blur(2px)',
          transform: 'rotate(15deg)'
        }}></div>

      <div className="glass-card login-card" style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '3rem',
        margin: '1.5rem',
        boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <button 
          onClick={() => navigate('/')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-dim)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            marginBottom: '2rem',
            padding: '0.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'color 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
        >
          <ChevronLeft size={18} />
          Back to Home
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            background: 'var(--primary)', 
            padding: '1.25rem', 
            borderRadius: '24px', 
            marginBottom: '1rem',
            boxShadow: '0 15px 30px rgba(99, 102, 241, 0.4)',
            animation: 'float 4s infinite ease-in-out'
          }}>
            <LogIn size={40} color="white" />
          </div>
          <h1 className="login-title" style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', letterSpacing: '-1.5px', marginBottom: '0.5rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.05rem', fontWeight: '500' }}>Access your school portal below.</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(244, 63, 94, 0.1)', 
            color: '#f43f5e', 
            padding: '1rem', 
            borderRadius: '12px', 
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '0.6rem' }}>Select Your School</label>
            <div style={{ position: 'relative' }}>
              <Building2 size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', zIndex: 1 }} />
              <select 
                required
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '1rem 3rem 1rem 3rem', 
                  borderRadius: '14px', 
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  outline: 'none',
                  fontSize: '16px',
                  transition: 'border-color 0.3s ease',
                  appearance: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
                disabled={fetchingSchools}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              >
                <option value="" disabled style={{ background: '#1e293b' }}>
                  {fetchingSchools ? 'Loading schools...' : 'Choose school...'}
                </option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id} style={{ background: '#1e293b' }}>
                    {school.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '0.6rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.com"
                style={{ 
                  width: '100%', 
                  padding: '1rem 1rem 1rem 3rem', 
                  borderRadius: '14px', 
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  outline: 'none',
                  fontSize: '16px',
                  transition: 'border-color 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '0.6rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ 
                  width: '100%', 
                  padding: '1rem 1rem 1rem 3rem', 
                  borderRadius: '14px', 
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  outline: 'none',
                  fontSize: '16px',
                  transition: 'border-color 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary"
            style={{ 
              width: '100%', 
              padding: '1.1rem', 
              fontSize: '1.1rem', 
              justifyContent: 'center',
              marginTop: '1rem'
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>
                <LayoutDashboard size={20} />
                Access Dashboard
              </>
            )}
          </button>
        </form>

        <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: '500' }}>
          Forgotten your password? <a href="#" style={{ color: 'var(--primary-glow)', textDecoration: 'none', fontWeight: '700' }}>Contact Support</a>
        </p>
        
        <p style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <a href="#" onClick={() => alert("Redirecting to dedicated Master Admin Website (usually on a separate subdomain like admin.yourdomain.com)")} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-glow)'} onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
             Platform Master Admin Console ↗
          </a>
        </p>
      </div>

      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ========= LOGIN MOBILE RESPONSIVE ========= */
        @media (max-width: 768px) {
          .login-page {
            padding: 0 !important;
            align-items: flex-start !important;
            padding-top: 20px !important;
          }
          .login-card {
            padding: 1.8rem !important;
            margin: 0.8rem !important;
            border-radius: 20px !important;
          }
          .login-title {
            font-size: 2rem !important;
          }
          .login-page .login-card .form-group input,
          .login-page .login-card .form-group select {
            padding-top: 0.85rem !important;
            padding-bottom: 0.85rem !important;
          }
        }
        @media (max-width: 400px) {
          .login-card {
            padding: 1.4rem !important;
            margin: 0.5rem !important;
          }
          .login-title {
            font-size: 1.7rem !important;
          }
          .login-page .login-card button[type="submit"] {
            padding: 0.9rem !important;
            font-size: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
