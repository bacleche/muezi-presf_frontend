// 'use client'
// import { useEffect, useState } from 'react'
// import { useRouter, useParams } from 'next/navigation'
// import {
//   Box, Typography, Card, CardContent, Button,
//   Grid, TextField, MenuItem, Alert, CircularProgress
// } from '@mui/material'
// import { SaveOutlined, ArrowBackOutlined } from '@mui/icons-material'
// import { agenceAPI, paysAPI, villeAPI } from '@/lib/api'

// interface PaysBackend {
//   id: number
//   nom: string
// }

// interface VilleBackend {
//   id: number
//   nom: string
// }

// export default function ModifierAgencePage() {
//   const router    = useRouter()
//   const params    = useParams()
//   const agenceId  = Number(params.id)

//   const [loadingData, setLoadingData] = useState(true)
//   const [loading, setLoading]         = useState(false)
//   const [error, setError]             = useState('')

//   const [listePays, setListePays]     = useState<PaysBackend[]>([])
//   const [listeVilles, setListeVilles] = useState<VilleBackend[]>([])
//   const [loadingVilles, setLoadingVilles] = useState(false)

//   const [form, setForm] = useState({
//     nom:   '',
//     code:  '',
//     pays:  '' as number | '',
//     ville: '' as number | ''
//   })

//   // ── Charger la liste des pays au montage ─────────────────────
//   useEffect(() => {
//     paysAPI.liste()
//       .then(({ data }) => setListePays(data.results ?? data))
//       .catch(() => setError('Impossible de charger la liste des pays.'))
//   }, [])

//   // ── Charger les données actuelles de l'agence ────────────────
//   useEffect(() => {
//     if (!agenceId) return
//     agenceAPI.detail(agenceId)
//       .then(({ data }) => {
//         setForm({
//           nom:   data.nom || '',
//           code:  data.code || '',
//           // Le serializer Django renvoie 'pays_id' (voir AgenceSerializer)
//           pays:  data.pays_id ?? '',
//           ville: data.ville ?? '',
//         })
//       })
//       .catch(() => setError("Impossible de charger les informations de l'agence."))
//       .finally(() => setLoadingData(false))
//   }, [agenceId])

//   // ── Charger les villes du pays sélectionné ───────────────────
//   useEffect(() => {
//     if (form.pays === '') {
//       setListeVilles([])
//       return
//     }
//     setLoadingVilles(true)
//     villeAPI.liste({ pays: form.pays })
//       .then(({ data }) => setListeVilles(data.results ?? data))
//       .catch(() => setError('Erreur lors du chargement des villes associées.'))
//       .finally(() => setLoadingVilles(false))
//   }, [form.pays])

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target
//     setForm((prev) => {
//       const updated = { ...prev, [name]: value }
//       if (name === 'pays') {
//         updated.ville = ''
//       }
//       return updated
//     })
//   }

//   const handleSubmit = async () => {
//     setLoading(true)
//     setError('')
//     try {
//       await agenceAPI.modifier(agenceId, {
//         nom:   form.nom,
//         code:  form.code.toUpperCase(),
//         ville: form.ville,
//       })
//       router.push('/admin/agences')
//     } catch (err: unknown) {
//       console.error(err)
//       const e = err as { response?: { data?: Record<string, string[]> } }
//       const msgs = Object.values(e.response?.data || {}).flat()
//       setError(msgs[0] || "Erreur lors de la modification de l'agence.")
//     } finally {
//       setLoading(false)
//     }
//   }

//   const valide = !!form.nom && !!form.code && form.ville !== ''

//   if (loadingData) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
//         <CircularProgress />
//       </Box>
//     )
//   }

//   return (
//     <Box sx={{ p: 1 }}>
//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
//         <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small"
//           onClick={() => router.back()}>
//           Retour
//         </Button>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 700 }}>Modifier l'Agence</Typography>
//           <Typography variant="body2" color="text.secondary">
//             Corriger les informations de l'établissement
//           </Typography>
//         </Box>
//       </Box>

//       <Card sx={{ maxWidth: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
//         <CardContent sx={{ p: 4 }}>
//           {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

//           <Grid container spacing={2.5}>

//             <Grid size={{ xs: 12, sm: 6 }}>
//               <TextField fullWidth select label="Zone Pays" name="pays"
//                 value={form.pays} onChange={handleChange} required
//                 helperText="Sélectionner le territoire"
//               >
//                 {listePays.map((p) => (
//                   <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>
//                 ))}
//               </TextField>
//             </Grid>

//             <Grid size={{ xs: 12, sm: 6 }}>
//               <TextField fullWidth select label="Ville" name="ville"
//                 value={form.ville} onChange={handleChange} required
//                 disabled={form.pays === '' || loadingVilles}
//                 helperText={
//                   form.pays === ''
//                     ? "Choisissez d'abord un pays"
//                     : loadingVilles ? "Mise à jour..." : "Villes disponibles"
//                 }
//               >
//                 {listeVilles.map((v) => (
//                   <MenuItem key={v.id} value={v.id}>{v.nom}</MenuItem>
//                 ))}
//               </TextField>
//             </Grid>

//             <Grid size={{ xs: 12 }}>
//               <TextField fullWidth label="Nom de l'agence" name="nom"
//                 value={form.nom} onChange={handleChange} required
//               />
//             </Grid>

//             <Grid size={{ xs: 12 }}>
//               <TextField
//                 fullWidth
//                 label="Code Unique"
//                 name="code"
//                 value={form.code}
//                 onChange={handleChange}
//                 required
//                 slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
//                 helperText="Modifiable manuellement si besoin"
//               />
//             </Grid>

//           </Grid>

//           <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
//             <Button
//               variant="contained" size="large"
//               onClick={handleSubmit}
//               disabled={loading || !valide}
//               startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
//               sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' }, px: 4 }}
//             >
//               Enregistrer les modifications
//             </Button>
//           </Box>
//         </CardContent>
//       </Card>
//     </Box>
//   )
// }

'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Grid, TextField, MenuItem, Alert, CircularProgress,
  InputAdornment
} from '@mui/material'
import { SaveOutlined, ArrowBackOutlined, AutoAwesomeOutlined } from '@mui/icons-material'
import { agenceAPI, paysAPI, villeAPI } from '@/lib/api'

interface PaysBackend {
  id: number
  nom: string
}

interface VilleBackend {
  id: number
  nom: string
}

export default function ModifierAgencePage() {
  const router    = useRouter()
  const params    = useParams()
  const agenceId  = Number(params.id)

  const [loadingData, setLoadingData] = useState(true)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const [listePays, setListePays]     = useState<PaysBackend[]>([])
  const [listeVilles, setListeVilles] = useState<VilleBackend[]>([])
  const [loadingVilles, setLoadingVilles] = useState(false)

  // Génération automatique du code (déclenchée uniquement après chargement initial,
  // pour ne pas écraser le code existant tant que l'utilisateur n'a rien changé)
  const [dataChargee, setDataChargee] = useState(false)
  const [codeGenere, setCodeGenere]   = useState('')
  const [loadingCode, setLoadingCode] = useState(false)

  const [form, setForm] = useState({
    nom:   '',
    code:  '',
    pays:  '' as number | '',
    ville: '' as number | ''
  })

  // ── Charger la liste des pays au montage ─────────────────────
  useEffect(() => {
    paysAPI.liste()
      .then(({ data }) => setListePays(data.results ?? data))
      .catch(() => setError('Impossible de charger la liste des pays.'))
  }, [])

  // ── Charger les données actuelles de l'agence ────────────────
  useEffect(() => {
    if (!agenceId) return
    agenceAPI.detail(agenceId)
      .then(({ data }) => {
        setForm({
          nom:   data.nom || '',
          code:  data.code || '',
          // Le serializer Django renvoie 'pays_id' (voir AgenceSerializer)
          pays:  data.pays_id ?? '',
          ville: data.ville ?? '',
        })
      })
      .catch(() => setError("Impossible de charger les informations de l'agence."))
      .finally(() => {
        setLoadingData(false)
        setDataChargee(true)
      })
  }, [agenceId])

  // ── Charger les villes du pays sélectionné ───────────────────
  useEffect(() => {
    if (form.pays === '') {
      setListeVilles([])
      return
    }
    setLoadingVilles(true)
    villeAPI.liste({ pays: form.pays })
      .then(({ data }) => setListeVilles(data.results ?? data))
      .catch(() => setError('Erreur lors du chargement des villes associées.'))
      .finally(() => setLoadingVilles(false))
  }, [form.pays])

  // ── Génération automatique du code — active seulement APRÈS le chargement
  //    initial, pour ne pas écraser le code existant à l'ouverture de la page.
  //    Se déclenche ensuite si l'utilisateur change le nom, le pays ou la ville.
  useEffect(() => {
    if (!dataChargee) return
    if (form.pays === '' || form.ville === '' || form.nom.trim().length < 2) {
      return
    }

    const t = setTimeout(() => {
      setLoadingCode(true)
      agenceAPI.previewCode({
        pays_id:  Number(form.pays),
        ville_id: Number(form.ville),
        nom:      form.nom,
      })
        .then(({ data }) => {
          setCodeGenere(data.code)
          setForm((prev) => ({ ...prev, code: data.code }))
        })
        .catch((err) => {
          console.error('Erreur lors de la génération du code:', err)
        })
        .finally(() => setLoadingCode(false))
    }, 400)

    return () => clearTimeout(t)
  }, [form.pays, form.ville, form.nom, dataChargee])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      if (name === 'pays') {
        updated.ville = ''
      }
      return updated
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await agenceAPI.modifier(agenceId, {
        nom:   form.nom,
        code:  form.code.toUpperCase(),
        ville: form.ville,
      })
      router.push('/admin/agences')
    } catch (err: unknown) {
      console.error(err)
      const e = err as { response?: { data?: Record<string, string[]> } }
      const msgs = Object.values(e.response?.data || {}).flat()
      setError(msgs[0] || "Erreur lors de la modification de l'agence.")
    } finally {
      setLoading(false)
    }
  }

  const valide = !!form.nom && !!form.code && form.ville !== ''

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small"
          onClick={() => router.back()}>
          Retour
        </Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Modifier l'Agence</Typography>
          <Typography variant="body2" color="text.secondary">
            Corriger les informations de l'établissement
          </Typography>
        </Box>
      </Box>

      <Card sx={{ maxWidth: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Grid container spacing={2.5}>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Zone Pays" name="pays"
                value={form.pays} onChange={handleChange} required
                helperText="Sélectionner le territoire"
              >
                {listePays.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Ville" name="ville"
                value={form.ville} onChange={handleChange} required
                disabled={form.pays === '' || loadingVilles}
                helperText={
                  form.pays === ''
                    ? "Choisissez d'abord un pays"
                    : loadingVilles ? "Mise à jour..." : "Villes disponibles"
                }
              >
                {listeVilles.map((v) => (
                  <MenuItem key={v.id} value={v.id}>{v.nom}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Nom de l'agence" name="nom"
                value={form.nom} onChange={handleChange} required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Code Unique"
                name="code"
                value={form.code}
                onChange={handleChange}
                required
                slotProps={{
                  htmlInput: { style: { textTransform: 'uppercase' } },
                  input: {
                    endAdornment: loadingCode ? (
                      <InputAdornment position="end">
                        <CircularProgress size={16} />
                      </InputAdornment>
                    ) : codeGenere ? (
                      <InputAdornment position="end">
                        <AutoAwesomeOutlined sx={{ fontSize: 18, color: 'success.main' }} />
                      </InputAdornment>
                    ) : undefined,
                  },
                }}
                helperText="Se régénère si vous changez le nom, le pays ou la ville — modifiable manuellement"
              />
            </Grid>

          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained" size="large"
              onClick={handleSubmit}
              disabled={loading || !valide}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
              sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' }, px: 4 }}
            >
              Enregistrer les modifications
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}