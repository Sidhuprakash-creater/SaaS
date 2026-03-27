import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Homework from './pages/Homework';
import Sidebar from './components/layout/Sidebar';
import UserManagement from './pages/UserManagement';
import Students from './pages/Students';
import Complaints from './pages/Complaints';
import './styles/global.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();
  
  // Protect against rendering before Firestore data is fetched
  if (loading || (currentUser && !userData)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a', color: 'white' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }}></div>
          <div style={{ color: 'var(--text-dim)' }}>Loading workspace...</div>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" />;
  
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="app-main-content" style={{ marginLeft: '280px', width: 'calc(100% - 280px)', minHeight: '100vh', padding: '2.5rem' }}>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          {/* Admin portal has been moved to a separate website */}
          {/* <Route path="/admin-portal" element={<AdminLogin />} /> */}

          {/* Protected Dashboard/Features */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/homework" element={<ProtectedRoute><Homework /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
          
          {/* Fallbacks */}
          <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><h1>Notifications</h1></ProtectedRoute>} />
          
          {/* Universal Redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
