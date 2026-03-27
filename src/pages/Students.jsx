import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, UserPlus, Search, Filter, MoreVertical, GraduationCap, Mail, Phone, Calendar } from 'lucide-react';

const Students = () => {
  const { userData } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', class: '', rollNo: '' });

  useEffect(() => {
    fetchStudents();
  }, [userData]);

  const fetchStudents = async () => {
    if (!userData?.schoolId) return;
    try {
      const q = query(collection(db, 'users'), 
        where('schoolId', '==', userData.schoolId),
        where('role', '==', 'student')
      );
      const snapshot = await getDocs(q);
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'users'), {
        ...newStudent,
        role: 'student',
        schoolId: userData.schoolId,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewStudent({ name: '', email: '', class: '', rollNo: '' });
      fetchStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '0.5rem' }}>Student Directory</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Manage and view all students in your school.</p>
        </div>

        {userData?.permissions?.canAddStudents && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1rem 1.5rem' }}
          >
            <UserPlus size={20} />
            Add New Student
          </button>
        )}
      </div>

      {/* Filters/Search */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', background: 'rgba(30, 41, 59, 0.3)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder="Search students by name, email or roll number..." 
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.05)', color: 'white' }}
          />
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' }}>
          <Filter size={18} />
          Filters
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {students.map(student => (
          <div key={student.id} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(30, 41, 59, 0.4)', transition: 'transform 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--primary)', padding: '0.8rem', borderRadius: '14px' }}>
                <GraduationCap color="white" size={24} />
              </div>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <MoreVertical size={20} />
              </button>
            </div>
            
            <h3 style={{ color: 'white', margin: '0 0 0.25rem 0', fontSize: '1.2rem' }}>{student.name}</h3>
            <p style={{ color: 'var(--primary-glow)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Class {student.class || 'N/A'} • RN: {student.rollNo || '--'}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                <Mail size={16} /> {student.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                <Calendar size={16} /> Joined Feb 2026
              </div>
            </div>
            
            <button style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
              View Academic Profile
            </button>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', position: 'relative' }}>
            <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Add New Student</h2>
            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <input 
                placeholder="Student Full Name"
                required
                value={newStudent.name}
                onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
              <input 
                placeholder="Student Email Address"
                type="email"
                required
                value={newStudent.email}
                onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  placeholder="Class (e.g. 10A)"
                  required
                  value={newStudent.class}
                  onChange={(e) => setNewStudent({...newStudent, class: e.target.value})}
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
                <input 
                  placeholder="Roll No"
                  required
                  value={newStudent.rollNo}
                  onChange={(e) => setNewStudent({...newStudent, rollNo: e.target.value})}
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '600' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '1rem', borderRadius: '12px' }}>Enroll Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
