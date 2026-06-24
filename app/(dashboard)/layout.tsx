// 'use client'

// import { useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { Box } from '@mui/material'
// import Sidebar from '@/components/layout/Sidebar'
// import Header from '@/components/layout/Header'
// import useAuthStore from '@/store/authStore'
// import useInactivity from '@/components/hooks/useInactivity'

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const router = useRouter()

//   const accessToken = useAuthStore((s) => s.accessToken)
//   const hydrated = useAuthStore((s) => s.hydrated)
//   useInactivity() // Hook pour la déconnexion automatique

// useEffect(() => {
//   if (!hydrated) return

//   if (!accessToken) {
//     router.replace('/login')
//   }
// }, [hydrated, accessToken])

// if (!hydrated) {
//   return <div>Loading...</div> // PAS null
// }

// if (!accessToken) {
//   return null
// }
//   return (
//     <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
//       <Sidebar />

//       <Box sx={{
//         flexGrow: 1,
//         display: 'flex',
//         flexDirection: 'column',
//         minWidth: 0,
//       }}>
//         <Header />
//         <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
//           {children}
//         </Box>
//       </Box>
//     </Box>
//   )
// }

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box } from '@mui/material'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import useAuthStore from '@/store/authStore'
import useInactivity from '@/components/hooks/useInactivity'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const accessToken = useAuthStore((s) => s.accessToken)
  const hydrated = useAuthStore((s) => s.hydrated)
  useInactivity() // Hook pour la déconnexion automatique

  useEffect(() => {
    if (!hydrated) return

    if (!accessToken) {
      router.replace('/login')
    }
  }, [hydrated, accessToken])

  if (!hydrated) {
    return <div>Loading...</div> // PAS null
  }

  if (!accessToken) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />

      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        // Réserve l'espace de l'AppBar mobile (fixed) pour que le contenu
        // ne passe pas dessous. 56px = hauteur Toolbar par défaut en mobile,
        // 64px en desktop — mais l'AppBar est masquée à partir de md donc
        // seul le mt mobile compte ici.
        mt: { xs: '56px', sm: '64px', md: 0 },
      }}>
        <Header />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            // Marge confortable sur mobile, qui s'agrandit progressivement
            p: { xs: 2, sm: 2.5, md: 3 },
            // Évite que le contenu touche les bords sur très petits écrans
            width: '100%',
            maxWidth: '100vw',
            overflowX: 'hidden',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}