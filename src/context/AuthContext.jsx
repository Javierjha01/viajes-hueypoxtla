import { createContext, useContext, useEffect, useState, useRef } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

const AuthContext = createContext(null)

const ROLES = { admin: 'admin', client: 'client', driver: 'driver' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const redirectHandled = useRef(false)

  // En PWA (añadido al inicio del móvil) el almacenamiento puede ser distinto: forzar persistencia local
  // para que el login con correo (y Google) se guarde y no se pierda al cerrar la app.
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {})
  }, [])

  useEffect(() => {
    let unsub
    // Solo procesar redirect una vez (evita que Strict Mode consuma el resultado dos veces).
    if (redirectHandled.current) {
      unsub = onAuthStateChanged(auth, onAuthChange)
      return () => unsub()
    }
    redirectHandled.current = true
    getRedirectResult(auth)
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        unsub = onAuthStateChanged(auth, onAuthChange)
      })
    return () => unsub?.()
  }, [])

  function onAuthChange(firebaseUser) {
    setUser(firebaseUser)
    if (!firebaseUser) {
      setProfile(null)
      setLoading(false)
      return
    }
    getDoc(doc(db, 'users', firebaseUser.uid))
      .then((snap) => setProfile(snap.exists() ? snap.data() : null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }

  const fetchProfile = async (uid) => {
    const profileSnap = await getDoc(doc(db, 'users', uid))
    return profileSnap.exists() ? profileSnap.data() : null
  }

  const refreshProfile = async (uid) => {
    const id = uid ?? user?.uid
    if (!id) return
    const data = await fetchProfile(id)
    setProfile(data)
  }

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  // En iPhone/Safari el popup falla; usar redirect. Persistencia local para que al volver no se pierda la sesión.
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const loginWithGoogle = async () => {
    if (isMobile) {
      await setPersistence(auth, browserLocalPersistence)
      return signInWithRedirect(auth, new GoogleAuthProvider())
    }
    return signInWithPopup(auth, new GoogleAuthProvider())
  }

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
