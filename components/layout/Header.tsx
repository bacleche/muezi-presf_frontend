'use client'
import { AppBar, Toolbar, IconButton, Tooltip, Box, Typography } from '@mui/material'
import { LogoutOutlined, NotificationsOutlined } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'

export default function Header() {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const user   = useAuthStore((s) => s.user)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <AppBar
      position="static" color="inherit" elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'white',
        display: { xs: 'none', md: 'block' }, // ← caché sur mobile
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
          Bienvenue, {user?.prenom} {user?.nom}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Notifications">
            <IconButton><NotificationsOutlined /></IconButton>
          </Tooltip>
          <Tooltip title="Se déconnecter">
            <IconButton color="error" onClick={handleLogout}>
              <LogoutOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  )
}