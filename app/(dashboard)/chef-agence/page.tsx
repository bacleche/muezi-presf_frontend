// 'use client'
// import { useEffect, useState, useCallback } from 'react'
// import { useRouter } from 'next/navigation'
// import { 
//   Box, Typography, Grid, Card, CardContent, Button, 
//   CircularProgress, Alert, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Paper 
// } from '@mui/material'
// import { 
//   PersonAddOutlined, 
//   GroupOutlined, 
//   ContactPageOutlined, 
//   ArrowForwardOutlined,
//   BusinessOutlined
// } from '@mui/icons-material'
// import { clientAPI } from '@/lib/api'

// interface Client {
//   id: number
//   nom: string
//   prenom: string
//   telephone?: string
//   created_at: string
// }

// export default function ChefAgenceDashboardIndex() {
//   const router = useRouter()
//   const [recentClients, setRecentClients] = useState<Client[]>([])
//   const [totalClients, setTotalClients] = useState<number>(0)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')

//   const chargerDonneesAgence = useCallback(async () => {
//     setLoading(true)
//     setError('')
//     try {
//       // Appel à ton endpoint Django. Le backend intercepte le token 
//       // et renvoie uniquement les clients de l'agence du chef connecté.
//       const { data } = await clientAPI.liste()
      
//       const listeClients = data.results ?? data
//       setTotalClients(listeClients.length)
      
//       // On extrait les 4 clients les plus récents pour le flux d'activité
//       const tries = [...listeClients].sort(
//         (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//       )
//       setRecentClients(tries.slice(0, 4))
//     } catch (err) {
//       console.error(err)
//       setError("Impossible de charger les données de votre agence.")
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     chargerDonneesAgence()
//   }, [chargerDonneesAgence])

//   if (loading) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
//         <CircularProgress size={40} />
//       </Box>
//     )
//   }

//   return (
//     <Box sx={{ p: 1 }}>
//       {/* ── En-tête de bienvenue ── */}
//       <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
//         <Box sx={{ p: 1.5, bgcolor: '#f1f5f9', borderRadius: 3, display: 'flex' }}>
//           <BusinessOutlined sx={{ color: '#0f172a', fontSize: 32 }} />
//         </Box>
//         <Box>
//           <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
//             Gestion de l'Agence
//           </Typography>
//           <Typography variant="body2" color="text.secondary">
//             Suivi kyc, enregistrement des clients et contrôle des pièces d'identité réglementaires
//           </Typography>
//         </Box>
//       </Box>

//       {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

//       {/* ── Grille Principale : KPI & Actions Rapides ── */}
//       <Grid container spacing={3} sx={{ mb: 4 }}>
//         {/* Statistique : Nombre de clients de l'agence */}
//         <Grid size={{ xs: 12, md: 4 }}>
//           <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 3, bgcolor: '#0f172a', color: 'white', height: '100%' }}>
//             <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', height: '100%' }}>
//               <Box>
//                 <GroupOutlined sx={{ fontSize: 32, color: '#38bdf8', mb: 1 }} />
//                 <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.8 }}>Portefeuille Local</Typography>
//                 <Typography variant="h3" sx={{ fontWeight: 800, my: 1.5 }}>{totalClients}</Typography>
//               </Box>
//               <Typography variant="caption" sx={{ opacity: 0.6 }}>
//                 Clients uniques enregistrés au sein de votre agence
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Raccourci : Enregistrer un client */}
//         <Grid size={{ xs: 12, sm: 6, md: 4 }}>
//           <Card sx={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderRadius: 3, border: '1px solid #e2e8f0' }}>
//             <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3 }}>
//               <Box sx={{ flexGrow: 1 }}>
//                 <PersonAddOutlined sx={{ fontSize: 36, color: '#2E7D32', mb: 1 }} />
//                 <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Nouvel Enregistrement</Typography>
//                 <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//                   Créer un profil client immédiatement pour permettre l'archivage de ses futures opérations.
//                 </Typography>
//               </Box>
//               <Button 
//                 variant="contained" 
//                 fullWidth 
//                 endIcon={<ArrowForwardOutlined />}
//                 onClick={() => router.push('/chef-agence/clients/nouveau')}
//                 sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1b5e20' }, textTransform: 'none', borderRadius: 2, py: 1 }}
//               >
//                 Ouvrir un compte KYC
//               </Button>
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Raccourci : Consulter la liste complète */}
//         <Grid size={{ xs: 12, sm: 6, md: 4 }}>
//           <Card sx={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderRadius: 3, border: '1px solid #e2e8f0' }}>
//             <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3 }}>
//               <Box sx={{ flexGrow: 1 }}>
//                 <ContactPageOutlined sx={{ fontSize: 36, color: '#0D47A1', mb: 1 }} />
//                 <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Vérifier les Pièces</Typography>
//                 <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//                   Rechercher un client existant pour lui ajouter un CNI, un Passeport, un Permis ou un NIU.
//                 </Typography>
//               </Box>
//               <Button 
//                 variant="outlined" 
//                 fullWidth 
//                 onClick={() => router.push('/chef-agence/clients')}
//                 sx={{ color: '#0D47A1', borderColor: '#0D47A1', textTransform: 'none', borderRadius: 2, py: 1 }}
//               >
//                 Gérer le portefeuille
//               </Button>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* ── Section : Dernières Activités de l'Agence ── */}
//       <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
//         Derniers enregistrements effectués
//       </Typography>

//       {recentClients.length === 0 ? (
//         <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary', borderRadius: 3, border: '1px dashed #cbd5e1', bgcolor: '#f8fafc' }}>
//           Aucun client enregistré pour le moment dans cette agence.
//         </Paper>
//       ) : (
//         <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
//           <List disablePadding>
//             {recentClients.map((client, idx) => (
//               <Box key={client.id}>
//                 <ListItem 
//                   sx={{ py: 2, px: 3, '&:hover': { bgcolor: '#f8fafc' } }}
                
//                 >
//                   <ListItemAvatar>
//                     <Avatar sx={{ bgcolor: '#E3F2FD', color: '#0D47A1', fontWeight: 700, fontSize: 14 }}>
//                       {client.nom[0].toUpperCase()}{client.prenom[0].toUpperCase()}
//                     </Avatar>
//                   </ListItemAvatar>
//                   <ListItemText
//                     primary={`${client.nom.toUpperCase()} ${client.prenom}`}
//                     secondary={client.telephone ? `Téléphone : ${client.telephone}` : 'Aucun numéro de téléphone'}
//                     slotProps={{
//                       primary: { sx: { fontWeight: 600, color: '#0f172a' } },
//                       secondary: { sx: { color: 'text.secondary', variant: 'body2' } }
//                     }}
//                   />
//                   <Box sx={{ mr: 4, display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
//                     <Typography variant="caption" color="text.secondary">Inscrit le</Typography>
//                     <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                       {new Date(client.created_at).toLocaleDateString('fr-FR')}
//                     </Typography>
//                   </Box>
//                 </ListItem>
//                 {idx < recentClients.length - 1 && <Divider />}
//               </Box>
//             ))}
//           </List>
//         </Paper>
//       )}
//     </Box>
//   )
// }



'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, TextField,
  InputAdornment, CircularProgress, Alert, IconButton, Tooltip
} from '@mui/material'
import { 
  SearchOutlined, PersonAddOutlined, 
  EditOutlined, RefreshOutlined 
} from '@mui/icons-material'
import { clientAPI } from '@/lib/api'

interface Client {
  id: number
  nom: string
  prenom: string
  telephone?: string
  email?: string
  cni?: string // URL du fichier
  adresse?: string
  created_at: string
}

export default function ClientsAgencePage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const chargerClients = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Le backend Django filtre automatiquement selon l'agence du Chef connecté
      const { data } = await clientAPI.liste({ search: search || undefined })
      setClients(data.results ?? data)
    } catch (err) {
      console.error(err)
      setError('Impossible de récupérer la liste des clients.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      chargerClients()
    }, 400) // Anti-rebond pour éviter de surcharger l'API à chaque lettre tapée
    return () => clearTimeout(delayDebounce)
  }, [search, chargerClients])

  return (
    <Box sx={{ p: 1 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Portefeuille Clients</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestion des clients rattachés à votre agence et suivi des pièces de conformité
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddOutlined />}
          onClick={() => router.push('/chef-agence/clients/nouveau')}
          sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' }, textTransform: 'none', borderRadius: 2 }}
        >
          Enregistrer un Client
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Barre de Recherche */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder="Rechercher par nom, prénom ou numéro de pièce d'identité..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                    input: {
                    startAdornment: (
                        <InputAdornment position="start">
                        <SearchOutlined color="action" />
                        </InputAdornment>
                    ),
                    endAdornment: loading ? <CircularProgress size={20} /> : null
                        }
                    }}
            />
      </Paper>

      {/* Tableau des clients */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0f172a' }}>
              {['Nom & Prénom', 'Téléphone', 'Email', 'Date d\'inscription', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600, py: 2 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucun client trouvé pour cette recherche ou pour cette agence.
                </TableCell>
              </TableRow>
            ) : clients.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{`${c.nom.toUpperCase()} ${c.prenom}`}</TableCell>
                <TableCell>{c.telephone || '—'}</TableCell>
                <TableCell>{c.email || '—'}</TableCell>
                <TableCell>{new Date(c.created_at).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>
                  <Tooltip title="Modifier le client">
                    <IconButton 
                      color="primary" 
                      onClick={() => router.push(`/chef-agence/clients/${c.id}/modifier`)}
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