import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { 
  Plus, 
  Calendar, 
  CheckSquare, 
  FileText, 
  X,
  Loader2,
  Download,
  Trash2,
  BookOpen,
  User,
  CheckCircle2,
  Clock,
  Upload,
  Eye,
  Paperclip
} from 'lucide-react';

const Homework = () => {
  const { userData } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [homeworkList, setHomeworkList] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [childData, setChildData] = useState(null);

  // Submission State
  const [submittingHw, setSubmittingHw] = useState(null);
  const [subRemark, setSubRemark] = useState('');
  const [subFile, setSubFile] = useState(null);

  // View State for Parent
  const [viewingSub, setViewingSub] = useState(null);

  // Form State for Teachers
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [targetSections, setTargetSections] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const availableSections = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    if (!userData?.schoolId) return;

    let unsubHw = () => {};
    let unsubSub = () => {};
    let unsubChild = () => {};

    const startListeners = (targetC, targetS, targetID) => {
      const cleanClass = String(targetC).trim();
      const cleanSection = String(targetS).trim().toUpperCase();

      const hq = query(
        collection(db, 'homework'),
        where('schoolId', '==', userData.schoolId),
        where('targetClass', '==', cleanClass),
        where('targetSections', 'array-contains', cleanSection)
      );

      unsubHw = onSnapshot(hq, (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHomeworkList(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        setLoading(false);
      });

      if (targetID) {
        const sq = query(
          collection(db, 'submissions'), 
          where('studentId', '==', targetID),
          where('schoolId', '==', userData.schoolId)
        );
        unsubSub = onSnapshot(sq, (snap) => {
          const subMap = {};
          snap.docs.forEach(doc => {
            subMap[doc.data().homeworkId] = doc.data();
          });
          setSubmissions(subMap);
        });
      }
    };

    if (userData.role === 'student') {
      if (userData.class && userData.section) {
        startListeners(userData.class, userData.section, userData.uid);
      } else {
        setLoading(false);
      }
    } else if (userData.role === 'parent' && userData.childId) {
      unsubChild = onSnapshot(doc(db, 'users', userData.childId), (snapshot) => {
        if (snapshot.exists()) {
          const cData = snapshot.data();
          setChildData(cData);
          if (cData.class && cData.section) {
            startListeners(cData.class, cData.section, userData.childId);
          }
        } else {
          setLoading(false);
        }
      });
    } else {
      const hq = query(
        collection(db, 'homework'), 
        where('schoolId', '==', userData.schoolId)
      );
      unsubHw = onSnapshot(hq, (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHomeworkList(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        setLoading(false);
      });
    }

    return () => {
      unsubHw();
      unsubSub();
      unsubChild();
    };
  }, [userData]);

  const toggleSection = (sec) => {
    setTargetSections(prev => 
      prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]
    );
  };

  const handlePostAssignment = async (e) => {
    e.preventDefault();
    if (!title || !targetClass || !deadline || targetSections.length === 0) {
      alert("Please fill in Title, Class, Deadline and select at least one Section.");
      return;
    }

    setProcessing(true);
    try {
      let fileData = '';
      let fileName = '';

      if (selectedFile) {
        if (selectedFile.size > 800 * 1024) {
          alert("File size exceeds 800KB. Please upload a smaller file.");
          setProcessing(false);
          return;
        }
        fileName = selectedFile.name;
        fileData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(selectedFile);
          reader.onload = () => resolve(reader.result);
        });
      }

      await addDoc(collection(db, 'homework'), {
        title: title.trim(),
        description: description.trim(),
        deadline,
        targetClass: String(targetClass),
        targetSections,
        fileData,
        fileName,
        schoolId: userData.schoolId,
        teacherId: userData.uid,
        teacherName: userData.name,
        createdAt: serverTimestamp()
      });

      setTitle('');
      setDescription('');
      setDeadline('');
      setTargetClass('');
      setTargetSections([]);
      setSelectedFile(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error posting homework:", error);
      alert("Failed to post homework.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteHomework = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await deleteDoc(doc(db, 'homework', id));
    } catch (error) {
      alert("Error deleting assignment.");
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submittingHw) return;

    setProcessing(true);
    try {
      let fileData = '';
      let fileName = '';

      if (subFile) {
        if (subFile.size > 800 * 1024) {
          alert("File size exceeds 800KB. Please upload a smaller file.");
          setProcessing(false);
          return;
        }
        fileName = subFile.name;
        fileData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(subFile);
          reader.onload = () => resolve(reader.result);
        });
      }

      await addDoc(collection(db, 'submissions'), {
        homeworkId: submittingHw.id,
        studentId: userData.role === 'student' ? userData.uid : userData.childId,
        studentName: userData.role === 'student' ? userData.name : userData.childName,
        schoolId: userData.schoolId,
        remark: subRemark.trim(),
        fileData,
        fileName,
        status: 'submitted',
        submittedAt: serverTimestamp()
      });

      setSubmittingHw(null);
      setSubRemark('');
      setSubFile(null);
      alert("Homework submitted successfully!");
    } catch (error) {
      console.error("Error submitting homework:", error);
      alert("Failed to submit homework. This might be a permission issue in Firestore.");
    } finally {
      setProcessing(false);
    }
  };

  // UI Helper Components
  const styles = {
    container: {
        padding: '24px',
        maxWidth: '1100px',
        margin: '0 auto'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
    },
    title: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: '8px'
    },
    subtitle: {
        color: '#94a3b8'
    },
    formCard: {
        marginBottom: '32px',
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '32px'
    },
    input: {
        width: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid #2e303a',
        borderRadius: '12px',
        padding: '12px 16px',
        color: 'white',
        outline: 'none',
        marginTop: '8px',
        fontSize: '16px',
        boxSizing: 'border-box'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '24px'
    },
    label: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#cbd5e1'
    },
    badge: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        color: '#818cf8',
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    hwCard: {
        background: 'rgba(30, 41, 59, 0.4)',
        border: '1px solid rgba(46, 48, 58, 1)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        gap: '24px'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
    },
    modalContent: {
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '500px',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    }
  }

  return (
    <div className="hw-container" style={styles.container}>
      {/* Mobile Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .hw-container {
            padding: 4px !important;
          }
          .hw-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            margin-bottom: 24px !important;
          }
          .hw-header h1 {
            font-size: 24px !important;
          }
          .hw-header p {
            font-size: 13px !important;
          }
          .hw-header .btn-primary {
            width: 100% !important;
            justify-content: center !important;
          }
          .hw-form-card {
            padding: 20px !important;
            border-radius: 16px !important;
          }
          .hw-form-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .hw-card {
            flex-direction: column !important;
            padding: 16px !important;
            border-radius: 16px !important;
            gap: 14px !important;
          }
          .hw-card h3 {
            font-size: 17px !important;
          }
          .hw-card-meta {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }
          .hw-card-actions {
            flex-direction: row !important;
            width: 100% !important;
          }
          .hw-card-actions button,
          .hw-card-actions span {
            flex: 1;
            text-align: center;
            justify-content: center;
          }
          .hw-modal-content {
            padding: 22px !important;
            border-radius: 18px !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
          .hw-modal-content h2 {
            font-size: 20px !important;
          }
          .hw-modal-overlay {
            padding: 10px !important;
            align-items: flex-end !important;
          }
        }
        @media (max-width: 400px) {
          .hw-container {
            padding: 2px !important;
          }
          .hw-header h1 {
            font-size: 20px !important;
          }
          .hw-card {
            padding: 12px !important;
          }
          .hw-form-card {
            padding: 16px !important;
          }
          .hw-modal-content {
            padding: 16px !important;
          }
        }
      `}</style>

      <header className="hw-header" style={styles.header}>
        <div>
          <h1 style={styles.title}>Academic Homework Hub</h1>
          <p style={styles.subtitle}>
            {userData?.role === 'parent' 
              ? `Tracking homework for ${userData.childName} (Class ${childData?.class || userData.childClass || '--'}-${childData?.section || userData.childSection || '--'})`
              : userData?.role === 'student'
              ? `Assignments for Class ${userData.class}-${userData.section}`
              : "Create and manage homework assignments for students."}
          </p>
        </div>
        {(userData?.role === 'teacher' || userData?.role === 'admin') && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
            style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
            {showForm ? 'Cancel' : 'New Assignment'}
          </button>
        )}
      </header>

      {showForm && (
        <div className="hw-form-card" style={styles.formCard}>
          <h2 style={{ color: 'white', marginBottom: '24px', fontSize: '20px', fontWeight: 'bold' }}>Create New Assignment</h2>
          <form onSubmit={handlePostAssignment}>
            <div className="hw-form-grid" style={styles.grid}>
                <div>
                    <label style={styles.label}>Assignment Title</label>
                    <input style={styles.input} type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. History Chapter 1" />
                </div>
                <div>
                    <label style={styles.label}>Deadline</label>
                    <input style={styles.input} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
            </div>
            <div className="hw-form-grid" style={styles.grid}>
                <div>
                    <label style={styles.label}>Target Class</label>
                    <select style={styles.input} value={targetClass} onChange={(e) => setTargetClass(e.target.value)}>
                        <option value="">Select Class</option>
                        {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
                    </select>
                </div>
                <div>
                    <label style={styles.label}>Target Sections</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {availableSections.map(sec => (
                            <button
                                key={sec}
                                type="button"
                                onClick={() => toggleSection(sec)}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
                                    backgroundColor: targetSections.includes(sec) ? '#6366f1' : 'transparent',
                                    borderColor: targetSections.includes(sec) ? '#818cf8' : '#2e303a',
                                    color: targetSections.includes(sec) ? 'white' : '#94a3b8',
                                    fontWeight: 'bold', cursor: 'pointer'
                                }}
                            >
                                {sec}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
                <label style={styles.label}>Instructions</label>
                <textarea style={{ ...styles.input, height: '100px', resize: 'none' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details..." />
            </div>
            <div style={{ marginBottom: '24px' }}>
                <label style={styles.label}>Attachment (Optional)</label>
                <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ ...styles.input, padding: '8px' }} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={processing}>
                {processing ? 'Processing...' : 'Post Assignment'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Submit Work */}
      {submittingHw && (
        <div className="hw-modal-overlay" style={styles.modalOverlay}>
            <div className="hw-modal-content" style={styles.modalContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h2 style={{ color: 'white', fontSize: '24px' }}>Submit Work</h2>
                    <button onClick={() => setSubmittingHw(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X /></button>
                </div>
                <form onSubmit={handleSubmitWork}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={styles.label}>Your Note</label>
                        <textarea style={{ ...styles.input, height: '120px' }} value={subRemark} onChange={(e) => setSubRemark(e.target.value)} placeholder="Write something about your work..." />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={styles.label}>Upload Solution (PDF/Image)</label>
                        <input type="file" onChange={(e) => setSubFile(e.target.files[0])} style={{ ...styles.input, padding: '8px' }} />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={processing}>
                        {processing ? 'Submitting...' : 'Complete Submission'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* MODAL: View Submission */}
      {viewingSub && (
        <div className="hw-modal-overlay" style={styles.modalOverlay}>
            <div className="hw-modal-content" style={styles.modalContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h2 style={{ color: 'white', fontSize: '24px' }}>Student Submission</h2>
                    <button onClick={() => setViewingSub(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X /></button>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={styles.label}>Remark from Student</label>
                    <div style={{ ...styles.input, minHeight: '60px', backgroundColor: 'rgba(255,255,255,0.05)' }}>{viewingSub.remark || "N/A"}</div>
                </div>
                {viewingSub.fileData && (
                    <div style={{ marginBottom: '20px' }}>
                        <a href={viewingSub.fileData} download={viewingSub.fileName} style={{ color: '#818cf8', fontWeight: 'bold' }}>Download Attachment 📥</a>
                    </div>
                )}
                <div style={{ fontSize: '12px', color: '#475569' }}>Submitted At: {viewingSub.submittedAt?.toDate().toLocaleString()}</div>
            </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="animate-spin" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {homeworkList.map(hw => {
            const sub = submissions[hw.id];
            const done = !!sub;
            return (
              <div key={hw.id} className="hw-card" style={{ ...styles.hwCard, borderLeft: done ? '4px solid #10b981' : '4px solid #334155' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        <span style={styles.badge}>Class {hw.targetClass}</span>
                        {done && <span style={{ ...styles.badge, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>SUBMITTED</span>}
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{hw.title}</h3>
                    <p style={{ color: '#94a3b8', margin: '8px 0' }}>{hw.description}</p>
                    <div className="hw-card-meta" style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#64748b', marginTop: '16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14}/> {hw.deadline}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14}/> {hw.teacherName}</span>
                        {hw.fileData && (
                            <a 
                              href={hw.fileData} 
                              download={hw.fileName}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#818cf8', textDecoration: 'none', fontWeight: '600' }}
                            >
                                <Download size={14} /> {hw.fileName}
                            </a>
                        )}
                    </div>
                </div>
                <div className="hw-card-actions" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                    {userData.role === 'student' && !done && (
                        <button onClick={() => setSubmittingHw(hw)} className="btn-primary" style={{ padding: '8px 16px' }}>Submit Work</button>
                    )}
                    {userData.role === 'parent' && (
                        done ? 
                        <button onClick={() => setViewingSub(sub)} style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid #6366f1', color: '#818cf8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>View Work 👁️</button> :
                        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>PENDING</span>
                    )}
                    {(userData.role === 'teacher' || userData.role === 'admin') && (
                        <button onClick={() => handleDeleteHomework(hw.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18}/></button>
                    )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};

export default Homework;
