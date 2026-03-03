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

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const redirectHandled = useRef(false)
  const authReady = useRef(false)
  const graceTimerRef = useRef(null)

  useEffect(() => {
    let unsub
    if (redirectHandled.current) {
      unsub = onAuthStateChanged(auth, onAuthChange)
      return () => unsub()
    }
    redirectHandled.current = true

    // Persistencia primero, luego redirect y listener (así en PWA la sesión se restaura bien).
    setPersistence(auth, browserLocalPersistence)
      .catch(() => {})
      .then(() => getRedirectResult(auth))
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        unsub = onAuthStateChanged(auth, onAuthChange)
      })

    return () => {
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current)
      unsub?.()
    }
  }, [])

  function onAuthChange(firebaseUser) {
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current)
      graceTimerRef.current = null
    }
    setUser(firebaseUser)
    if (!firebaseUser) {
      setProfile(null)
      if (isStandalone() && !authReady.current) {
        graceTimerRef.current = setTimeout(() => {
          graceTimerRef.current = null
          authReady.current = true
          setLoading(false)
        }, 1500)
        return
      }
      setLoading(false)
      return
    }
    authReady.current = true
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

  /** Sincroniza el estado del contexto con auth.currentUser (útil tras login en PWA para no depender del timing de onAuthStateChanged). */
  const syncAuthState = async () => {
    const current = auth.currentUser
    setUser(current)
    if (!current) {
      setProfile(null)
      setLoading(false)
      return
    }
    try {
      const snap = await getDoc(doc(db, 'users', current.uid))
      setProfile(snap.exists() ? snap.data() : null)
    } catch {
      setProfile(null)
    }
    setLoading(false)
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
    syncAuthState,
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
