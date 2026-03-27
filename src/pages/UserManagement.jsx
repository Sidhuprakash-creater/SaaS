import React, { useState, useEffect } from 'react';
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

// Setup Secondary Auth to create users without logging out current session
const firebaseConfig = primaryAuth.app.options;
const secondaryApp = getApps().find(a => a.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

const UserManagement = () => {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('student');
  const [canAddStudents, setCanAddStudents] = useState(false);
  const [newUserRollNo, setNewUserRollNo] = useState('');
  const [newUserClass, setNewUserClass] = useState('');
  const [newUserSection, setNewUserSection] = useState('');
  const [childRollNo, setChildRollNo] = useState('');
  const [childClass, setChildClass] = useState('');
  const [foundStudent, setFoundStudent] = useState(null);
  const [searchingStudent, setSearchingStudent] = useState(false);

  // Edit states
  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editCanAddStudents, setEditCanAddStudents] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userData]);

  // Child Search Logic
  useEffect(() => {
    if (newUserRole === 'parent' && childRollNo && childClass && userData?.schoolId) {
        const delaySearch = setTimeout(() => {
            searchForChild();
        }, 600);
        return () => clearTimeout(delaySearch);
    } else {
        setFoundStudent(null);
    }
  }, [childRollNo, childClass, newUserRole]);

  const searchForChild = async () => {
      setSearchingStudent(true);
      try {
          const q = query(
              collection(db, 'users'), 
              where('schoolId', '==', userData.schoolId),
              where('role', '==', 'student'),
              where('rollNo', '==', childRollNo),
              where('class', '==', childClass)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
              const student = { id: snap.docs[0].id, ...snap.docs[0].data() };
              setFoundStudent(student);
          } else {
              setFoundStudent(null);
          }
      } catch (err) {
          console.error("Search failed:", err);
      }
      setSearchingStudent(false);
  };

  const fetchData = async () => {
    if(!userData) return;
    setLoading(true);
    try {
      // Schools (Used for labels)
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      const schoolsList = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchools(schoolsList);

      // Users filtering (Principal only sees their school, Teacher only sees students)
      let usersQuery;
      if (userData.role === 'teacher') {
          usersQuery = query(collection(db, 'users'), 
              where('schoolId', '==', userData.schoolId),
              where('role', 'in', ['student', 'parent'])
          );
      } else {
          usersQuery = query(collection(db, 'users'), where('schoolId', '==', userData.schoolId));
      }
      
      const usersSnapshot = await getDocs(usersQuery);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const schoolId = userData?.schoolId;
    
    if (!newUserEmail || !newUserPassword || !schoolId) {
      alert("Please provide Email, Password and ensure School is linked.");
      return;
    }

    setActionLoading(true);
    try {
      const trimmedEmail = newUserEmail.trim();
      const trimmedPassword = newUserPassword.trim();
      
      // 1. Create in Firebase Auth (Secondary Instance)
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, trimmedEmail, trimmedPassword);
      const uid = userCredential.user.uid;
      
      // 2. Create profile in Firestore
      await setDoc(doc(db, 'users', uid), {
        name: newUserName.trim(),
        email: trimmedEmail,
        role: newUserRole,
        schoolId: schoolId,
        createdAt: serverTimestamp(),
        canAddStudents: newUserRole === 'teacher' ? canAddStudents : false,
        ...(newUserRole === 'student' && {
            rollNo: newUserRollNo,
            class: newUserClass,
            section: newUserSection.toUpperCase()
        }),
        ...(newUserRole === 'parent' && foundStudent && {
            childId: foundStudent.id,
            childName: foundStudent.name,
            childClass: foundStudent.class,
            childRollNo: foundStudent.rollNo,
            childSection: foundStudent.section.toUpperCase()
        })
      });

      // Cleanup
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRollNo('');
      setNewUserClass('');
      setNewUserSection('');
      setChildRollNo('');
      setChildClass('');
      setFoundStudent(null);
      setCanAddStudents(false);
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
      setEditRollNo(user.rollNo || '');
      setEditClass(user.class || '');
      setEditSection(user.section || '');
      setEditCanAddStudents(user.canAddStudents || false);
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
              canAddStudents: editRole === 'teacher' ? editCanAddStudents : false,
              ...(editRole === 'student' && {
                  rollNo: editRollNo,
                  class: editClass,
                  section: editSection
              }),
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
      if(!window.confirm("Are you sure you want to remove this profile? This will permanently delete their data and login access.")) return;
      setActionLoading(true);
      try {
          // 1. Attempt to Delete from Firebase Auth via Cloud Function
          try {
              const deleteAuth = httpsCallable(functions, 'deleteUserAccount');
              await deleteAuth({ uid: uid });
          } catch (authErr) {
              console.warn("Could not delete from Firebase Auth (likely due to missing Cloud Functions backend setup). Error:", authErr);
              // Fallback: Proceed to delete Firestore document so platform access is revoked.
          }

          // 2. Delete from Firestore
          await deleteDoc(doc(db, 'users', uid));
          
          fetchData();
          alert("User profile and platform access revoked successfully.");
      } catch (err) {
          console.error("Deletion Error:", err);
          alert("Could not remove user profile from database. Error: " + err.message);
      }
      setActionLoading(false);
  };

  if (loading) return <div style={{ color: 'white', padding: '2.5rem', textAlign: 'center' }}>Synchronizing School Database...</div>;

  return (
    <div className="management-page" style={{ width: '100%', textAlign: 'left' }}>
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
          .um-list-card table th {
            padding: 0.8rem 0.5rem !important;
            font-size: 0.65rem !important;
          }
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
          .um-modal-content .um-edit-grid {
            grid-template-columns: 1fr !important;
          }
          .um-modal-btns {
            flex-direction: column-reverse !important;
          }
        }
        @media (max-width: 400px) {
          .um-header h1 {
            font-size: 1.4rem !important;
          }
          .um-list-card {
            padding: 0.6rem !important;
          }
          .um-student-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="um-header" style={{ marginBottom: '2.5rem', width: '100%' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '0.4rem', textAlign: 'left' }}>School Control Center</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', textAlign: 'left' }}>Manage Staff, Students, and local access nodes for {userData?.schoolDetails?.name}.</p>
      </div>

      <div className="um-tab-bar" style={{ display: 'flex', gap: '0.8rem', marginBottom: '2.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '18px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18} />} label={userData?.role === 'teacher' ? "Student & Parent Profiles" : "Staff & Students"} />
      </div>

      <div className="um-main-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 340px',
          gap: '2rem',
          alignItems: 'stretch'
      }}>
        
        {/* Main List Area */}
        <div className="glass-card um-list-card" style={{ padding: '2rem', minWidth: '0' }}>
            <UserTable 
                users={users} 
                onEdit={handleEditClick} 
                onDelete={deleteUser}
                currentUserId={userData?.uid}
            />
        </div>

        {/* Action Sidebar */}
        <div className="um-form-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                      <input type="password" placeholder="Set Password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} style={inputWithIconStyle} />
                  </div>
                  
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={selectStyle}>
                      {userData?.role !== 'teacher' && <option value="teacher">Teacher (Staff)</option>}
                      <option value="student">Student</option>
                      <option value="parent">Parent</option>
                  </select>

                  {newUserRole === 'parent' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                            <select value={childClass} onChange={e => setChildClass(e.target.value)} style={selectStyle}>
                                <option value="">Child's Class...</option>
                                {[...Array(10)].map((_, i) => (
                                    <option key={i+1} value={i+1}>Class {i+1}</option>
                                ))}
                            </select>
                            <input type="text" placeholder="Child's Roll No" value={childRollNo} onChange={e => setChildRollNo(e.target.value)} style={inputStyle} />
                        </div>
                        
                        {searchingStudent && <div style={{ fontSize: '0.75rem', color: 'var(--primary-glow)', textAlign: 'center' }}><Loader2 size={12} className="animate-spin inline" /> Locating child...</div>}
                        
                        {!searchingStudent && foundStudent && (
                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.8rem', borderRadius: '10px' }}>
                                <div style={{ fontSize: '0.65rem', color: '#22c55e', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>Child Found</div>
                                <div style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>{foundStudent.name}</div>
                                <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Class {foundStudent.class} • Section {foundStudent.section}</div>
                            </div>
                        )}
                        
                        {!searchingStudent && !foundStudent && childRollNo && childClass && (
                            <div style={{ fontSize: '0.75rem', color: '#ef4444', textAlign: 'center' }}>No student found with these credentials.</div>
                        )}
                    </div>
                  )}

                  {newUserRole === 'student' && (
                    <div className="um-student-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
                        <input type="text" placeholder="Roll No" value={newUserRollNo} onChange={e => setNewUserRollNo(e.target.value)} style={inputStyle} />
                        <select value={newUserClass} onChange={e => setNewUserClass(e.target.value)} style={selectStyle}>
                            <option value="">Class...</option>
                            {[...Array(10)].map((_, i) => (
                                <option key={i+1} value={i+1}>Class {i+1}</option>
                            ))}
                        </select>
                        <input type="text" placeholder="Section" value={newUserSection} onChange={e => setNewUserSection(e.target.value)} style={inputStyle} />
                    </div>
                  )}

                  {newUserRole === 'teacher' && userData?.role !== 'teacher' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(99, 102, 241, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '600' }}>Enrollment Access</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Allow teacher to register students & parents</div>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                        <input 
                          type="checkbox" 
                          checked={canAddStudents} 
                          onChange={(e) => setCanAddStudents(e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: canAddStudents ? 'var(--primary)' : '#334155',
                          transition: '.4s',
                          borderRadius: '20px'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: '14px', width: '14px',
                            left: canAddStudents ? '22px' : '3px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            transition: '.4s',
                            borderRadius: '50%'
                          }}></span>
                        </span>
                      </label>
                    </div>
                  )}
              </div>
          </CreationCard>
        </div>
      </div>

      {/* Edit User Modal */}
      {editUser && (
          <div className="um-modal-overlay" style={modalOverlayStyle}>
              <div className="glass-card um-modal-content" style={modalContentStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                      <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <Edit2 size={24} color="var(--primary-glow)" /> Modify Credentials
                      </h2>
                      <button onClick={() => setEditUser(null)} style={closeBtnStyle}><X size={20} /></button>
                  </div>

                  <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="form-group">
                          <label style={labelStyle}>Full Name</label>
                          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
                      </div>
                      <div className="form-group">
                          <label style={labelStyle}>Email</label>
                          <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} style={inputStyle} />
                      </div>
                      <div className="form-group">
                          <label style={labelStyle}>User Role</label>
                          <select value={editRole} onChange={e => setEditRole(e.target.value)} style={selectStyle}>
                              {userData?.role !== 'teacher' && <option value="teacher">Teacher</option>}
                              <option value="student">Student</option>
                              <option value="parent">Parent</option>
                          </select>
                      </div>

                      {editRole === 'student' && (
                        <div className="form-group">
                            <label style={labelStyle}>Academic Details (Roll / Class / Section)</label>
                            <div className="um-edit-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                <input type="text" placeholder="Roll No" value={editRollNo} onChange={e => setEditRollNo(e.target.value)} style={inputStyle} />
                                <select value={editClass} onChange={e => setEditClass(e.target.value)} style={selectStyle}>
                                    <option value="">Class...</option>
                                    {[...Array(10)].map((_, i) => (
                                        <option key={i+1} value={i+1}>Class {i+1}</option>
                                    ))}
                                </select>
                                <input type="text" placeholder="Section" value={editSection} onChange={e => setEditSection(e.target.value)} style={inputStyle} />
                            </div>
                        </div>
                      )}

                      {editRole === 'teacher' && userData?.role !== 'teacher' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(99, 102, 241, 0.05)', padding: '1.2rem', borderRadius: '14px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600' }}>Enrollment Access</div>
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Full access to create and manage student & parent accounts</div>
                          </div>
                          <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                            <input 
                              type="checkbox" 
                              checked={editCanAddStudents} 
                              onChange={(e) => setEditCanAddStudents(e.target.checked)}
                              style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                              position: 'absolute',
                              cursor: 'pointer',
                              top: 0, left: 0, right: 0, bottom: 0,
                              backgroundColor: editCanAddStudents ? 'var(--primary)' : '#334155',
                              transition: '.4s',
                              borderRadius: '24px'
                            }}>
                              <span style={{
                                position: 'absolute',
                                content: '""',
                                height: '18px', width: '18px',
                                left: editCanAddStudents ? '22px' : '4px',
                                bottom: '3px',
                                backgroundColor: 'white',
                                transition: '.4s',
                                borderRadius: '24px'
                              }}></span>
                            </span>
                          </label>
                        </div>
                      )}

                      <div className="um-modal-btns" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                          <button type="button" onClick={() => setEditUser(null)} style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid #334155', borderRadius: '14px', color: 'white', cursor: 'pointer' }}>Cancel</button>
                          <button type="submit" disabled={actionLoading} style={{ flex: 1 }} className="btn-primary">
                              {actionLoading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

// Sub-components (Identical to Admin Portal)
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

const UserTable = ({ users, onEdit, onDelete, currentUserId }) => (
    <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={thStyle}>Staff / Student</th>
                    <th style={thStyle}>Role</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={tdStyle}>
                            <div style={{ color: 'white', fontWeight: '700' }}>
                                {u.name || 'Anonymous Meta'} {u.id === currentUserId && <span style={{fontSize: '0.65rem', color: 'var(--primary-glow)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px'}}>YOU</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>{u.email}</span>
                                {u.role === 'student' && (u.class || u.section || u.rollNo) && (
                                    <span style={{ color: 'var(--primary-glow)', background: 'rgba(99, 102, 241, 0.1)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.65rem' }}>
                                        {u.class}{u.section}{u.rollNo ? `-${u.rollNo}` : ''}
                                    </span>
                                )}
                                {u.role === 'parent' && u.childName && (
                                    <span style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.65rem' }}>
                                        Parent of {u.childName}
                                    </span>
                                )}
                            </div>
                        </td>
                        <td style={tdStyle}>
                            <span style={{ 
                                padding: '0.4rem 0.8rem', 
                                borderRadius: '10px', 
                                fontSize: '0.7rem', 
                                fontWeight: '800', 
                                textTransform: 'uppercase',
                                background: u.role === 'teacher' ? 'rgba(99, 102, 241, 0.1)' : u.role === 'parent' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                                color: u.role === 'teacher' ? '#6366f1' : u.role === 'parent' ? '#22c55e' : 'white',
                                border: `1px solid ${u.role === 'teacher' ? 'rgba(99, 102, 241, 0.2)' : u.role === 'parent' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)'}`
                            }}>{u.role}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                            {u.id !== currentUserId ? (
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button onClick={() => onEdit(u)} style={iconBtnStyle} title="Edit User"><Edit2 size={16} /></button>
                                    <button onClick={() => onDelete(u.id)} style={{ ...iconBtnStyle, color: '#f43f5e' }} title="Remove Record"><Trash2 size={16} /></button>
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>Protected</div>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const CreationCard = ({ title, children, onSubmit, loading }) => (
    <div className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.08)' }}>
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

// Styles
const inputStyle = { width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: '16px' };
const inputWithIconStyle = { ...inputStyle, paddingLeft: '2.5rem' };
const inputIconStyle = { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' };
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const thStyle = { padding: '1.2rem', color: '#64748b', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' };
const tdStyle = { padding: '1.2rem' };
const iconBtnStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' };
const labelStyle = { display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.5rem' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem' };
const modalContentStyle = { width: '100%', maxWidth: '500px', padding: '2.5rem', background: '#0f172a', border: '1px solid rgba(99, 102, 241, 0.2)' };
const closeBtnStyle = { background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' };

export default UserManagement;
