import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { 
  Building2, 
  Users, 
  Settings, 
  TrendingUp, 
  ShieldCheck, 
  Activity,
  Plus
} from 'lucide-react';

const AdminDashboard = () => {
  const { userData } = useAuth();
  const [stats, setStats] = useState({ schools: 0, users: 0 });
  const [recentSchools, setRecentSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const schoolsSnap = await getDocs(collection(db, 'schools'));
        const usersSnap = await getDocs(collection(db, 'users'));
        
        setStats({
          schools: schoolsSnap.size,
          users: usersSnap.size
        });

        // Get 3 most recent schools
        const q = query(collection(db, 'schools'), orderBy('createdAt', 'desc'), limit(3));
        const recentSnap = await getDocs(q);
        setRecentSchools(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
      } catch (err) {
        console.error("Dashboard error:", err);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="admin-dash-header" style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '0.4rem' }}>
          Platform Hub
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Overall control of the multi-tenant SaaS.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard icon={<Building2 size={24} color="#6366f1" />} title="Total Schools" value={stats.schools} trend="+2 this week" />
        <StatCard icon={<Users size={24} color="#10b981" />} title="Active Users" value={stats.users} trend="+15 this month" />
        <StatCard icon={<TrendingUp size={24} color="#f59e0b" />} title="Platform Revenue" value="₹12.5k" trend="Up 12%" />
        <StatCard icon={<ShieldCheck size={24} color="#8b5cf6" />} title="Security Status" value="Secure" trend="100%" />
      </div>

      {/* MOBILE CSS */}
      <style>{`
        @media (max-width: 768px) {
          .admin-dash-header h1 {
            font-size: 2rem !important;
          }
          .admin-dash-content {
            grid-template-columns: 1fr !important;
          }
          .admin-dash-card {
            padding: 1.5rem !important;
          }
        }
      `}</style>

      <div className="admin-dash-content" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="glass-card admin-dash-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Activity size={20} color="var(--primary-glow)" /> Recently Added Schools
            </h3>
            <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>View All</button>
          </div>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {recentSchools.map(school => (
              <div key={school.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem', background: 'rgba(15,23,42,0.4)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(99,102,241,0.1)', padding: '0.8rem', borderRadius: '12px' }}>
                    <Building2 size={20} color="#6366f1" />
                  </div>
                  <div>
                    <h4 style={{ color: 'white', margin: 0 }}>{school.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>ID: {school.id}</p>
                  </div>
                </div>
                <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '700' }}>Live</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card admin-dash-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Settings size={20} color="var(--primary-glow)" /> Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ActionButton icon={<Plus size={18} />} text="New School Node" />
            <ActionButton icon={<Building2 size={18} />} text="Platform Config" />
            <ActionButton icon={<Users size={18} />} text="Global Roles" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, trend }) => (
  <div className="glass-card" style={{ padding: '1.8rem', position: 'relative', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '14px' }}>{icon}</div>
      <div style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.3rem 0.6rem', borderRadius: '20px', height: 'fit-content' }}>
        {trend}
      </div>
    </div>
    <h4 style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: '500' }}>{title}</h4>
    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>{value}</div>
  </div>
);

const ActionButton = ({ icon, text }) => (
  <button style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.8rem', 
    width: '100%', 
    padding: '1rem', 
    background: 'rgba(255,255,255,0.03)', 
    border: '1px solid rgba(255,255,255,0.05)', 
    borderRadius: '14px', 
    color: 'white', 
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s'
  }}
  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
  >
    {icon}
    {text}
  </button>
);

export default AdminDashboard;
