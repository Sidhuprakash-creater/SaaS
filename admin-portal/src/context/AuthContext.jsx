import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch additional user data from Firestore (role, name, schoolId)
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const uData = userDocSnap.data();
          let sData = null;
          
          if (uData.schoolId) {
            const schoolDocRef = doc(db, 'schools', uData.schoolId);
            const schoolDocSnap = await getDoc(schoolDocRef);
            if (schoolDocSnap.exists()) {
              sData = schoolDocSnap.data();
            }
          }
          
          setUserData({ 
            ...uData, 
            uid: user.uid, 
            schoolDetails: sData,
            // Default permissions based on role if not present
            permissions: uData.permissions || {
              canAddStudents: uData.role === 'principal' || (uData.role === 'teacher' && uData.canAddStudents),
              canAddTeachers: uData.role === 'principal' || uData.role === 'admin',
              canManageSchools: uData.role === 'admin'
            }
          });
        } else {
          setUserData({ role: 'student', uid: user.uid, permissions: { canAddStudents: false } });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
