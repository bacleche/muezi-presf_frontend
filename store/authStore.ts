import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserType {
  id: number
  email: string
  nom: string
  prenom: string
  role: 'caissier' | 'conformite' | 'superadmin'
  is_active: boolean
}

interface AuthState {
  user:            UserType | null
  accessToken:     string | null
  refreshToken:    string | null
  pendingEmail:    string | null 
  setAuth:         (user: UserType, accessToken: string, refreshToken: string) => void
  setPendingEmail: (email: string) => void
  logout:          () => void
  isAuthenticated: () => boolean
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      pendingEmail: null,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token',  accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        set({ user, accessToken, refreshToken })
      },

      setPendingEmail: (email) => set({ pendingEmail: email }),
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null })
      },

      isAuthenticated: () => !!get().user,  // ← get() au lieu de useAuthStore.getState()
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

export default useAuthStore
export type { UserType, AuthState }