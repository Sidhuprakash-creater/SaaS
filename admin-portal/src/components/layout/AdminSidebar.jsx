import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  LogOut,
  HelpCircle,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';

const AdminSidebar = () => {
  const { logout, userData } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const closeSidebar = () => setIsOpen(false);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Building2 size={20} />, label: 'Manage Schools', path: '/schools' },
    { icon: <Users size={20} />, label: 'User Control', path: '/users' },
    { icon: <Settings size={20} />, label: 'Platform Config', path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Hamburger Toggle */}
      <div className="mobile-nav-toggle" style={{
        display: 'none',
        position: 'fixed',
        left: '20px',
        top: '25px',
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '10px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        cursor: 'pointer'
      }} onClick={() => setIsOpen(true)}>
        <Menu color="white" size={24} />
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 90
          }}
        />
      )}

      {/* Sidebar Core */}
      <aside className={`admin-sidebar ${isOpen ? 'mobile-open' : ''}`} style={{ 
        width: '280px', 
        height: '100vh', 
        background: 'rgba(15, 23, 42, 0.95)', 
        backdropFilter: 'blur(30px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 95,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Mobile Close Button */}
        <div className="mobile-close-btn" style={{
          display: 'none',
          position: 'absolute',
          right: '25px',
          top: '25px',
          cursor: 'pointer',
          padding: '8px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }} onClick={closeSidebar}>
          <X color="var(--text-dim)" size={20} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', marginBottom: '3rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.2)' }}>
          <ShieldCheck size={28} color="#6366f1" />
          <span style={{ fontWeight: '900', fontSize: '1.2rem', color: 'white', letterSpacing: 'px' }}>MASTER ADMIN</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={closeSidebar}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.2rem',
                borderRadius: '16px',
                textDecoration: 'none',
                color: isActive ? 'white' : 'var(--text-dim)',
                background: isActive ? 'var(--primary)' : 'transparent',
                fontWeight: '600',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? '0 4px 15px rgba(99, 102, 241, 0.25)' : 'none'
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                A
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>{userData?.name || 'SuperAdmin'}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{userData?.role}</div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.6rem', 
                padding: '0.8rem', 
                background: 'rgba(244, 63, 94, 0.1)', 
                color: '#f43f5e', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: '700', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* Global Sidebar Mobile Styles */}
        <style>{`
          @media (max-width: 768px) {
            .mobile-nav-toggle { display: flex !important; }
            .mobile-close-btn { display: flex !important; }
            
            .admin-sidebar {
              transform: translateX(-100%);
            }
            .admin-sidebar.mobile-open {
              transform: translateX(0);
            }
          }
        `}</style>
      </aside>
    </>
  );
};

export default AdminSidebar;
