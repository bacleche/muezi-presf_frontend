'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress, Typography } from '@mui/material'

export default function RootDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // 1. Récupérer les infos de l'utilisateur stockées lors du login
    const userString = localStorage.getItem('user') 
    
    if (!userString) {
      // Si aucun utilisateur n'est trouvé, retour à la case départ
      router.replace('/login')
      return
    }

    try {
      const user = JSON.parse(userString)
      const role = user.role

      // 2. Aiguillage dynamique selon le rôle backend
      switch (role) {
        case 'superadmin':
          router.replace('/admin') // Ton tableau de bord actuel
          break
        case 'chef_agence':
          router.replace('/agence/dashboard') // Sa vue spécifique
          break
        case 'chef_produit':
          router.replace('/produits/dashboard') // Sa vue spécifique
          break
        case 'conformite':
          router.replace('/conformite/dashboard') // Sa vue spécifique
          break
        default:
          // Sécurité : si le rôle est inconnu, on déconnecte
          localStorage.clear()
          router.replace('/login')
      }
    } catch (e) {
      console.error("Erreur lors du parsing de l'utilisateur", e)
      router.replace('/login')
    }
  }, [router])

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        gap: 2 
      }}
    >
      <CircularProgress size={40} sx={{ color: '#0D47A1' }} />
      <Typography variant="body2" color="text.secondary">
        Chargement de votre espace de travail...
      </Typography>
    </Box>
  )
}