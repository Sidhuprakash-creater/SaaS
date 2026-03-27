import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, auth as primaryAuth } from '../services/firebase';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where,
  serverTimestamp,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { 
  Users, 
  Plus, 
  Building2, 
  Shield, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Search,
  School,
  Edit2,
  Lock,
  Mail,
  X,
  Loader2,
  Fingerprint
} from 'lucide-react';

// Setup Secondary Auth to create users without logging out admin
const firebaseConfig = primaryAuth.app.options;
const secondaryApp = getApps().find(a => a.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

const UserManagement = () => {
  const { userData } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(userData?.role === 'admin' ? 'schools' : 'users');
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form states
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('principal');
  const [targetSchoolId, setTargetSchoolId] = useState('');

  // Edit states
  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSchoolId, setEditSchoolId] = useState('');

  // School edit states
  const [editSchool, setEditSchool] = useState(null);
  const [editSchoolTitle, setEditSchoolTitle] = useState('');

  useEffect(() => {
    fetchData();
  }, [userData]);

  // Sync tab state with URL dynamically
  useEffect(() => {
    if (location.pathname.includes('/schools') && userData?.role === 'admin') {
      setActiveTab('schools');
    } else if (location.pathname.includes('/users')) {
      setActiveTab('users');
    }
  }, [location.pathname, userData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      const schoolsList = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchools(schoolsList);

      let usersQuery = collection(db, 'users');
      if (userData?.role !== 'admin') {
          usersQuery = query(collection(db, 'users'), where('schoolId', '==', userData?.schoolId));
      }
      
      const usersSnapshot = await getDocs(usersQuery);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    if (!newSchoolName) return;
    setActionLoading(true);
    try {
      await addDoc(collection(db, 'schools'), {
        name: newSchoolName,
        createdAt: serverTimestamp()
      });
      setNewSchoolName('');
      fetchData();
    } catch (err) {
      alert("Error: " + err.message);
    }
    setActionLoading(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const schoolId = userData?.role === 'admin' ? targetSchoolId : userData?.schoolId;
    
    if (!newUserEmail || !newUserPassword || !schoolId) {
      alert("Please provide Email, Password and School");
      return;
    }

    setActionLoading(true);
    try {
      const trimmedEmail = newUserEmail.trim();
      const trimmedPassword = newUserPassword.trim();
      
      // 1. Create in Firebase Auth using Secondary Auth (No Admin Logout)
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, trimmedEmail, trimmedPassword);
      const uid = userCredential.user.uid;
      
      // 2. Create profile in Firestore
      await setDoc(doc(db, 'users', uid), {
        name: newUserName.trim(),
        email: trimmedEmail,
        role: newUserRole,
        schoolId: schoolId,
        createdAt: serverTimestamp(),
        permissions: {
           canAddStudents: newUserRole ==='principal',
           canAddTeachers: newUserRole === 'principal' || newUserRole === 'admin'
        }
      });

      // Cleanup
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setTargetSchoolId('');
      fetchData();
      alert("Account Created Successully!");
    } catch (err) {
      alert("Creation Error: " + err.message);
    }
    setActionLoading(false);
  };

  const handleEditClick = (user) => {
      setEditUser(user);
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditRole(user.role || '');
      setEditSchoolId(user.schoolId || '');
  };

  const handleUpdateUser = async (e) => {
      e.preventDefault();
      if (!editUser) return;
      setActionLoading(true);
      try {
          await updateDoc(doc(db, 'users', editUser.id), {
              name: editName,
              email: editEmail,
              role: editRole,
              schoolId: editSchoolId,
              updatedAt: serverTimestamp()
          });
          setEditUser(null);
          fetchData();
      } catch (err) {
          alert("Update Error: " + err.message);
      }
      setActionLoading(false);
  };

  const deleteUser = async (uid) => {
      if(uid === userData?.uid) {
          alert("You cannot remove your own Master Admin account from here.");
          return;
      }
      if(!window.confirm("Are you sure you want to remove this user profile? This will also permanently delete their Authentication record.")) return;
      
      setActionLoading(true);
      try {
          // 1. Delete from Firebase Auth via Cloud Function
          const deleteAuth = httpsCallable(functions, 'deleteUserAccount');
          await deleteAuth({ uid: uid });

          // 2. Delete from Firestore
          await deleteDoc(doc(db, 'users', uid));
          
          fetchData();
          alert("User removed from both Registry and Authentication systems.");
      } catch (err) {
          console.error("Deletion Error:", err);
          alert("Failed to remove Auth record. Error: " + err.message);
      }
      setActionLoading(false);
  };

  const handleEditSchool = (school) => {
      setEditSchool(school);
      setEditSchoolTitle(school.name);
  };

  const handleUpdateSchool = async (e) => {
      e.preventDefault();
      if (!editSchool) return;
      setActionLoading(true);
      try {
          await updateDoc(doc(db, 'schools', editSchool.id), {
              name: editSchoolTitle,
              updatedAt: serverTimestamp()
          });
          setEditSchool(null);
          fetchData();
          alert("School details updated!");
      } catch (err) {
          alert(err.message);
      }
      setActionLoading(false);
  };

  const handleDeleteSchool = async (id) => {
      if (!window.confirm("CRITICAL: Deleting a school will not remove its users but they will lose their school link. Proceed?")) return;
      try {
          await deleteDoc(doc(db, 'schools', id));
          fetchData();
      } catch (err) {
          alert(err.message);
      }
  };

  if (loading) return <div style={{ color: 'white', padding: '2.5rem', textAlign: 'center' }}>Loading Master Control Systems...</div>;

  return (
    <div className="management-page">
      {/* Mobile Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .management-page {
            padding: 0 !important;
          }
          .um-header h1 {
            font-size: 1.7rem !important;
          }
          .um-header p {
            font-size: 0.9rem !important;
          }
          .um-tab-bar {
            width: 100% !important;
          }
          .um-tab-bar button {
            flex: 1 !important;
            justify-content: center !important;
            padding: 0.7rem 0.8rem !important;
            font-size: 0.8rem !important;
          }
          .um-main-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .um-list-card {
            padding: 1rem !important;
          }
          .um-list-card table th,
          .um-list-card table td {
            padding: 0.8rem 0.5rem !important;
            font-size: 0.8rem !important;
          }
          .um-form-sidebar .glass-card {
            padding: 1.2rem !important;
          }
          .um-modal-overlay {
            padding: 10px !important;
            align-items: flex-end !important;
          }
          .um-modal-content {
            padding: 1.5rem !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
            border-radius: 18px !important;
          }
          .um-modal-content h2 {
            font-size: 1.1rem !important;
          }
        }
        @media (max-width: 400px) {
          .um-header h1 {
            font-size: 1.4rem !important;
          }
          .um-list-card {
            padding: 0.6rem !important;
          }
        }
      `}</style>

      <div className="um-header" style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '0.4rem' }}>User Control Center</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Manage Principals, Teachers, and platform access nodes.</p>
      </div>

      {/* Tabs */}
      <div className="um-tab-bar" style={{ display: 'flex', gap: '0.8rem', marginBottom: '2.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '18px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
        {userData?.role === 'admin' && (
          <TabButton active={activeTab === 'schools'} onClick={() => setActiveTab('schools')} icon={<School size={18} />} label="Schools" />
        )}
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18} />} label="Users & Roles" />
      </div>

      <div className="um-main-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 340px',
          gap: '2rem',
          alignItems: 'stretch'
      }}>
        
        {/* Main List Area */}
        <div className="glass-card um-list-card" style={{ padding: '2rem', minWidth: '0' }}>
          {activeTab === 'schools' ? (
            <TableSection 
                title="Active School Registrations" 
                schools={schools} 
                onEdit={handleEditSchool} 
                onDelete={handleDeleteSchool}
            />
          ) : (
            <UserTable 
                users={users} 
                schools={schools} 
                onEdit={handleEditClick} 
                onDelete={deleteUser}
                currentUserId={userData?.uid}
            />
          )}
        </div>

        {/* Global Action Sidebar */}
        <div className="um-form-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {activeTab === 'schools' && userData?.role === 'admin' && (
            <CreationCard 
                title="Register New School" 
                onSubmit={handleCreateSchool} 
                loading={actionLoading}
            >
                <input 
                    type="text" 
                    placeholder="Official school Name"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    style={inputStyle}
                />
            </CreationCard>
          )}

          <CreationCard 
              title="Grant Access Pass" 
              onSubmit={handleCreateUser} 
              loading={actionLoading}
          >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ position: 'relative' }}>
                      <Fingerprint size={16} style={inputIconStyle} />
                      <input type="text" placeholder="Full Name" value={newUserName} onChange={e => setNewUserName(e.target.value)} style={inputWithIconStyle} />
                  </div>
                  <div style={{ position: 'relative' }}>
                      <Mail size={16} style={inputIconStyle} />
                      <input type="email" placeholder="Email Address" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} style={inputWithIconStyle} />
                  </div>
                  <div style={{ position: 'relative' }}>
                      <Lock size={16} style={inputIconStyle} />
                      <input type="password" placeholder="System Password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} style={inputWithIconStyle} />
                  </div>
                  
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={selectStyle}>
                      <option value="principal">Principal (School Admin)</option>
                      <option value="teacher">Teacher (Staff)</option>
                      {userData?.role === 'admin' && <option value="admin">Platform Admin</option>}
                  </select>

                  <select value={targetSchoolId} onChange={e => setTargetSchoolId(e.target.value)} style={selectStyle}>
                      <option value="">Link to School...</option>
                      {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
              </div>
          </CreationCard>
        </div>
      </div>

      {/* Edit User Modal */}
      {editUser && (
          <div className="um-modal-overlay" style={modalOverlayStyle}>
              <div className="glass-card um-modal-content" style={modalContentStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                      <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <Edit2 size={24} color="var(--primary-glow)" /> Edit Access Credentials
                      </h2>
                      <button onClick={() => setEditUser(null)} style={closeBtnStyle}><X size={20} /></button>
                  </div>

                  <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="form-group">
                          <label style={labelStyle}>Full Name</label>
                          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
                      </div>
                      <div className="form-group">
                          <label style={labelStyle}>Access Email (Auth tied)</label>
                          <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} style={inputStyle} />
                      </div>
                      <div className="form-group">
                          <label style={labelStyle}>User Role</label>
                          <select value={editRole} onChange={e => setEditRole(e.target.value)} style={selectStyle}>
                              <option value="principal">Principal</option>
                              <option value="teacher">Teacher</option>
                              <option value="admin">Admin</option>
                              <option value="student">Student</option>
                          </select>
                      </div>
                      <div className="form-group">
                          <label style={labelStyle}>Assigned School</label>
                          <select value={editSchoolId} onChange={e => setEditSchoolId(e.target.value)} style={selectStyle}>
                              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                          <button type="button" onClick={() => setEditUser(null)} style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid #334155', borderRadius: '14px', color: 'white', cursor: 'pointer' }}>Cancel</button>
                          <button type="submit" disabled={actionLoading} style={{ flex: 1 }} className="btn-primary">
                              {actionLoading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Edit School Modal */}
      {editSchool && (
          <div className="um-modal-overlay" style={modalOverlayStyle}>
              <div className="glass-card um-modal-content" style={modalContentStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                      <h2 style={{ color: 'white' }}>Update School Name</h2>
                      <button onClick={() => setEditSchool(null)} style={closeBtnStyle}><X size={20} /></button>
                  </div>
                  <form onSubmit={handleUpdateSchool} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <input type="text" value={editSchoolTitle} onChange={e => setEditSchoolTitle(e.target.value)} style={inputStyle} />
                      <button type="submit" disabled={actionLoading} className="btn-primary">
                          {actionLoading ? <Loader2 className="animate-spin" /> : 'Save School Details'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

// Sub-components
const TabButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    style={{ 
      padding: '0.8rem 1.6rem', 
      borderRadius: '14px', 
      border: 'none', 
      background: active ? 'var(--primary)' : 'transparent',
      color: active ? 'white' : 'var(--text-dim)',
      fontWeight: '700',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: active ? '0 10px 20px -5px rgba(99, 102, 241, 0.4)' : 'none'
    }}
  >
    {icon} {label}
  </button>
);

const UserTable = ({ users, schools, onEdit, onDelete, currentUserId }) => (
    <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={thStyle}>Platform User</th>
                    <th style={thStyle}>Permissions</th>
                    <th style={thStyle}>Node / School</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={tdStyle}>
                            <div style={{ color: 'white', fontWeight: '700' }}>{u.name || 'Anonymous'} {u.id === currentUserId && <span style={{fontSize: '0.6rem', color: '#6366f1', marginLeft: '5px'}}>(YOU)</span>}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{u.email}</div>
                        </td>
                        <td style={tdStyle}>
                            <span style={{ 
                                padding: '0.4rem 0.8rem', 
                                borderRadius: '10px', 
                                fontSize: '0.7rem', 
                                fontWeight: '800', 
                                textTransform: 'uppercase',
                                background: u.role === 'principal' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                color: u.role === 'principal' ? '#10b981' : '#6366f1',
                                border: `1px solid ${u.role === 'principal' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`
                            }}>{u.role}</span>
                        </td>
                        <td style={tdStyle}>
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                {schools.find(s => s.id === u.schoolId)?.name || 'Standalone'}
                            </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => onEdit(u)} style={iconBtnStyle} title="Edit User"><Edit2 size={16} /></button>
                                <button onClick={() => onDelete(u.id)} style={{ ...iconBtnStyle, color: '#f43f5e' }} title="Remove user Profile"><Trash2 size={16} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const CreationCard = ({ title, children, onSubmit, loading }) => (
    <div className="glass-card" style={{ padding: '1.8rem', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h4 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <Plus size={18} color="var(--primary-glow)" /> {title}
        </h4>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {children}
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? <Loader2 size={20} className="animate-spin" /> : title}
            </button>
        </form>
    </div>
);

const TableSection = ({ title, schools, onEdit, onDelete }) => (
    <div>
        <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>{title}</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
            {schools.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem', background: 'rgba(15,23,42,0.4)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                        <h4 style={{ color: 'white', margin: 0 }}>{s.name}</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>Namespace: {s.id}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => onEdit(s)} style={iconBtnStyle}><Edit2 size={16} /></button>
                        <button onClick={() => onDelete(s.id)} style={{ ...iconBtnStyle, color: '#f43f5e' }}><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Styles
const inputStyle = { width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: '16px' };
const inputWithIconStyle = { ...inputStyle, paddingLeft: '2.5rem' };
const inputIconStyle = { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' };
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const thStyle = { padding: '1.2rem', color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' };
const tdStyle = { padding: '1.2rem' };
const iconBtnStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' };
const labelStyle = { display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.5rem' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem' };
const modalContentStyle = { width: '100%', maxWidth: '500px', padding: '2.5rem', background: '#0f172a', border: '1px solid rgba(99, 102, 241, 0.2)' };
const closeBtnStyle = { background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' };

export default UserManagement;
