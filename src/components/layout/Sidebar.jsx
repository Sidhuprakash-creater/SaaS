import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart2, 
  Users, 
  ClipboardList, 
  BookOpen, 
  MessageSquare, 
  Bell, 
  LogOut, 
  GraduationCap,
  Layout,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <BarChart2 size={20} />, roles: ['admin', 'principal', 'teacher', 'student', 'parent'] },
    { name: 'Attendance', path: '/attendance', icon: <ClipboardList size={20} />, roles: ['admin', 'principal', 'teacher', 'student', 'parent'] },
    { name: 'Homework', path: '/homework', icon: <BookOpen size={20} />, roles: ['admin', 'principal', 'teacher', 'student', 'parent'] },
    { name: 'Students', path: '/students', icon: <GraduationCap size={20} />, roles: ['admin', 'principal', 'teacher'] },
    { name: 'Complaints', path: '/complaints', icon: <MessageSquare size={20} />, roles: ['admin', 'principal', 'teacher', 'parent'] },
    { name: 'Manage Users', path: '/admin/users', icon: <Users size={20} />, roles: ['admin', 'principal'] },
    { name: 'Notifications', path: '/notifications', icon: <Bell size={20} />, roles: ['admin', 'principal', 'teacher', 'student', 'parent'] },
  ];

  const filteredItems = menuItems.filter(item => {
    if (!userData) return false;
    if (item.roles.includes(userData.role)) return true;
    if (item.name === 'Manage Users' && userData.permissions?.canAddStudents) return true;
    return false;
  });

  return (
    <>
      {/* Mobile Responsive CSS */}
      <style>{`
        .sidebar-hamburger {
          display: none;
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 1100;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(30, 41, 59, 0.85);
          backdrop-filter: blur(12px);
          color: white;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
        }
        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 999;
          animation: sidebarFadeIn 0.3s ease;
        }
        @keyframes sidebarFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sidebarSlideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 768px) {
          .sidebar-hamburger {
            display: flex !important;
          }
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            width: 280px !important;
            box-shadow: 4px 0 30px rgba(0,0,0,0.5);
          }
          .sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .sidebar-overlay.active {
            display: block !important;
          }
          .app-main-content {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 1rem !important;
            padding-top: 70px !important;
          }
        }
      `}</style>

      {/* Hamburger Toggle Button */}
      <button 
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`} 
        onClick={() => setMobileOpen(false)} 
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={{ 
        width: '280px', 
        height: '100vh', 
        background: 'rgba(15, 23, 42, 0.95)', 
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent'
      }}>
        <div style={{ padding: '2.5rem 1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: '#6366f1', padding: '0.6rem', borderRadius: '14px', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.4)' }}>
            <GraduationCap size={24} color="white" />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.5px' }}>
            {userData?.schoolDetails?.name || 'School Portal'}
          </h2>
        </div>

        <div style={{ flex: 1, padding: '0 1.2rem' }}>
          <div style={{ marginBottom: '1rem', padding: '0 0.8rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.1em' }}>
              Main Menu
            </p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {filteredItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.9rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: isActive ? 'white' : '#94a3b8',
                  background: isActive ? '#6366f1' : 'transparent',
                  fontWeight: isActive ? '700' : '500',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                })}
              >
                {item.icon}
                <span style={{ fontSize: '0.95rem' }}>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div style={{ padding: '1.5rem', marginTop: 'auto' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                background: '#6366f1', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                fontWeight: '900',
                fontSize: '1.1rem',
                flexShrink: 0
            }}>
              {userData?.name ? userData.name[0] : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {userData?.name || 'Authorized User'}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6366f1', fontWeight: '800', textTransform: 'uppercase' }}>
                {userData?.role}
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.8rem', 
              padding: '0.85rem', 
              borderRadius: '12px', 
              border: 'none', 
              background: 'rgba(244, 63, 94, 0.1)', 
              color: '#f43f5e', 
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
          >
            <LogOut size={18} />
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
