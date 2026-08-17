'use client'
import {
  AppBar, Toolbar, IconButton, Tooltip, Box, Chip,
  Typography, Menu, MenuItem, Avatar, Divider,
  Badge, List, ListItem, ListItemText
} from '@mui/material'
import {
  LogoutOutlined,
  NotificationsOutlined,
  AccountCircleOutlined
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useAuthStore from '@/store/authStore'
import useNotifications, { type Notification } from '@/components/hooks/useNotifications'


// Ajoutez l'import

// Dans le composant, récupérez le user (déjà présent) et ajoutez la fonction de navigation

export default function Header() {
  const router   = useRouter()
  const logout   = useAuthStore((s) => s.logout)
  const user     = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)

  // const { notifications } = hydrated ? useNotifications() : { notifications: [] }
  const { notifications, markRead } = useNotifications()
  const unread = notifications.filter((n) => !n.is_read).length


const handleNotifClick = (n: Notification) => {
  if (!n.is_read) markRead(n.id)

  if (n.enregistrement) {
    if (user?.role === 'conformite') {
      router.push(`/conformite/${n.enregistrement}`)
    } else if (user?.role === 'chef_agence') {
      router.push(`/chef_agence/enregistrements/${n.enregistrement}`)
    } else if (user?.role === 'superadmin') {
      router.push(`/admin/enregistrements/${n.enregistrement}`)
    }
  }

  handleNotifClose()
}
  // ── Menu profil ──────────────────────────────────────
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)
  const openProfile = Boolean(profileAnchor)
  const handleProfileOpen  = (e: React.MouseEvent<HTMLElement>) => setProfileAnchor(e.currentTarget)
  const handleProfileClose = () => setProfileAnchor(null)

  // ── Menu notifications ────────────────────────────────
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null)
  const openNotif = Boolean(notifAnchor)
  const handleNotifOpen  = (e: React.MouseEvent<HTMLElement>) => setNotifAnchor(e.currentTarget)
  const handleNotifClose = () => setNotifAnchor(null)


  //--------------------------------------------

  const ROLE_LABELS: Record<string, string> = {
  conformite: 'Conformité',
  superadmin: 'Super Admin',
  chef_agence: 'Chef d\'Agence'
}


  if (!hydrated) return null

  const handleLogout = () => {
    handleProfileClose()
    logout()
    router.push('/login')
  }

  const goToProfile = () => {
    handleProfileClose()
    router.push('/profil')
  }

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'white',
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>

        {/* Welcome */}
        <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
          Bienvenue, {user?.prenom} {user?.nom}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

          {/* ── Cloche → menu notifications ── */}
          {/* <Tooltip title="Notifications">
            <IconButton onClick={handleNotifOpen}>
              <Badge badgeContent={unread} color="error" invisible={unread === 0}>
                <NotificationsOutlined />
              </Badge>
            </IconButton>
          </Tooltip> */}

          <Menu
            anchorEl={notifAnchor}
            open={openNotif}
            onClose={handleNotifClose}
            slotProps={{ paper: { sx: { minWidth: 320, maxHeight: 400 } } }}
          >
           <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Notifications {unread > 0 && `(${unread} non lues)`}
            </Typography>
            {unread > 0 && (
              <Typography
                variant="caption"
                onClick={async () => {
                  await Promise.all(notifications.filter(n => !n.is_read).map(n => markRead(n.id)))
                }}
                sx={{ color: '#0D47A1', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                Tout lire
              </Typography>
            )}
          </Box>
            <Divider />
            {notifications.length === 0 ? (
              <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Aucune notification
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding>
                {notifications.slice(0, 8).map((n, i) => (
                  <ListItem
                      key={n.id}                                        // ← utilise n.id, pas i
                      onClick={() => handleNotifClick(n)}      // ← marquer lu au clic
                      sx={{
                        cursor: 'pointer',                              // ← ajout
                        bgcolor: n.is_read ? 'transparent' : '#f0f9ff',
                        borderLeft: n.is_read ? 'none' : '3px solid #0D47A1',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                    <ListItemText
                      primary={n.title}
                      secondary={n.message}
                      slotProps={{
                        primary: { style: { fontSize: 13, fontWeight: n.is_read ? 400 : 600 } },
                        secondary: { style: { fontSize: 12 } },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Menu>

          {/* ── Avatar → menu profil ── */}
          <Tooltip title="Profil">
            <IconButton onClick={handleProfileOpen}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1e293b', fontSize: 14 }}>
                {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>

          {/* <Menu
            anchorEl={profileAnchor}
            open={openProfile}
            onClose={handleProfileClose}
            slotProps={{ paper: { sx: { minWidth: 220 } } }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.prenom} {user?.nom}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={goToProfile}>
              <AccountCircleOutlined fontSize="small" sx={{ mr: 1 }} />
              Profil
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <LogoutOutlined fontSize="small" sx={{ mr: 1 }} />
              Déconnexion
            </MenuItem>
          </Menu> */}


          <Menu
            anchorEl={profileAnchor}
            open={openProfile}
            onClose={handleProfileClose}
            slotProps={{ paper: { sx: { minWidth: 220 } } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.prenom} {user?.nom}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {user?.email}
              </Typography>
              <Chip
                  label={ROLE_LABELS[user?.role ?? ''] ?? user?.role}
                  size="small"
                  sx={{ mt: 0.5, height: 20, fontSize: 11 }}
                />
            </Box>
            <Divider />
            <MenuItem onClick={goToProfile}>
              <AccountCircleOutlined fontSize="small" sx={{ mr: 1 }} />
              Mon profil
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <LogoutOutlined fontSize="small" sx={{ mr: 1 }} />
              Déconnexion
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}