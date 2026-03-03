import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

const AuthContext = createContext(null)

const ROLES = { admin: 'admin', client: 'client', driver: 'driver' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null) // { role, email, ... }
  const [loading, setLoading] = useState(true)

  // Completar login cuando el usuario vuelve de Google (redirect, p. ej. en iPhone)
  useEffect(() => {
    getRedirectResult(auth)
      .then(() => {})
      .catch(() => {})
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setProfile(null)
        setLoading(false)
        return
      }
      try {
        const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
        setProfile(profileSnap.exists() ? profileSnap.data() : null)
      } catch (e) {
        setProfile(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const fetchProfile = async (uid) => {
    const profileSnap = await getDoc(doc(db, 'users', uid))
    return profileSnap.exists() ? profileSnap.data() : null
  }

  const refreshProfile = async () => {
    if (!user) return
    const data = await fetchProfile(user.uid)
    setProfile(data)
  }

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  // En iPhone/Safari el popup falla; usar redirect
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const loginWithGoogle = () =>
    isMobile
      ? signInWithRedirect(auth, new GoogleAuthProvider())
      : signInWithPopup(auth, new GoogleAuthProvider())

  const register = (email, password, role) =>
    createUserWithEmailAndPassword(auth, email, password)

  const signOut = () => firebaseSignOut(auth)

  const displayName =
    (profile?.nombre && [profile.nombre, profile.apellidos].filter(Boolean).join(' ').trim()) ||
    user?.displayName ||
    user?.email ||
    'Usuario'

  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    displayName,
    login,
    loginWithGoogle,
    register,
    signOut,
    refreshProfile,
    ROLES,
    isAdmin: profile?.role === ROLES.admin,
    isClient: profile?.role === ROLES.client,
    isDriver: profile?.role === ROLES.driver,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
