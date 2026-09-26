import { createContext } from 'react'

/** Admin session state; provided by AuthProvider, read with useAuth(). */
export const AuthContext = createContext(null)
