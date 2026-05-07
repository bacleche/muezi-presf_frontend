'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box } from '@mui/material'
import Sidebar from '@/components/layout/Sidebar'
import Header  from '@/components/layout/Header'
import useAuthStore from '@/store/authStore'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user   = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user])

  if (!user) return null

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* Sidebar — 260px sur desktop, drawer temporaire sur mobile */}
      <Sidebar />

      {/* Zone principale — décalée uniquement sur desktop */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0, // évite le débordement horizontal
        ml: { xs: 0, md: 0 }, // le drawer permanent occupe déjà l'espace
        pt: { xs: '64px', md: 0 }, // compense l'AppBar burger sur mobile
      }}>
        <Header />
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>

    </Box>
  )
}