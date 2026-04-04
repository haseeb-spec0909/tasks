import { createContext, useContext, useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth'

const AuthContext = createContext(null)

// Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA_U_nIjvPg5-12345',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'timeintel-tmcltd.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'timeintel-tmcltd',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'timeintel-tmcltd.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

// Force Google account selection
googleProvider.setCustomParameters({
  prompt: 'select_account',
})

/**
 * AuthProvider component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user is from @tmcltd.ai domain
        if (!firebaseUser.email?.endsWith('@tmcltd.ai')) {
          await firebaseSignOut(auth)
          setError('Only @tmcltd.ai email addresses are allowed')
          setUser(null)
          setLoading(false)
          return
        }

        const token = await firebaseUser.getIdToken()
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          token,
        })
        setError(null)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function signIn() {
    try {
      setError(null)
      const result = await signInWithPopup(auth, googleProvider)

      // Verify domain
      if (!result.user.email?.endsWith('@tmcltd.ai')) {
        await firebaseSignOut(auth)
        setError('Only @tmcltd.ai email addresses are allowed')
        return null
      }

      const token = await result.user.getIdToken()
      return {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        token,
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      setError(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth hook
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
