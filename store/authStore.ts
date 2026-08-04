// import { create } from 'zustand'
// import { persist } from 'zustand/middleware'

// interface UserType {
//   id: number
//   email: string
//   nom: string
//   prenom: string
//   role: 'caissier' | 'conformite' | 'superadmin'
//   is_active: boolean
// }

// interface AuthState {
//   user: UserType | null
//   accessToken: string | null
//   refreshToken: string | null
//   pendingEmail: string | null

//   hydrated: boolean
//   setHydrated: (v: boolean) => void

//   setAuth: (user: UserType, accessToken: string, refreshToken: string) => void
//   setPendingEmail: (email: string) => void
//   logout: () => void
//   isAuthenticated: () => boolean
// }

// // const useAuthStore = create<AuthState>()(
// //   persist(
// //   (set, get) => ({
// //     user: null,
// //     accessToken: null,
// //     refreshToken: null,
// //     pendingEmail: null,

// //     setAuth: (user, accessToken, refreshToken) => {
// //       localStorage.setItem('access_token', accessToken)
// //       localStorage.setItem('refresh_token', refreshToken)

// //       set({ user, accessToken, refreshToken })
// //     },

// //     setPendingEmail: (email) => set({ pendingEmail: email }),

// //     logout: () => {
// //       localStorage.removeItem('access_token')
// //       localStorage.removeItem('refresh_token')
// //       set({ user: null, accessToken: null, refreshToken: null })
// //     },

// //     isAuthenticated: () => !!get().accessToken,
// //   }),
// //   {
// //     name: 'auth-storage',
// //     partialize: (state) => ({
// //       user: state.user,
// //       accessToken: state.accessToken,
// //       refreshToken: state.refreshToken,
// //     }),
// //   }
// // )
// // )

// // const useAuthStore = create<AuthState>()(
// //   persist(
// //     (set, get) => ({
// //       user: null,
// //       accessToken: null,
// //       refreshToken: null,
// //       pendingEmail: null,

// //       hydrated: false,
// //       setHydrated: (v) => set({ hydrated: v }),

// //       setAuth: (user, accessToken, refreshToken) => {
// //         localStorage.setItem('access_token', accessToken)
// //         localStorage.setItem('refresh_token', refreshToken)

// //         set({ user, accessToken, refreshToken })
// //       },

// //       setPendingEmail: (email) => set({ pendingEmail: email }),

// //       logout: () => {
// //         localStorage.removeItem('access_token')
// //         localStorage.removeItem('refresh_token')
// //         set({ user: null, accessToken: null, refreshToken: null })
// //       },

// //       isAuthenticated: () => !!get().accessToken,
// //     }),
// //     {
// //       name: 'auth-storage',
// //       partialize: (state) => ({
// //         user: state.user,
// //         accessToken: state.accessToken,
// //         refreshToken: state.refreshToken,
// //       }),
// //     }
// //   )
// // )

// const useAuthStore = create<AuthState>()(
//   persist(
//     (set, get) => ({
//       user: null,
//       accessToken: null,
//       refreshToken: null,

//       hydrated: false,

//       setHydrated: (v: boolean) => set({ hydrated: v }),
//     }),
//     {
//       name: 'auth-storage',

//       onRehydrateStorage: () => (state) => {
//         state?.setHydrated(true)
//       },
//     }
//   )
// )
// export default useAuthStore

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// interface UserType {
//   id: number
//   email: string
//   nom: string
//   prenom: string
//   role: 'caissier' | 'conformite' | 'superadmin'
//   is_active: boolean
// }

interface UserType {
  id: number
  email: string
  nom: string
  prenom: string
  role: 'superadmin' | 'conformite' | 'chef_produit' | 'chef_agence'
  pays: number | null
  ville: number | null    // NOUVEAU — nécessaire pour distinguer conformité principale/subalterne côté front
  agence: number | null
  is_active: boolean
}


interface AuthState {
  user: UserType | null
  accessToken: string | null
  refreshToken: string | null
  pendingEmail: string | null

  hydrated: boolean

  setAuth: (user: UserType, accessToken: string, refreshToken: string) => void
  setPendingEmail: (email: string) => void
  logout: () => void
  isAuthenticated: () => boolean
  setHydrated: (v: boolean) => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      pendingEmail: null,

      hydrated: false,

      setHydrated: (v: boolean) => set({ hydrated: v }),

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)

        set({ user, accessToken, refreshToken })
      },

      setPendingEmail: (email) => set({ pendingEmail: email }),

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null })
      },

      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'auth-storage',

      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        pendingEmail: state.pendingEmail,
      }),

      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)

export default useAuthStore
export type { UserType, AuthState }