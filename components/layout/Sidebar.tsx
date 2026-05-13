'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Box, Typography, Divider, Avatar,
  IconButton, AppBar, Toolbar, useMediaQuery, useTheme
} from '@mui/material'
import {
  DashboardOutlined, AddCircleOutlined, ListAlt,
  VerifiedUserOutlined, BarChartOutlined,
  PeopleOutlined, HistoryOutlined, MenuOutlined,
  CloseOutlined, DashboardCustomizeOutlined,
  NotificationsOutlined, ShieldOutlined,  FolderOutlined ,LogoutOutlined , PendingActionsOutlined , BusinessOutlined
} from '@mui/icons-material'
import useAuthStore from '@/store/authStore'

const DRAWER_WIDTH = 260

interface MenuItem {
  label: string
  icon:  React.ReactNode
  href:  string
}

interface MenuParRole {
  caissier:   MenuItem[]
  conformite: MenuItem[]
  superadmin: MenuItem[]
}

const menuParRole: MenuParRole = {
  caissier: [
    { label: 'Tableau de bord',       icon: <DashboardCustomizeOutlined />, href: '/caissier' },
    { label: 'Nouvel enregistrement', icon: <AddCircleOutlined />,          href: '/caissier/nouveau' },
    { label: 'Mes enregistrements',   icon: <ListAlt />,                    href: '/caissier/enregistrements' },
  ],
  conformite: [
  { label: 'Tableau de bord',    icon: <DashboardOutlined />,       href: '/conformite' },
  { label: 'File de validation', icon: <PendingActionsOutlined />,  href: '/conformite/validation' },
  // { label: 'Enregistrements',    icon: <VerifiedUserOutlined />,    href: '/conformite/enregistrements' },
  { label: 'Archives',           icon: <FolderOutlined />,          href: '/conformite/archives' },  // ← nouveau
  { label: 'Statistiques',       icon: <BarChartOutlined />,        href: '/conformite/stats' },
],
  superadmin: [
  { label: 'Tableau de bord', icon: <DashboardOutlined />,    href: '/admin' },
  { label: 'Utilisateurs',   icon: <PeopleOutlined />,        href: '/admin/utilisateurs' },
  { label: 'Agences',        icon: <BusinessOutlined />,      href: '/admin/agences' },
  { label: 'Statistiques',   icon: <BarChartOutlined />,      href: '/admin/stats' },
  { label: 'Journal d\'audit', icon: <HistoryOutlined />,     href: '/admin/logs' },
],
}

function DrawerContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router   = useRouter()
  const user     = useAuthStore((s) => s.user)
  const menu     = user?.role ? menuParRole[user.role as keyof MenuParRole] ?? [] : []

  const navigate = (href: string) => {
    router.push(href)
    onClose?.()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldOutlined sx={{ color: '#3b82f6', fontSize: 22 }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              PRESF <span style={{ color: '#3b82f6' }}>ARCHIVIS</span>
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', ml: 0.5 }}>
            Archivage financier
          </Typography>
        </Box>
        {onClose && (
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseOutlined />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />

      {/* Profil */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
          {user?.prenom?.[0]}{user?.nom?.[0]}
        </Avatar>
        <Box>
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
            {user?.prenom} {user?.nom}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            {user?.role}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mb: 1 }} />

      {/* Menu */}
      <List sx={{ flexGrow: 1 }}>
        {menu.map((item) => {
          const actif = pathname === item.href
          return (
            <ListItem key={item.href} disablePadding sx={{ px: 1, mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.href)}
                sx={{
                  borderRadius: 2,
                  bgcolor: actif ? 'rgba(255,255,255,0.2)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <ListItemIcon sx={{ color: actif ? 'white' : 'rgba(255,255,255,0.6)', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{
                      fontSize: 14,
                      fontWeight: actif ? 700 : 400,
                      color: actif ? 'white' : 'rgba(255,255,255,0.7)',
                    }}>
                      {item.label}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )
}

export default function Sidebar() {
  const theme    = useTheme()
  const router   = useRouter()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(false)
  const logout   = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const drawerStyles = {
    width: DRAWER_WIDTH,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: DRAWER_WIDTH,
      background: 'linear-gradient(180deg, #1e293b 0%, #0D47A1 100%)',
      color: 'white',
      border: 'none',
      boxSizing: 'border-box' as const,
    },
  }

  return (
    <>
      {/* ── MOBILE : AppBar burger ── */}
      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'flex', md: 'none' },
          background: 'linear-gradient(90deg, #1e293b, #0D47A1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton edge="start" color="inherit" onClick={() => setOpen(true)}>
            <MenuOutlined />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldOutlined sx={{ color: '#3b82f6', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              PRESF <span style={{ color: '#3b82f6' }}>ARCHIVIS</span>
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutOutlined />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* ── MOBILE : Drawer temporaire ── */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, ...drawerStyles }}
      >
        <DrawerContent onClose={() => setOpen(false)} />
      </Drawer>

      {/* ── DESKTOP : Drawer permanent ── */}
      <Drawer
        variant="permanent"
        sx={{ display: { xs: 'none', md: 'block' }, ...drawerStyles }}
      >
        <DrawerContent />
      </Drawer>
    </>
  )
}