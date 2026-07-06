// 'use client'
// import { useEffect, useState, useCallback } from 'react'
// import { useRouter } from 'next/navigation'
// import {
//   Box, Typography, Button, Card, CardContent,
//   Table, TableBody, TableCell, TableContainer,
//   TableHead, TableRow, Paper, TextField,
//   InputAdornment, Chip, CircularProgress,
//   Alert, Switch, Tooltip, Avatar
// } from '@mui/material'
// import { AddCircleOutlined, SearchOutlined, LocationOnOutlined, BusinessOutlined, AccountCircleOutlined } from '@mui/icons-material'
// import { agenceAPI } from '@/lib/api'

// interface Agence {
//   id: number
//   nom: string
//   code: string
//   ville_nom?: string  // Nom en clair de la ville
//   pays_nom?: string   // Nom en clair du pays
//   chef_nom?: string   // Prénom + Nom du chef d'agence renvoyé par le Serializer Django
//   is_active: boolean
// }

// export default function AgencesPage() {
//   const router = useRouter()
//   const [agences, setAgences] = useState<Agence[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError]     = useState('')
//   const [search, setSearch]   = useState('')

//   const charger = useCallback(async (q: string) => {
//     setLoading(true)
//     try {
//       const { data } = await agenceAPI.liste({ search: q })
//       setAgences(data.results ?? data)
//     } catch (err) {
//       console.error(err)
//       setError('Erreur lors du chargement des agences.')
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     const t = setTimeout(() => charger(search), 400)
//     return () => clearTimeout(t)
//   }, [search, charger])

//   const toggleActif = async (agence: Agence) => {
//     try {
//       await agenceAPI.modifier(agence.id, { is_active: !agence.is_active })
//       setAgences((prev) => prev.map((a) =>
//         a.id === agence.id ? { ...a, is_active: !a.is_active } : a
//       ))
//     } catch (err) {
//       console.error(err)
//       setError('Erreur lors du changement de statut.')
//     }
//   }

//   return (
//     <Box sx={{ p: 1 }}>
//       {/* En-tête */}
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 700 }}>Gestion des Agences</Typography>
//           <Typography variant="body2" color="text.secondary">
//             Suivi des succursales financières et de leurs responsables attitrés
//           </Typography>
//         </Box>
//         <Button
//           variant="contained"
//           startIcon={<AddCircleOutlined />}
//           onClick={() => router.push('/admin/agences/nouvelle')}
//           sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' } }}
//         >
//           Nouvelle agence
//         </Button>
//       </Box>

//       {/* Recherche */}
//       <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
//         <CardContent sx={{ py: '12px !important' }}>
//           <TextField
//             placeholder="Rechercher par nom, code, responsable..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             size="small" sx={{ width: 320 }}
//             slotProps={{
//               input: {
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <SearchOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
//                   </InputAdornment>
//                 ),
//               },
//             }}
//           />
//         </CardContent>
//       </Card>

//       {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

//       {/* Table de Données */}
//       <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ bgcolor: '#0f172a' }}>
//               {['Code', 'Nom de l\'Agence', 'Localisation', 'Chef d\'Agence', 'Actif'].map((h) => (
//                 <TableCell key={h} sx={{ color: 'white', fontWeight: 600, py: 2 }}>{h}</TableCell>
//               ))}
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
//                   <CircularProgress size={36} />
//                 </TableCell>
//               </TableRow>
//             ) : agences.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
//                   Aucune agence trouvée
//                 </TableCell>
//               </TableRow>
//             ) : agences.map((a) => (
//               <TableRow key={a.id} hover sx={{ opacity: a.is_active ? 1 : 0.65 }}>
//                 {/* Code */}
//                 <TableCell sx={{ width: '100px' }}>
//                   <Chip label={a.code} size="small" variant="outlined" color="primary" sx={{ fontWeight: 700 }} />
//                 </TableCell>
                
//                 {/* Nom */}
//                 <TableCell sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
//                   <BusinessOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
//                   {a.nom}
//                 </TableCell>
                
//                 {/* Localisation */}
//                 <TableCell>
//                   {a.ville_nom ? (
//                     <Chip
//                       icon={<LocationOnOutlined style={{ fontSize: 16 }} />}
//                       label={`${a.ville_nom} ${a.pays_nom ? `· ${a.pays_nom}` : ''}`}
//                       variant="outlined"
//                       size="small"
//                     />
//                   ) : (
//                     <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
//                       Non localisée
//                     </Typography>
//                   )}
//                 </TableCell>
                
//                 {/* Chef d'agence (Dynamique) */}
//                 <TableCell>
//                   {a.chef_nom ? (
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                       <Avatar sx={{ width: 26, height: 26, bgcolor: '#e0f2fe', color: '#0284c7', fontSize: 13, fontWeight: 600 }}>
//                         {a.chef_nom.charAt(0).toUpperCase()}
//                       </Avatar>
//                       <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                         {a.chef_nom}
//                       </Typography>
//                     </Box>
//                   ) : (
//                     <Chip
//                       icon={<AccountCircleOutlined style={{ fontSize: 16 }} />}
//                       label="Aucun assigné"
//                       size="small"
//                       variant="outlined" 
//                       sx={{ color: 'text.disabled', fontStyle: 'italic', borderStyle: 'dashed' }} // Optionnel: style tirets pour faire "vide"
//                     />
//                   )}
//                 </TableCell>
                
//                 {/* Statut Switch */}
//                 <TableCell sx={{ width: '100px' }}>
//                   <Tooltip title={a.is_active ? 'Désactiver l\'agence' : 'Activer l\'agence'}>
//                     <Switch
//                       checked={a.is_active}
//                       onChange={() => toggleActif(a)}
//                       color="success" 
//                       size="small"
//                     />
//                   </Tooltip>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </TableContainer>
//     </Box>
//   )
// }




'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, Chip, CircularProgress,
  Alert, Switch, Tooltip, Avatar, IconButton
} from '@mui/material'
import {
  AddCircleOutlined, SearchOutlined, LocationOnOutlined,
  BusinessOutlined, AccountCircleOutlined, EditOutlined
} from '@mui/icons-material'
import { agenceAPI } from '@/lib/api'

interface Agence {
  id: number
  nom: string
  code: string
  ville_nom?: string  // Nom en clair de la ville
  pays_nom?: string   // Nom en clair du pays
  chef_nom?: string   // Prénom + Nom du chef d'agence renvoyé par le Serializer Django
  is_active: boolean
}

export default function AgencesPage() {
  const router = useRouter()
  const [agences, setAgences] = useState<Agence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')

  const charger = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const { data } = await agenceAPI.liste({ search: q })
      setAgences(data.results ?? data)
    } catch (err) {
      console.error(err)
      setError('Erreur lors du chargement des agences.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => charger(search), 400)
    return () => clearTimeout(t)
  }, [search, charger])

  const toggleActif = async (agence: Agence) => {
    try {
      await agenceAPI.modifier(agence.id, { is_active: !agence.is_active })
      setAgences((prev) => prev.map((a) =>
        a.id === agence.id ? { ...a, is_active: !a.is_active } : a
      ))
    } catch (err) {
      console.error(err)
      setError('Erreur lors du changement de statut.')
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Gestion des Agences</Typography>
          <Typography variant="body2" color="text.secondary">
            Suivi des succursales financières et de leurs responsables attitrés
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlined />}
          onClick={() => router.push('/admin/agences/nouvelle')}
          sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' } }}
        >
          Nouvelle agence
        </Button>
      </Box>

      {/* Recherche */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ py: '12px !important' }}>
          <TextField
            placeholder="Rechercher par nom, code, responsable..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small" sx={{ width: 320 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Table de Données */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0f172a' }}>
              {['Code', 'Nom de l\'Agence', 'Localisation', 'Chef d\'Agence', 'Actif', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600, py: 2 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={36} />
                </TableCell>
              </TableRow>
            ) : agences.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucune agence trouvée
                </TableCell>
              </TableRow>
            ) : agences.map((a) => (
              <TableRow key={a.id} hover sx={{ opacity: a.is_active ? 1 : 0.65 }}>
                {/* Code */}
                <TableCell sx={{ width: '100px' }}>
                  <Chip label={a.code} size="small" variant="outlined" color="primary" sx={{ fontWeight: 700 }} />
                </TableCell>
                
                {/* Nom */}
                <TableCell sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                  <BusinessOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
                  {a.nom}
                </TableCell>
                
                {/* Localisation */}
                <TableCell>
                  {a.ville_nom ? (
                    <Chip
                      icon={<LocationOnOutlined style={{ fontSize: 16 }} />}
                      label={`${a.ville_nom} ${a.pays_nom ? `· ${a.pays_nom}` : ''}`}
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                      Non localisée
                    </Typography>
                  )}
                </TableCell>
                
                {/* Chef d'agence (Dynamique) */}
                <TableCell>
                  {a.chef_nom ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 26, height: 26, bgcolor: '#e0f2fe', color: '#0284c7', fontSize: 13, fontWeight: 600 }}>
                        {a.chef_nom.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {a.chef_nom}
                      </Typography>
                    </Box>
                  ) : (
                    <Chip
                      icon={<AccountCircleOutlined style={{ fontSize: 16 }} />}
                      label="Aucun assigné"
                      size="small"
                      variant="outlined" 
                      sx={{ color: 'text.disabled', fontStyle: 'italic', borderStyle: 'dashed' }}
                    />
                  )}
                </TableCell>
                
                {/* Statut Switch */}
                <TableCell sx={{ width: '100px' }}>
                  <Tooltip title={a.is_active ? 'Désactiver l\'agence' : 'Activer l\'agence'}>
                    <Switch
                      checked={a.is_active}
                      onChange={() => toggleActif(a)}
                      color="success" 
                      size="small"
                    />
                  </Tooltip>
                </TableCell>

                {/* Actions */}
                <TableCell sx={{ width: '80px' }}>
                  <Tooltip title="Modifier l'agence">
                    <IconButton
                      color="primary"
                      onClick={() => router.push(`/admin/agences/${a.id}/modifier`)}
                    >
                      <EditOutlined />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}