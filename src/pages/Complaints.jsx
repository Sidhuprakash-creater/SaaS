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
  updateDoc,
  doc
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Plus, 
  X, 
  Phone, 
  CheckCircle, 
  Clock, 
  User, 
  AlertCircle,
  Loader2,
  PhoneCall,
  Search,
  FileText,
  Shield
} from 'lucide-react';

const Complaints = () => {
    const { userData } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [processing, setProcessing] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [phone, setPhone] = useState('');

    // Resolve Modal State
    const [resolveModal, setResolveModal] = useState(null); // holds complaint id & title when modal is open
    const [resolveDescription, setResolveDescription] = useState('');
    const [resolving, setResolving] = useState(false);

    // Case-insensitive role check
    const role = userData?.role?.toLowerCase();
    const isStaff = role === 'teacher' || role === 'principal' || role === 'admin';

    useEffect(() => {
        if (!userData?.schoolId) return;

        let q;
        if (isStaff) {
            q = query(
                collection(db, 'complaints'), 
                where('schoolId', '==', userData.schoolId)
            );
        } else {
            q = query(
                collection(db, 'complaints'), 
                where('parentId', '==', userData.uid)
            );
        }

        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setComplaints(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
            setLoading(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            setLoading(false);
        });

        return () => unsub();
    }, [userData, isStaff]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !desc.trim() || !phone.trim()) {
            alert("Please fill all fields.");
            return;
        }

        setProcessing(true);
        try {
            await addDoc(collection(db, 'complaints'), {
                title: title.trim(),
                description: desc.trim(),
                phoneNumber: phone.trim(),
                parentId: userData.uid,
                parentName: userData.name,
                schoolId: userData.schoolId,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            setTitle('');
            setDesc('');
            setPhone('');
            setShowForm(false);
            alert("Complaint submitted successfully.");
        } catch (err) {
            console.error(err);
            alert("Error submitting complaint.");
        }
        setProcessing(false);
    };

    // Open resolve modal
    const openResolveModal = (complaint) => {
        setResolveModal({ id: complaint.id, title: complaint.title });
        setResolveDescription('');
    };

    // Close resolve modal
    const closeResolveModal = () => {
        setResolveModal(null);
        setResolveDescription('');
        setResolving(false);
    };

    // Handle resolve with description
    const handleResolveSubmit = async () => {
        if (!resolveDescription.trim()) {
            alert("Please write a resolution description before resolving.");
            return;
        }

        setResolving(true);
        try {
            await updateDoc(doc(db, 'complaints', resolveModal.id), {
                status: 'resolved',
                resolvedBy: userData.name,
                resolvedByRole: userData.role,
                resolveDescription: resolveDescription.trim(),
                resolvedAt: serverTimestamp()
            });
            closeResolveModal();
        } catch (err) {
            console.error(err);
            alert("Error resolving complaint.");
            setResolving(false);
        }
    };

    // Styles
    const styles = {
        container: { padding: '24px', maxWidth: '1000px', margin: '0 auto' },
        card: { background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px', marginBottom: '16px' },
        input: { width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginTop: '8px', boxSizing: 'border-box', fontSize: '16px' },
        badge: (status) => ({
            padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
            backgroundColor: status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: status === 'pending' ? '#f59e0b' : '#10b981',
            border: `1px solid ${status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`
        })
    };

    // Modal overlay styles
    const modalStyles = {
        overlay: {
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            animation: 'fadeIn 0.3s ease'
        },
        modal: {
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '24px',
            padding: '36px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(16, 185, 129, 0.1)',
            animation: 'slideUp 0.3s ease'
        },
        modalHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '8px'
        },
        modalIcon: {
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.2)'
        },
        modalTitle: {
            fontSize: '22px',
            fontWeight: 'bold',
            color: 'white',
            margin: 0
        },
        modalSubtitle: {
            fontSize: '14px',
            color: '#94a3b8',
            margin: '4px 0 0 0'
        },
        complaintRef: {
            margin: '20px 0',
            padding: '14px 18px',
            background: 'rgba(99, 102, 241, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            fontSize: '14px',
            color: '#c7d2fe',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        textareaLabel: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#cbd5e1',
            marginBottom: '8px',
            display: 'block'
        },
        textarea: {
            width: '100%',
            padding: '14px 18px',
            borderRadius: '14px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: '15px',
            lineHeight: '1.6',
            height: '140px',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            fontFamily: 'inherit',
            boxSizing: 'border-box'
        },
        hint: {
            fontSize: '12px',
            color: '#64748b',
            marginTop: '8px'
        },
        buttonRow: {
            display: 'flex',
            gap: '12px',
            marginTop: '28px',
            justifyContent: 'flex-end'
        },
        cancelBtn: {
            padding: '12px 24px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
        },
        resolveBtn: {
            padding: '12px 28px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s ease'
        }
    };

    return (
        <div className="complaints-container" style={styles.container}>
            {/* Animations + Mobile Responsive */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .resolve-textarea:focus {
                    border-color: rgba(16, 185, 129, 0.5) !important;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
                }
                .cancel-btn-hover:hover {
                    background: rgba(255,255,255,0.1) !important;
                    color: white !important;
                }
                .resolve-btn-hover:hover {
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45) !important;
                    transform: translateY(-1px);
                }
                .resolve-btn-hover:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none !important;
                }

                /* ========= MOBILE RESPONSIVE ========= */
                @media (max-width: 768px) {
                    .complaints-container {
                        padding: 14px !important;
                    }
                    .complaints-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 12px !important;
                    }
                    .complaints-header h1 {
                        font-size: 24px !important;
                    }
                    .complaints-header p {
                        font-size: 13px !important;
                    }
                    .complaints-header .btn-primary {
                        width: 100% !important;
                        justify-content: center !important;
                    }
                    .complaint-card {
                        padding: 16px !important;
                        border-radius: 16px !important;
                    }
                    .complaint-card-inner {
                        flex-direction: column !important;
                        gap: 14px !important;
                    }
                    .complaint-card-inner h3 {
                        font-size: 16px !important;
                    }
                    .complaint-card-inner p {
                        font-size: 14px !important;
                    }
                    .complaint-meta {
                        flex-wrap: wrap !important;
                        gap: 10px !important;
                    }
                    .complaint-actions {
                        flex-direction: row !important;
                        width: 100% !important;
                    }
                    .complaint-actions a,
                    .complaint-actions button {
                        flex: 1 !important;
                        justify-content: center !important;
                        text-align: center !important;
                    }
                    .resolve-info {
                        flex-direction: column !important;
                        gap: 8px !important;
                    }
                    .resolve-desc-box {
                        padding: 12px 14px !important;
                        border-radius: 12px !important;
                    }
                    .grievance-form {
                        padding: 20px !important;
                        border-radius: 16px !important;
                    }
                    .resolve-modal-box {
                        padding: 22px !important;
                        border-radius: 18px !important;
                        margin: 10px !important;
                        max-height: 90vh !important;
                        overflow-y: auto !important;
                    }
                    .resolve-modal-header {
                        gap: 10px !important;
                    }
                    .resolve-modal-header h2 {
                        font-size: 18px !important;
                    }
                    .resolve-modal-header p {
                        font-size: 12px !important;
                    }
                    .resolve-modal-icon {
                        width: 40px !important;
                        height: 40px !important;
                        min-width: 40px !important;
                        border-radius: 10px !important;
                    }
                    .resolve-modal-btnrow {
                        flex-direction: column-reverse !important;
                        margin-top: 20px !important;
                    }
                    .resolve-modal-btnrow button {
                        width: 100% !important;
                        justify-content: center !important;
                    }
                    .resolve-modal-textarea {
                        font-size: 16px !important;
                        height: 120px !important;
                    }
                    .resolve-modal-overlay {
                        padding: 10px !important;
                        align-items: flex-end !important;
                    }
                }

                @media (max-width: 400px) {
                    .complaints-container {
                        padding: 10px !important;
                    }
                    .complaint-card {
                        padding: 14px !important;
                    }
                    .complaint-actions {
                        flex-direction: column !important;
                    }
                    .resolve-modal-box {
                        padding: 18px !important;
                    }
                }
            `}</style>

            <header className="complaints-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', margin: 0 }}>Grievance Portal</h1>
                    <p style={{ color: '#94a3b8' }}>We are here to listen and resolve your concerns.</p>
                </div>
                {!isStaff && !loading && (
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}>
                        {showForm ? <X size={20} /> : <Plus size={20} />}
                        {showForm ? 'Cancel' : 'Register Complaint'}
                    </button>
                )}
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={40} color="#6366f1" /></div>
            ) : (
                <>
                {showForm && !isStaff && (
                    <div className="glass-card grievance-form" style={{ ...styles.card, background: 'rgba(30, 41, 59, 0.7)', padding: '32px' }}>
                        <h2 style={{ color: 'white', marginBottom: '24px', fontSize: '20px' }}>New Grievance Form</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '14px', color: '#cbd5e1' }}>Subject / Issue</label>
                                <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Briefly describe the issue" />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '14px', color: '#cbd5e1' }}>Contact Phone Number</label>
                                <input style={styles.input} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="To contact you for resolution" />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '14px', color: '#cbd5e1' }}>Full Details</label>
                                <textarea style={{ ...styles.input, height: '120px', resize: 'none' }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe your concern in detail..." />
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={processing}>
                                {processing ? <Loader2 className="animate-spin" /> : 'Submit Grievance'}
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {complaints.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', opacity: 0.3 }}>
                            <MessageSquare size={60} style={{ margin: '0 auto 16px' }} />
                            <p>No complaints recorded yet.</p>
                        </div>
                    ) : (
                        complaints.map(item => (
                            <div key={item.id} className="glass-card complaint-card" style={{ ...styles.card, borderLeft: item.status === 'resolved' ? '4px solid #10b981' : '4px solid #f59e0b' }}>
                                <div className="complaint-card-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                            <span style={styles.badge(item.status)}>{item.status}</span>
                                            <span style={{ fontSize: '12px', color: '#444' }}>Ref: #{item.id.slice(0, 6)}</span>
                                        </div>
                                        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>{item.title}</h3>
                                        <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '15px' }}>{item.description}</p>
                                        
                                        <div className="complaint-meta" style={{ display: 'flex', gap: '20px', marginTop: '16px', fontSize: '13px', color: '#64748b' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> {item.parentName}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {item.createdAt?.toDate().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="complaint-actions" style={{ display: 'flex', gap: '12px' }}>
                                        {isStaff && (
                                            <a 
                                                href={`tel:${item.phoneNumber}`} 
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
                                                    background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', borderRadius: '10px', 
                                                    textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', border: '1px solid #6366f140'
                                                }}
                                            >
                                                <PhoneCall size={16} /> Call Parent
                                            </a>
                                        )}
                                        {isStaff && item.status === 'pending' && (
                                            <button 
                                                onClick={() => openResolveModal(item)}
                                                className="btn-primary" 
                                                style={{ padding: '8px 16px', background: '#10b981', boxShadow: 'none' }}
                                            >
                                                <CheckCircle size={16} /> Resolve
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Resolution Details - Visible to everyone (especially parents) */}
                                {item.status === 'resolved' && (
                                    <div style={{ 
                                        marginTop: '16px', 
                                        paddingTop: '16px', 
                                        borderTop: '1px solid rgba(255,255,255,0.05)' 
                                    }}>
                                        {/* Resolution Description Box */}
                                        {item.resolveDescription && (
                                            <div className="resolve-desc-box" style={{
                                                background: 'rgba(16, 185, 129, 0.06)',
                                                border: '1px solid rgba(16, 185, 129, 0.15)',
                                                borderRadius: '14px',
                                                padding: '16px 18px',
                                                marginBottom: '12px'
                                            }}>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px', 
                                                    marginBottom: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: '700',
                                                    color: '#10b981',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    <FileText size={14} />
                                                    Resolution Details
                                                </div>
                                                <p style={{ 
                                                    color: '#d1d5db', 
                                                    fontSize: '14px', 
                                                    lineHeight: '1.6',
                                                    margin: 0 
                                                }}>
                                                    {item.resolveDescription}
                                                </p>
                                            </div>
                                        )}

                                        {/* Resolver Info */}
                                        <div className="resolve-info" style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '16px',
                                            fontSize: '13px', 
                                            color: '#10b981',
                                            flexWrap: 'wrap'
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Shield size={14} />
                                                Resolved by <strong style={{ marginLeft: '2px' }}>{item.resolvedBy}</strong>
                                                {item.resolvedByRole && (
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                                        fontSize: '11px',
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {item.resolvedByRole}
                                                    </span>
                                                )}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={14} />
                                                {item.resolvedAt?.toDate().toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
                </>
            )}

            {/* ====== RESOLVE MODAL ====== */}
            {resolveModal && (
                <div className="resolve-modal-overlay" style={modalStyles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeResolveModal(); }}>
                    <div className="resolve-modal-box" style={modalStyles.modal}>
                        {/* Header */}
                        <div className="resolve-modal-header" style={modalStyles.modalHeader}>
                            <div className="resolve-modal-icon" style={modalStyles.modalIcon}>
                                <CheckCircle size={24} color="#10b981" />
                            </div>
                            <div>
                                <h2 style={modalStyles.modalTitle}>Resolve Complaint</h2>
                                <p style={modalStyles.modalSubtitle}>Provide a resolution summary before closing</p>
                            </div>
                            <button 
                                onClick={closeResolveModal}
                                style={{ 
                                    marginLeft: 'auto', background: 'none', border: 'none', 
                                    color: '#64748b', cursor: 'pointer', padding: '8px',
                                    borderRadius: '8px', display: 'flex'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Complaint Reference */}
                        <div style={modalStyles.complaintRef}>
                            <AlertCircle size={16} color="#818cf8" />
                            <span><strong>Complaint:</strong> {resolveModal.title}</span>
                        </div>

                        {/* Description Input */}
                        <div>
                            <label style={modalStyles.textareaLabel}>
                                Resolution Description <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <textarea
                                className="resolve-textarea resolve-modal-textarea"
                                style={modalStyles.textarea}
                                value={resolveDescription}
                                onChange={(e) => setResolveDescription(e.target.value)}
                                placeholder="Explain what actions were taken to resolve this complaint... (e.g., 'Spoke with concerned teacher, the issue has been addressed and corrective measures have been implemented.')"
                            />
                            <p style={modalStyles.hint}>
                                This description will be visible to the parent who filed the complaint.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="resolve-modal-btnrow" style={modalStyles.buttonRow}>
                            <button 
                                className="cancel-btn-hover"
                                style={modalStyles.cancelBtn}
                                onClick={closeResolveModal}
                                disabled={resolving}
                            >
                                Cancel
                            </button>
                            <button
                                className="resolve-btn-hover"
                                style={modalStyles.resolveBtn}
                                onClick={handleResolveSubmit}
                                disabled={resolving || !resolveDescription.trim()}
                            >
                                {resolving ? (
                                    <><Loader2 size={16} className="animate-spin" /> Resolving...</>
                                ) : (
                                    <><CheckCircle size={16} /> Mark as Resolved</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Complaints;
