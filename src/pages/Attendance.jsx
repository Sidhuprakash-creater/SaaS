import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  doc, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Filter, 
  Search, 
  ClipboardCheck,
  TrendingUp,
  History,
  ChevronRight,
  Loader2
} from 'lucide-react';

const Attendance = () => {
    const { userData } = useAuth();
    const [view, setView] = useState('mark'); // 'mark' or 'history'
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [students, setStudents] = useState([]);
    
    // Filters
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [timeFilter, setTimeFilter] = useState('week'); // 'week', 'month', 'year'
    
    // Attendance State
    const [attendanceData, setAttendanceData] = useState({}); // { studentId: 'present' | 'absent' }
    const [stats, setStats] = useState([]); // Array of { name, present, absent }
    const [isLocked, setIsLocked] = useState(false);
    const [realStats, setRealStats] = useState({ present: 0, absent: 0, percentage: '0%' });

    // CSS Styles
    const styles = {
        container: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
        card: { background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px' },
        statBox: { background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '18px', textAlign: 'center' },
        label: { display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '700', textTransform: 'uppercase' },
        input: { width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: '16px' },
        btnGroup: { display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' },
        toggle: { padding: '0.6rem 1.2rem', border: 'none', background: 'transparent', color: '#94a3b8', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: '0.3s' },
        activeToggle: { backgroundColor: '#6366f1', color: 'white' },
        row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(15,23,42,0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.02)', marginBottom: '8px' },
        avatar: { width: '36px', height: '36px', background: '#6366f1', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem', fontWeight: '900', color: 'white' },
        statusBtn: { padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }
    };

    useEffect(() => {
        if (!userData?.schoolId) return;

        if (userData.role === 'teacher' || userData.role === 'admin') {
            if (selectedClass && selectedSection) {
                fetchStudentsAndCheckLock();
            } else {
                setLoading(false);
            }
        } else {
            fetchPersonalAttendance();
        }
    }, [selectedClass, selectedSection, selectedDate, userData]);

    const fetchStudentsAndCheckLock = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'users'), 
                where('schoolId', '==', userData.schoolId),
                where('role', '==', 'student'),
                where('class', '==', String(selectedClass)),
                where('section', '==', selectedSection.toUpperCase())
            );
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(list);
            
            const docId = `${userData.schoolId}_${selectedDate}_${selectedClass}_${selectedSection.toUpperCase()}`;
            const attendanceDoc = await getDocs(query(collection(db, 'attendance'), where('__name__', '==', docId)));
            
            if (!attendanceDoc.empty) {
                const data = attendanceDoc.docs[0].data();
                setAttendanceData(data.records || {});
                setIsLocked(true);
            } else {
                const initial = {};
                list.forEach(s => initial[s.id] = 'present');
                setAttendanceData(initial);
                setIsLocked(false);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const fetchPersonalAttendance = async () => {
        setLoading(true);
        try {
            const targetID = userData.role === 'student' ? userData.uid : userData.childId;
            if (!targetID) {
                setLoading(false);
                return;
            }

            const q = query(
                collection(db, 'attendance'), 
                where('schoolId', '==', userData.schoolId)
            );
            
            const snap = await getDocs(q);
            let p = 0; let a = 0;
            
            snap.docs.forEach(docSnap => {
                const data = docSnap.data();
                if (data.records && data.records[targetID]) {
                    data.records[targetID] === 'present' ? p++ : a++;
                }
            });
            
            const total = p + a;
            setRealStats({
                present: p,
                absent: a,
                percentage: total > 0 ? Math.round((p / total) * 100) + '%' : '0%'
            });
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleMarkAttendance = async () => {
        if (!students.length) return;
        setActionLoading(true);
        try {
            const cleanSection = selectedSection.toUpperCase();
            const docId = `${userData.schoolId}_${selectedDate}_${selectedClass}_${cleanSection}`;
            await setDoc(doc(db, 'attendance', docId), {
                schoolId: userData.schoolId,
                date: selectedDate,
                class: String(selectedClass),
                section: cleanSection,
                records: attendanceData,
                updatedAt: serverTimestamp(),
                markedBy: userData.uid
            });
            setIsLocked(true);
            alert("Attendance recorded successfully!");
        } catch (err) {
            alert("Error: " + err.message);
        }
        setActionLoading(false);
    };

    const generateStats = async () => {
        if (!selectedClass || !selectedSection || !students.length) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, 'attendance'),
                where('schoolId', '==', userData.schoolId),
                where('class', '==', String(selectedClass)),
                where('section', '==', selectedSection.toUpperCase())
            );
            
            const snap = await getDocs(q);
            const attendanceDocs = snap.docs.map(d => d.data());

            const statsResult = students.map(s => {
                let pCount = 0; let aCount = 0;
                attendanceDocs.forEach(doc => {
                    if (doc.records && doc.records[s.id]) {
                        doc.records[s.id] === 'present' ? pCount++ : aCount++;
                    }
                });
                const total = pCount + aCount;
                return {
                    id: s.id,
                    name: s.name,
                    present: pCount,
                    absent: aCount,
                    percentage: total > 0 ? Math.round((pCount / total) * 100) + '%' : '0%'
                };
            });
            setStats(statsResult);
            setView('history');
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    if (userData?.role === 'parent' || userData?.role === 'student') {
        return (
            <div className="att-container" style={styles.container}>
                {/* Mobile CSS */}
                <style>{`
                    @media (max-width: 768px) {
                        .att-container { padding: 4px !important; }
                        .att-parent-card { padding: 1.5rem !important; border-radius: 18px !important; }
                        .att-parent-card h2 { font-size: 1.5rem !important; }
                        .att-parent-stats { grid-template-columns: 1fr !important; gap: 12px !important; }
                        .att-parent-stats .att-stat-val { font-size: 2.2rem !important; }
                    }
                `}</style>
                <div className="att-parent-card" style={{ ...styles.card, background: 'rgba(34, 197, 94, 0.05)', textAlign: 'center', padding: '3rem' }}>
                    <h2 style={{ color: 'white', marginBottom: '1rem', fontSize: '2rem' }}>Personal Attendance Track</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '3rem' }}>
                        Records for: <strong style={{color: '#fff'}}>{userData.childName || userData.name}</strong>
                    </p>
                    
                    {loading ? (
                         <div style={{ padding: '2rem' }}>
                            <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto', color: '#6366f1' }} />
                         </div>
                    ) : (
                        <div className="att-parent-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                            <div style={styles.statBox}>
                                <div className="att-stat-val" style={{ fontSize: '3rem', fontWeight: '800', color: '#818cf8' }}>{realStats.percentage}</div>
                                <div style={{ color: '#94a3b8', marginTop: '8px' }}>Overall Attendance</div>
                            </div>
                            <div style={styles.statBox}>
                                <div className="att-stat-val" style={{ fontSize: '3rem', fontWeight: '800', color: '#10b981' }}>{realStats.present}</div>
                                <div style={{ color: '#94a3b8', marginTop: '8px' }}>Days Present</div>
                            </div>
                            <div style={styles.statBox}>
                                <div className="att-stat-val" style={{ fontSize: '3rem', fontWeight: '800', color: '#f43f5e' }}>{realStats.absent}</div>
                                <div style={{ color: '#94a3b8', marginTop: '8px' }}>Days Absent</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="att-container" style={styles.container}>
            {/* Mobile Responsive CSS */}
            <style>{`
                @media (max-width: 768px) {
                    .att-container {
                        padding: 4px !important;
                    }
                    .att-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 14px !important;
                        margin-bottom: 1.5rem !important;
                    }
                    .att-header h1 {
                        font-size: 1.8rem !important;
                    }
                    .att-toggle-group {
                        width: 100% !important;
                    }
                    .att-toggle-group button {
                        flex: 1 !important;
                        justify-content: center !important;
                    }
                    .att-main-grid {
                        grid-template-columns: 1fr !important;
                        gap: 16px !important;
                    }
                    .att-filter-card {
                        padding: 16px !important;
                        border-radius: 16px !important;
                    }
                    .att-content-card {
                        padding: 16px !important;
                        border-radius: 16px !important;
                    }
                    .att-student-row {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 10px !important;
                        padding: 12px !important;
                    }
                    .att-student-row .att-status-btns {
                        width: 100% !important;
                        display: flex !important;
                    }
                    .att-student-row .att-status-btns button {
                        flex: 1 !important;
                        justify-content: center !important;
                    }
                    .att-history-table {
                        font-size: 13px !important;
                    }
                    .att-history-table th,
                    .att-history-table td {
                        padding: 8px !important;
                    }
                }
                @media (max-width: 400px) {
                    .att-header h1 {
                        font-size: 1.5rem !important;
                    }
                    .att-student-row {
                        padding: 10px !important;
                    }
                }
            `}</style>

            <div className="att-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', margin: 0 }}>Attendance Hub</h1>
                    <p style={{ color: '#94a3b8' }}>Managing records for {userData?.schoolName || 'Your School'}</p>
                </div>
                <div className="att-toggle-group" style={styles.btnGroup}>
                    <button onClick={() => setView('mark')} style={{ ...styles.toggle, ...(view === 'mark' ? styles.activeToggle : {}) }}><ClipboardCheck size={18} /> Mark</button>
                    <button onClick={() => setView('history')} style={{ ...styles.toggle, ...(view === 'history' ? styles.activeToggle : {}) }}><History size={18} /> History</button>
                </div>
            </div>

            <div className="att-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '24px' }}>
                <div className="glass-card att-filter-card" style={styles.card}>
                    <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Filter size={18} /> Filters</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={styles.label}>Class</label>
                            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={styles.input}>
                                <option value="">Choose Class</option>
                                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Section</label>
                            <input placeholder="e.g. A" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} style={styles.input} />
                        </div>
                        {view === 'mark' && (
                            <div>
                                <label style={styles.label}>Date</label>
                                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={styles.input} />
                            </div>
                        )}
                        {view === 'history' && (
                            <button onClick={generateStats} className="btn-primary" style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}>Show Report</button>
                        )}
                    </div>
                </div>

                <div className="glass-card att-content-card" style={styles.card}>
                    {!selectedClass || !selectedSection ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
                            <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <p>Select class and section to see students</p>
                        </div>
                    ) : (
                        <div>
                            <h3 style={{ color: 'white', marginBottom: '24px' }}>Class {selectedClass}-{selectedSection}</h3>
                            {view === 'mark' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {students.map(s => (
                                        <div key={s.id} className="att-student-row" style={styles.row}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={styles.avatar}>{s.rollNo || 'S'}</div>
                                                <div style={{ color: 'white', fontWeight: 'bold' }}>{s.name}</div>
                                            </div>
                                            <div className="att-status-btns" style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    onClick={() => !isLocked && setAttendanceData(p => ({...p, [s.id]: 'present'}))}
                                                    style={{ ...styles.statusBtn, ...(attendanceData[s.id] === 'present' ? { background: '#22c55e20', color: '#22c55e', borderColor: '#22c55e40' } : {}) }}
                                                    disabled={isLocked}
                                                >Present</button>
                                                <button 
                                                    onClick={() => !isLocked && setAttendanceData(p => ({...p, [s.id]: 'absent'}))}
                                                    style={{ ...styles.statusBtn, ...(attendanceData[s.id] === 'absent' ? { background: '#f43f5e20', color: '#f43f5e', borderColor: '#f43f5e40' } : {}) }}
                                                    disabled={isLocked}
                                                >Absent</button>
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={handleMarkAttendance} 
                                        className="btn-primary" 
                                        disabled={isLocked || actionLoading}
                                        style={{ marginTop: '20px', width: '100%', justifyContent: 'center', opacity: isLocked ? 0.6 : 1 }}
                                    >
                                        {isLocked ? 'Attendance Submitted' : 'Submit Attendance'}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="att-history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ color: '#475569', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                                                <th style={{ padding: '12px' }}>Name</th>
                                                <th style={{ padding: '12px' }}>Present</th>
                                                <th style={{ padding: '12px' }}>Absent</th>
                                                <th style={{ padding: '12px' }}>%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.map(s => (
                                                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                    <td style={{ padding: '12px', color: 'white' }}>{s.name}</td>
                                                    <td style={{ padding: '12px', color: '#10b981' }}>{s.present}</td>
                                                    <td style={{ padding: '12px', color: '#f43f5e' }}>{s.absent}</td>
                                                    <td style={{ padding: '12px', color: '#818cf8' }}>{s.percentage}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Attendance;
