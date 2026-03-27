import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Clock, 
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendance: '0%',
    pendingTasks: 0,
    completedTasks: 0
  });

  useEffect(() => {
    if (!userData?.schoolId) return;

    const schoolID = userData.schoolId;
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Total Students Listener
    const usersQ = query(
      collection(db, 'users'), 
      where('schoolId', '==', schoolID),
      where('role', '==', 'student')
    );
    const unsubUsers = onSnapshot(usersQ, (snap) => {
      setStats(prev => ({ ...prev, totalStudents: snap.size }));
    });

    // 2. Attendance Listener
    const attQ = query(collection(db, 'attendance'), where('schoolId', '==', schoolID));
    const unsubAtt = onSnapshot(attQ, (snap) => {
      let attPct = '0%';
      const targetID = userData.role === 'student' ? userData.uid : userData.childId;
      
      if (targetID) {
        let p = 0; let a = 0;
        snap.docs.forEach(d => {
          const recs = d.data().records || {};
          if (recs[targetID]) {
            recs[targetID] === 'present' ? p++ : a++;
          }
        });
        attPct = (p + a) > 0 ? Math.round((p / (p + a)) * 100) + '%' : '0%';
      } else {
        const todayDoc = snap.docs.find(d => d.data().date === today);
        if (todayDoc) {
          let totalP = 0; let totalCount = 0;
          Object.values(todayDoc.data().records || {}).forEach(v => {
            if (v === 'present') totalP++;
            totalCount++;
          });
          attPct = totalCount > 0 ? Math.round((totalP / totalCount) * 100) + '%' : '0%';
        }
      }
      setStats(prev => ({ ...prev, attendance: attPct }));
    });

    // 3. Homework & Submissions (Parallel Listeners)
    let unsubHw = () => {};
    let unsubSub = () => {};
    let unsubChild = () => {};

    const setupListeners = (targetC, targetS, targetID) => {
        const cleanClass = String(targetC).trim();
        const cleanSection = String(targetS).trim().toUpperCase();

        const hwQ = query(collection(db, 'homework'), where('schoolId', '==', schoolID));
        unsubHw = onSnapshot(hwQ, (hwSnap) => {
            const relevantHw = hwSnap.docs.filter(d => {
                const data = d.data();
                return String(data.targetClass).trim() === cleanClass && 
                       data.targetSections?.includes(cleanSection);
            });
            const totalHwCount = relevantHw.length;
            
            const subQ = query(
                collection(db, 'submissions'), 
                where('studentId', '==', targetID),
                where('schoolId', '==', schoolID)
            );
            unsubSub = onSnapshot(subQ, (subSnap) => {
                const completedCount = subSnap.size;
                setStats(prev => ({
                    ...prev,
                    pendingTasks: Math.max(0, totalHwCount - completedCount),
                    completedTasks: completedCount
                }));
            });
        });
    };

    if (userData.role === 'teacher' || userData.role === 'admin') {
        const hwQ = query(collection(db, 'homework'), where('schoolId', '==', schoolID));
        unsubHw = onSnapshot(hwQ, (snap) => {
            setStats(prev => ({ ...prev, pendingTasks: snap.size }));
        });
    } else if (userData.role === 'student') {
        if (userData.class && userData.section) {
            setupListeners(userData.class, userData.section, userData.uid);
        }
    } else if (userData.role === 'parent' && userData.childId) {
        unsubChild = onSnapshot(doc(db, 'users', userData.childId), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.class && data.section) {
                    setupListeners(data.class, data.section, userData.childId);
                }
            }
        });
    }

    return () => {
      unsubUsers();
      unsubAtt();
      unsubHw();
      unsubSub();
      unsubChild();
    };
  }, [userData]);

  const schoolName = userData?.schoolDetails?.name || 'Your School';

  const styles = {
    container: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
    welcome: { fontSize: '40px', fontWeight: '800', color: 'white' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' },
    card: { background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px' },
    iconBox: (color) => ({ backgroundColor: `rgba(${color}, 0.1)`, padding: '12px', borderRadius: '16px', width: 'fit-content', marginBottom: '16px' }),
    label: { color: '#94a3b8', fontSize: '14px', fontWeight: '500' },
    value: { fontSize: '28px', fontWeight: '800', color: 'white', marginTop: '4px' },
    noticeBoard: { background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius: '24px', padding: '32px', color: 'white' }
  }

  return (
    <div className="dashboard-container" style={styles.container}>
      {/* Mobile Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 4px !important;
          }
          .dashboard-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            margin-bottom: 24px !important;
          }
          .dashboard-header h1 {
            font-size: 26px !important;
          }
          .dashboard-header .dash-date-box {
            text-align: left !important;
          }
          .dashboard-header .dash-date-box > div:first-child {
            font-size: 15px !important;
          }
          .dashboard-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
            margin-bottom: 24px !important;
          }
          .dashboard-stats-grid .glass-card,
          .dashboard-stats-grid > a > .glass-card {
            padding: 16px !important;
            border-radius: 16px !important;
          }
          .dashboard-stats-grid .dash-stat-value {
            font-size: 22px !important;
          }
          .dashboard-stats-grid .dash-stat-label {
            font-size: 12px !important;
          }
          .dashboard-stats-grid .dash-icon-box {
            padding: 8px !important;
            border-radius: 12px !important;
            margin-bottom: 10px !important;
          }
          .dashboard-bottom-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .dashboard-bottom-grid .glass-card {
            padding: 20px !important;
          }
          .dashboard-notice-board {
            padding: 24px !important;
            border-radius: 18px !important;
          }
        }
        @media (max-width: 400px) {
          .dashboard-container {
            padding: 2px !important;
          }
          .dashboard-header h1 {
            font-size: 22px !important;
          }
          .dashboard-stats-grid {
            gap: 8px !important;
          }
          .dashboard-stats-grid .glass-card,
          .dashboard-stats-grid > a > .glass-card {
            padding: 12px !important;
            border-radius: 14px !important;
          }
          .dashboard-stats-grid .dash-stat-value {
            font-size: 20px !important;
          }
        }
      `}</style>

      <header className="dashboard-header" style={styles.header}>
        <div>
          <div style={{ color: '#818cf8', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            {schoolName} • LIVE
          </div>
          <h1 style={styles.welcome}>Hello, {userData?.name}! 👋</h1>
          <p style={{ color: '#94a3b8' }}>Here's your dashboard overview for today.</p>
        </div>
        <div className="dash-date-box" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div style={{ color: '#475569', fontSize: '14px' }}>Academic Term 2026-27</div>
        </div>
      </header>

      <div className="dashboard-stats-grid" style={styles.statsGrid}>
        <div className="glass-card" style={styles.card}>
            <div className="dash-icon-box" style={styles.iconBox('99, 102, 241')}><Users style={{color: '#6366f1'}} /></div>
            <div className="dash-stat-label" style={styles.label}>{userData.role === 'student' || userData.role === 'parent' ? 'Child Attendance' : 'Total Students'}</div>
            <div className="dash-stat-value" style={styles.value}>{userData.role === 'student' || userData.role === 'parent' ? stats.attendance : stats.totalStudents}</div>
        </div>
        <Link to="/homework" style={{textDecoration: 'none'}}>
            <div className="glass-card" style={styles.card}>
                <div className="dash-icon-box" style={styles.iconBox('245, 158, 11')}><BookOpen style={{color: '#f59e0b'}} /></div>
                <div className="dash-stat-label" style={styles.label}>Assignments Pending</div>
                <div className="dash-stat-value" style={styles.value}>{stats.pendingTasks}</div>
            </div>
        </Link>
        <div className="glass-card" style={styles.card}>
            <div className="dash-icon-box" style={styles.iconBox('16, 185, 129')}><Award style={{color: '#10b981'}} /></div>
            <div className="dash-stat-label" style={styles.label}>Credits Gained</div>
            <div className="dash-stat-value" style={styles.value}>750</div>
        </div>
        <div className="glass-card" style={styles.card}>
            <div className="dash-icon-box" style={styles.iconBox('139, 92, 246')}><TrendingUp style={{color: '#8b5cf6'}} /></div>
            <div className="dash-stat-label" style={styles.label}>Current Rank</div>
            <div className="dash-stat-value" style={styles.value}>#12</div>
        </div>
      </div>

      <div className="dashboard-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="glass-card" style={{ ...styles.card, padding: '32px' }}>
            <h3 style={{ color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}><Clock size={20} /> Recent Activities</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <ActivityItem title="Homework Submitted" desc="Math assignment completed" time="1h ago" color="#10b981" />
                <ActivityItem title="Attendance Marked" desc="You were present today" time="4h ago" color="#6366f1" />
                <ActivityItem title="New Notice" desc="Exhibition next week" time="8h ago" color="#f59e0b" />
            </div>
        </div>

        <div className="dashboard-notice-board" style={styles.noticeBoard}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Notice Board</h3>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>MAR 30, 2026</div>
                <div style={{ fontWeight: '600' }}>Annual Science Fair scheduled for next Friday.</div>
            </div>
            <button style={{ width: '100%', padding: '12px', backgroundColor: 'white', color: '#6366f1', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>View All Announcements</button>
        </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ title, desc, time, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color }}></div>
        <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{title}</div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>{desc}</div>
        </div>
        <div style={{ color: '#444', fontSize: '12px' }}>{time}</div>
    </div>
)

export default Dashboard;
