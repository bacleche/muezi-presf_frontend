'use client'
import { useState } from 'react'
import Image from 'next/image';

import { usePathname, useRouter } from 'next/navigation'
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Box, Typography, Divider, Avatar,
  IconButton, AppBar, Toolbar, Collapse, useTheme
} from '@mui/material'
import {
  DashboardOutlined, BarChartOutlined, PeopleOutlined,
  HistoryOutlined, MenuOutlined, CloseOutlined,
  ShieldOutlined, FolderOutlined, LogoutOutlined,
  PublicOutlined, LocationCityOutlined,
  PendingActionsOutlined, BusinessOutlined,
  AccountBalanceOutlined, SwapHorizOutlined, CategoryOutlined,
  GroupOutlined, PersonAddOutlined, BadgeOutlined,
  ExpandLess, ExpandMore ,  LockClockOutlined,      // NOUVEAU — icône classeurs
  PublicOutlined as MapOutlined, // ou une icône dédiée type TravelExploreOutlined
  TravelExploreOutlined,  
} from '@mui/icons-material'
import useAuthStore from '@/store/authStore'
import type { UserType } from '@/store/authStore'

const DRAWER_WIDTH = 260

interface MenuItem {
  label:    string
  icon:     React.ReactNode
  href?:    string
  children?: MenuItem[]
  isLogout?: boolean
}

interface MenuParRole {
  conformite:   MenuItem[]
  superadmin:   MenuItem[]
  chef_produit: MenuItem[]
  chef_agence:  MenuItem[]
}

const menuParRole: MenuParRole = {
  conformite: [
    { label: 'Tableau de bord',       icon: <DashboardOutlined />,      href: '/conformite' },
    { label: 'Liste des clients', icon: <GroupOutlined />,    href: '/conformite/clients' },
    {
      label: 'Conformité KYC',
      icon: <BadgeOutlined />,
      children: [
        { label: 'Gestion des pièces', icon: <BadgeOutlined />,      href: '/conformite/recap' },
      ],
    },
    { label: 'Transactions Clients',  icon: <AccountBalanceOutlined />, href: '/conformite/transactions' },
    { label: 'Mouvements Agences',    icon: <SwapHorizOutlined />,      href: '/conformite/mouvements' },
    // { label: 'Archives & Exports',    icon: <FolderOutlined />,         href: '/conformite/archives' },
    { label: 'Statistiques globales', icon: <BarChartOutlined />,       href: '/conformite/stats' },
  ],
  superadmin: [
    { label: 'Tableau de bord',  icon: <DashboardOutlined />,    href: '/admin' },
    { label: 'Utilisateurs',     icon: <PeopleOutlined />,       href: '/admin/utilisateurs' },
    { label: 'Pays',             icon: <PublicOutlined />,       href: '/admin/pays' },
    { label: 'Villes',           icon: <LocationCityOutlined />, href: '/admin/villes' },
    { label: 'Agences',          icon: <BusinessOutlined />,     href: '/admin/agences' },
    { label: 'Produits',         icon: <CategoryOutlined />,     href: '/admin/produits' },
    { label: 'Statistiques',     icon: <BarChartOutlined />,     href: '/admin/stats' },
    { label: 'Liste des clients', icon: <GroupOutlined />,    href: '/admin/clients' },
    { label: "Journal d'audit",  icon: <HistoryOutlined />,      href: '/admin/logs' },
  ],
 chef_produit: [
    { label: 'Tableau de bord', icon: <DashboardOutlined />, href: '/chef-produit' },
    {
      label: 'Utilisateurs',
      icon: <PeopleOutlined />,
      children: [
        { label: 'Chefs d\'agence', icon: <BusinessOutlined />, href: '/chef-produit/users/chefs-agence' },
        { label: 'Agents Conformité', icon: <BadgeOutlined />, href: '/chef-produit/users/conformite' },
      ],
    },
    { label: 'Agences', icon: <LocationCityOutlined />, href: '/chef-produit/agences' },
    { label: 'Produits', icon: <CategoryOutlined />, href: '/chef-produit/produits' },
    { label: 'Clients', icon: <GroupOutlined />, href: '/chef-produit/clients' },

    {
      label: 'Statistiques Globales',
      icon: <BarChartOutlined />,
      href: '/chef-produit/stats',
    },
    { label: 'Déconnexion', icon: <LogoutOutlined />, isLogout: true },
  ],
  chef_agence: [
    { label: 'Tableau de bord', icon: <DashboardOutlined />, href: '/chef-agence' },
    {
      label: 'Clients',
      icon: <GroupOutlined />,
      children: [
        { label: 'Liste des clients', icon: <GroupOutlined />,    href: '/chef-agence/clients' },
        { label: 'Nouveau client',    icon: <PersonAddOutlined />, href: '/chef-agence/clients/nouveau' },
      ],
    },
    {
      label: 'Conformité KYC',
      icon: <BadgeOutlined />,
      children: [
        { label: 'Gestion des pièces', icon: <BadgeOutlined />,      href: '/chef-agence/recap' },
      ],
    },
    { label: 'Deconnexion', icon: <LogoutOutlined />, isLogout: true },
  ],
}


function getMenuConformite(user: UserType | null): MenuItem[] {
  const items: MenuItem[] = [
    { label: 'Tableau de bord',       icon: <DashboardOutlined />,      href: '/conformite' },
    { label: 'Liste des clients',     icon: <GroupOutlined />,          href: '/conformite/clients' },
    {
      label: 'Conformité KYC',
      icon: <BadgeOutlined />,
      children: [
        { label: 'Gestion des pièces', icon: <BadgeOutlined />, href: '/conformite/recap' },
      ],
    },
    { label: 'Transactions Clients',  icon: <AccountBalanceOutlined />, href: '/conformite/transactions' },
    { label: 'Mouvements Agences',    icon: <SwapHorizOutlined />,      href: '/conformite/mouvements' },
    // NOUVEAU : onglet Classeurs avec ses deux sous-sections
    {
      label: 'Classeurs',
      icon: <LockClockOutlined />,
      children: [
        { label: 'Classeurs Transactions', icon: <AccountBalanceOutlined />, href: '/conformite/classeurs/transactions' },
        { label: 'Classeurs Mouvements',   icon: <SwapHorizOutlined />,      href: '/conformite/classeurs/archives' },
      ],
    },
    { label: 'Statistiques globales', icon: <BarChartOutlined />, href: '/conformite/stats' },
  ]

  // NOUVEAU : Analyse Nationale — uniquement conformité principale (pas de ville rattachée)
  if (user?.role === 'conformite' && !user?.ville) {
    items.push({
      label: 'Analyse Inter-Nationale',
      icon: <TravelExploreOutlined />,
      href: '/conformite/analyse-internationale',
    })
  }

  return items
}


function DrawerContent({ onClose, onLogout }: { onClose?: () => void, onLogout: () => void }) {
  const pathname = usePathname()
  const router   = useRouter()
  const user     = useAuthStore((s) => s.user)
  // const menu     = user?.role ? menuParRole[user.role as keyof MenuParRole] ?? [] : []
  const menu: MenuItem[] =
    user?.role === 'conformite'
      ? getMenuConformite(user)
      : user?.role
        ? menuParRole[user.role as keyof MenuParRole] ?? []
        : []
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const navigate = (href: string) => {
    router.push(href)
    onClose?.()
  }

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  const renderItem = (item: MenuItem, depth = 0) => {
    // Cas spécial Déconnexion
    if (item.isLogout) {
      return (
        <ListItem key={item.label} disablePadding sx={{ px: 1, mb: 0.5 }}>
          <ListItemButton onClick={onLogout} sx={{ borderRadius: 2, pl: 1 + depth }}>
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.6)', minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={<Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{item.label}</Typography>} />
          </ListItemButton>
        </ListItem>
      )
    }

    if (item.children?.length) {
      const isOpen = openGroups.includes(item.label)
      return (
        <Box key={item.label}>
          <ListItem disablePadding sx={{ px: 1, mb: 0.5 }}>
            <ListItemButton
              onClick={() => toggleGroup(item.label)}
              sx={{ borderRadius: 2, pl: 1 + depth, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.6)', minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={<Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{item.label}</Typography>} />
              {isOpen ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }} /> : <ExpandMore sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }} />}
            </ListItemButton>
          </ListItem>
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List disablePadding>{item.children.map((child) => renderItem(child, depth + 1))}</List>
          </Collapse>
        </Box>
      )
    }

    const actif = pathname === item.href
    return (
      <ListItem key={item.label} disablePadding sx={{ px: 1, mb: 0.5 }}>
        <ListItemButton
          onClick={() => item.href && navigate(item.href)}
          sx={{
            borderRadius: 2,
            pl: 1 + depth,
            bgcolor: actif ? 'rgba(255,255,255,0.2)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <ListItemIcon sx={{ color: actif ? 'white' : 'rgba(255,255,255,0.6)', minWidth: 36 }}>{item.icon}</ListItemIcon>
          <ListItemText primary={<Typography sx={{ fontSize: 14, fontWeight: actif ? 700 : 400, color: actif ? 'white' : 'rgba(255,255,255,0.7)' }}>{item.label}</Typography>} />
        </ListItemButton>
      </ListItem>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldOutlined sx={{ color: '#3b82f6', fontSize: 10 }} />
            <Image 
                            src="/LOGOPRESF.png" 
                            alt="Logo PRESF" 
                            width={20}  // Taille agrandie
                            height={20} // Taille agrandie
                            style={{ 
                              borderRadius: '50%',      // Rend l'image parfaitement ronde
                              backgroundColor: '#FFFFFF', // Force un fond blanc au cas où
                              objectFit: 'cover',       // Ajuste l'image pour qu'elle remplisse bien le cercle
                              border: '2px solid #f1f5f9' // Optionnel : une légère bordure pour le look
                            }} 
                          />
                          <Typography variant="h4" sx={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.5px' }}>
                            ArchiviS
                          </Typography>
          </Box>
        </Box>
        {onClose && <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseOutlined /></IconButton>}
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>{user?.prenom?.[0]}{user?.nom?.[0]}</Avatar>
        <Box>
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>{user?.prenom} {user?.nom}</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{user?.role}</Typography>
        </Box>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mb: 1 }} />
      <List sx={{ flexGrow: 1 }}>{menu.map((item) => renderItem(item))}</List>
    </Box>
  )
}

export default function Sidebar() {
  const theme  = useTheme()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const logout = useAuthStore((s) => s.logout)

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
      <AppBar position="fixed" sx={{ display: { xs: 'flex', md: 'none' }, background: 'linear-gradient(90deg, #1e293b, #0D47A1)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton edge="start" color="inherit" onClick={() => setOpen(true)}><MenuOutlined /></IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>PRESF ARCHIVIS</Typography>
          <IconButton color="inherit" onClick={handleLogout}><LogoutOutlined /></IconButton>
        </Toolbar>
      </AppBar>

      <Drawer variant="temporary" open={open} onClose={() => setOpen(false)} sx={{ display: { xs: 'block', md: 'none' }, ...drawerStyles }}>
        <DrawerContent onClose={() => setOpen(false)} onLogout={handleLogout} />
      </Drawer>

      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, ...drawerStyles }}>
        <DrawerContent onLogout={handleLogout} />
      </Drawer>
    </>
  )
}