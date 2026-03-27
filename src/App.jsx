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
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
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
