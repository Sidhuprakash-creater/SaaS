import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import AdminSetup from './pages/AdminSetup'; // Temporary import
import AdminSidebar from './components/layout/AdminSidebar';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { currentUser, userData, loading, logout } = useAuth();
  
  if (loading) return <div>Loading Access Control...</div>;
  if (!currentUser) return <Navigate to="/login" />;
  
  // Extra security: Only Master Admin can access this portal
  if (userData?.role !== 'admin') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: 'white', flexDirection: 'column', textAlign: 'center' }}>
        <h1 style={{ color: '#f43f5e', marginBottom: '1rem' }}>ACCESS DENIED</h1>
        <p style={{ marginBottom: '2rem', maxWidth: '400px', lineHeight: '1.5', color: '#94a3b8' }}>
          This portal is restricted to Platform Master Administrators only.<br/><br/>
          It looks like you are currently logged in with a regular School account (Teacher/Student/Principal). Please sign out to log in as a Master Admin.
        </p>
        <button className="btn-primary" onClick={() => logout()}>Sign out & Switch Account</button>
      </div>
    );
  }
  
  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <main className="admin-main-content" style={{ marginLeft: '280px', width: 'calc(100% - 280px)', minHeight: '100vh', padding: '3.5rem' }}>
        <div className="mesh-bg" style={{ opacity: 0.2 }}></div>
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .admin-main-content {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 5rem 1rem 2rem 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/setup-master-admin" element={<AdminSetup />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* Protected Portal Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/schools" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          
          <Route path="/settings" element={<ProtectedRoute><h1>Platform Global Configuration</h1></ProtectedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
