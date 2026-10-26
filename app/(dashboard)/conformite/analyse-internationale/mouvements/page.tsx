// 'use client'
// import { useState, useEffect, Suspense } from 'react'
// import { useSearchParams, useRouter } from 'next/navigation'
// import {
//   Box, Typography, Card, CardContent, Button,
//   Chip, CircularProgress, Alert, Collapse, IconButton,
//   Grid, Tooltip,
// } from '@mui/material'
// import {
//   ArrowBackOutlined, ExpandMoreOutlined, ExpandLessOutlined,
//   LocationCityOutlined, CheckCircleOutlined, RadioButtonUncheckedOutlined,
// } from '@mui/icons-material'
// import { archiveAgenceAPI } from '@/lib/api'

// interface DocumentArchive {
//   id:               number
//   type_doc:         string
//   type_doc_display: string
//   fichier_url:      string
//   uploaded_at:      string
// }

// interface Archive {
//   id:                  number
//   agence_nom:          string
//   agence_code:         string
//   produit_nom:         string
//   date:                string
//   documents:           DocumentArchive[]
//   documents_complets:  boolean
//   types_requis:        { value: string; label: string }[]
// }

// function getExtension(url?: string | null): string {
//   if (!url) return ''
//   const clean = url.split('?')[0]
//   const parts = clean.split('.')
//   return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
// }

// function FilePreview({ url, height = 220 }: { url?: string | null; height?: number }) {
//   if (!url) {
//     return (
//       <Box sx={{ height, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//         <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Aucun fichier</Typography>
//       </Box>
//     )
//   }
//   const ext = getExtension(url)
//   const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
//   const isPdf   = ext === 'pdf'

//   if (isImage) {
//     return (
//       <Box sx={{ height, borderRadius: 1.5, overflow: 'hidden', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//         <img src={url} alt="Aperçu du document" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
//       </Box>
//     )
//   }
//   if (isPdf) {
//     return (
//       <Box sx={{ height, borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
//         <iframe src={`${url}#toolbar=0`} title="Aperçu PDF" style={{ width: '100%', height: '100%', border: 'none' }} />
//       </Box>
//     )
//   }
//   return (
//     <Box sx={{ height, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
//       <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Aperçu indisponible</Typography>
//       <Typography component="a" href={url} target="_blank" color="primary" sx={{ fontSize: 12, textDecoration: 'underline' }}>
//         Ouvrir dans un nouvel onglet
//       </Typography>
//     </Box>
//   )
// }

// function ArchiveRow({ archive }: { archive: Archive }) {
//   const [open, setOpen] = useState(false)
//   const total = archive.types_requis.length
//   const done  = archive.documents.length

//   return (
//     <Card variant="outlined" sx={{ borderRadius: 2, mb: 1 }}>
//       <Box
//         onClick={() => setOpen(!open)}
//         sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '10px 16px', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, gap: 1, flexWrap: 'wrap' }}
//       >
//         <Box>
//           <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{archive.agence_nom} ({archive.agence_code})</Typography>
//           <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
//             {new Date(archive.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
//           </Typography>
//         </Box>
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <Chip
//             label={archive.documents_complets ? 'Complet' : `${done}/${total}`}
//             color={archive.documents_complets ? 'success' : 'warning'}
//             size="small"
//             sx={{ fontSize: 11, height: 22 }}
//           />
//           {open ? <ExpandLessOutlined sx={{ fontSize: 18, color: 'text.secondary' }} /> : <ExpandMoreOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />}
//         </Box>
//       </Box>

//       <Collapse in={open} unmountOnExit>
//         <CardContent sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
//           <Grid container spacing={1.5}>
//             {archive.types_requis.map(({ value, label }) => {
//               const doc = archive.documents.find(d => d.type_doc === value)
//               return (
//                 <Grid size={{ xs: 12, sm: 6, md: 4 }} key={value}>
//                   <Typography sx={{ fontSize: 12, fontWeight: 500, mb: 0.5 }}>{label}</Typography>
//                   {doc ? (
//                     <>
//                       <FilePreview url={doc.fichier_url} height={160} />
//                       <Typography
//                         component="a" href={doc.fichier_url} target="_blank" color="primary"
//                         sx={{ fontSize: 11, textDecoration: 'underline', display: 'block', mt: 0.5 }}
//                       >
//                         Ouvrir en plein écran
//                       </Typography>
//                     </>
//                   ) : (
//                     <Box sx={{ height: 160, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                       <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Manquant</Typography>
//                     </Box>
//                   )}
//                 </Grid>
//               )
//             })}
//           </Grid>
//         </CardContent>
//       </Collapse>
//     </Card>
//   )
// }

// function AnalyseInternationaleMouvementsContent() {
//   const searchParams = useSearchParams()
//   const router = useRouter()
//   const villeId  = searchParams.get('ville_id')
//   const villeNom = searchParams.get('ville_nom') ?? ''
//   const paysNom  = searchParams.get('pays_nom') ?? ''

//   const [archives, setArchives] = useState<Archive[]>([])
//   const [loading, setLoading]   = useState(true)
//   const [error, setError]       = useState('')

//   useEffect(() => {
//     if (!villeId) return
//     const charger = async () => {
//       setLoading(true)
//       setError('')
//       try {
//         const { data } = await archiveAgenceAPI.internationalParVille({ ville_id: Number(villeId) })
//         setArchives(data)
//       } catch {
//         setError('Impossible de charger les mouvements de cette ville.')
//       } finally {
//         setLoading(false)
//       }
//     }
//     charger()
//   }, [villeId])

//   if (!villeId) {
//     return <Alert severity="error">Aucune ville sélectionnée.</Alert>
//   }

//   return (
//     <Box>
//       <Button
//         startIcon={<ArrowBackOutlined />}
//         onClick={() => router.push('/conformite/analyse-internationale')}
//         sx={{ mb: 2 }}
//       >
//         Retour à Analyse Internationale
//       </Button>

//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
//         <LocationCityOutlined sx={{ color: '#185FA5', fontSize: 24 }} />
//         <Typography variant="h5" sx={{ fontWeight: 700 }}>
//           Mouvements d'agence — {villeNom}{paysNom ? `, ${paysNom}` : ''}
//         </Typography>
//       </Box>
//       <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//         Vue de supervision (lecture seule) des mouvements d'agence saisis par la conformité de cette ville.
//       </Typography>

//       {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

//       {loading ? (
//         <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
//           <CircularProgress />
//         </Box>
//       ) : archives.length === 0 ? (
//         <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
//           <Typography sx={{ fontSize: 14 }}>Aucun mouvement pour cette ville</Typography>
//         </Box>
//       ) : (
//         archives.map((archive) => <ArchiveRow key={archive.id} archive={archive} />)
//       )}
//     </Box>
//   )
// }

// export default function AnalyseInternationaleMouvementsPage() {
//   return (
//     <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>}>
//       <AnalyseInternationaleMouvementsContent />
//     </Suspense>
//   )
// }


'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Chip, CircularProgress, Alert, Collapse,
  Grid,
} from '@mui/material'
import {
  ArrowBackOutlined, ExpandMoreOutlined, ExpandLessOutlined,
  LocationCityOutlined, AccountBalanceOutlined, CalendarMonthOutlined,
} from '@mui/icons-material'
import { archiveAgenceAPI } from '@/lib/api'

interface DocumentArchive {
  id:               number
  type_doc:         string
  type_doc_display: string
  fichier_url:      string
  uploaded_at:      string
}

interface Archive {
  id:                  number
  agence_nom:          string
  agence_code:         string
  produit_nom:         string
  date:                string
  documents:           DocumentArchive[]
  documents_complets:  boolean
  types_requis:        { value: string; label: string }[]
}

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function getExtension(url?: string | null): string {
  if (!url) return ''
  const clean = url.split('?')[0]
  const parts = clean.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

function FilePreview({ url, height = 220 }: { url?: string | null; height?: number }) {
  if (!url) {
    return (
      <Box sx={{ height, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Aucun fichier</Typography>
      </Box>
    )
  }
  const ext = getExtension(url)
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  const isPdf   = ext === 'pdf'

  if (isImage) {
    return (
      <Box sx={{ height, borderRadius: 1.5, overflow: 'hidden', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={url} alt="Aperçu du document" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </Box>
    )
  }
  if (isPdf) {
    return (
      <Box sx={{ height, borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <iframe src={`${url}#toolbar=0`} title="Aperçu PDF" style={{ width: '100%', height: '100%', border: 'none' }} />
      </Box>
    )
  }
  return (
    <Box sx={{ height, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Aperçu indisponible</Typography>
      <Typography component="a" href={url} target="_blank" color="primary" sx={{ fontSize: 12, textDecoration: 'underline' }}>
        Ouvrir dans un nouvel onglet
      </Typography>
    </Box>
  )
}

function ArchiveRow({ archive }: { archive: Archive }) {
  const [open, setOpen] = useState(false)
  const total = archive.types_requis.length
  const done  = archive.documents.length

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mb: 1 }}>
      <Box
        onClick={() => setOpen(!open)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '10px 16px', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, gap: 1, flexWrap: 'wrap' }}
      >
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{archive.agence_nom} ({archive.agence_code})</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {new Date(archive.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={archive.documents_complets ? 'Complet' : `${done}/${total}`}
            color={archive.documents_complets ? 'success' : 'warning'}
            size="small"
            sx={{ fontSize: 11, height: 22 }}
          />
          {open ? <ExpandLessOutlined sx={{ fontSize: 18, color: 'text.secondary' }} /> : <ExpandMoreOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />}
        </Box>
      </Box>

      <Collapse in={open} unmountOnExit>
        <CardContent sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
          <Grid container spacing={1.5}>
            {archive.types_requis.map(({ value, label }) => {
              const doc = archive.documents.find(d => d.type_doc === value)
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={value}>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, mb: 0.5 }}>{label}</Typography>
                  {doc ? (
                    <>
                      <FilePreview url={doc.fichier_url} height={160} />
                      <Typography
                        component="a" href={doc.fichier_url} target="_blank" color="primary"
                        sx={{ fontSize: 11, textDecoration: 'underline', display: 'block', mt: 0.5 }}
                      >
                        Ouvrir en plein écran
                      </Typography>
                    </>
                  ) : (
                    <Box sx={{ height: 160, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Manquant</Typography>
                    </Box>
                  )}
                </Grid>
              )
            })}
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  )
}

function AnalyseInternationaleMouvementsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const villeId  = searchParams.get('ville_id')
  const villeNom = searchParams.get('ville_nom') ?? ''
  const paysNom  = searchParams.get('pays_nom') ?? ''

  const [archives, setArchives] = useState<Archive[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // Niveaux de navigation : agence -> année -> mois
  const [agenceSel, setAgenceSel] = useState<string | null>(null)
  const [anneeSel, setAnneeSel]   = useState<number | null>(null)
  const [moisSel, setMoisSel]     = useState<number | null>(null)

  useEffect(() => {
    if (!villeId) return
    const charger = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await archiveAgenceAPI.internationalParVille({ ville_id: Number(villeId) })
        setArchives(data)
      } catch {
        setError('Impossible de charger les mouvements de cette ville.')
      } finally {
        setLoading(false)
      }
    }
    charger()
  }, [villeId])

  // Niveau 1 : regroupement par agence
  const agencesData = useMemo(() => {
    const map = new Map<string, Archive[]>()
    archives.forEach((a) => {
      if (!map.has(a.agence_code)) map.set(a.agence_code, [])
      map.get(a.agence_code)!.push(a)
    })
    return Array.from(map.entries())
      .map(([agence_code, items]) => ({ agence_code, agence_nom: items[0]?.agence_nom ?? '', items, total: items.length }))
      .sort((a, b) => a.agence_code.localeCompare(b.agence_code))
  }, [archives])

  // Niveau 2 : regroupement par année, pour l'agence sélectionnée
  const anneesData = useMemo(() => {
    if (!agenceSel) return []
    const items = agencesData.find((a) => a.agence_code === agenceSel)?.items ?? []
    const map = new Map<number, Archive[]>()
    items.forEach((a) => {
      const annee = new Date(a.date).getFullYear()
      if (!map.has(annee)) map.set(annee, [])
      map.get(annee)!.push(a)
    })
    return Array.from(map.entries())
      .map(([annee, items]) => ({ annee, items, total: items.length }))
      .sort((a, b) => b.annee - a.annee)
  }, [agencesData, agenceSel])

  // Niveau 3 : regroupement par mois, pour l'année sélectionnée
  const moisData = useMemo(() => {
    if (anneeSel == null) return []
    const items = anneesData.find((a) => a.annee === anneeSel)?.items ?? []
    const map = new Map<number, Archive[]>()
    items.forEach((a) => {
      const mois = new Date(a.date).getMonth() + 1
      if (!map.has(mois)) map.set(mois, [])
      map.get(mois)!.push(a)
    })
    return Array.from(map.entries())
      .map(([mois, items]) => ({ mois, items, total: items.length }))
      .sort((a, b) => a.mois - b.mois)
  }, [anneesData, anneeSel])

  // Niveau 4 : mouvements du mois sélectionné
  const archivesAffichees = useMemo(() => {
    if (moisSel == null) return []
    return moisData.find((m) => m.mois === moisSel)?.items ?? []
  }, [moisData, moisSel])

  const handleRetour = () => {
    if (moisSel != null) { setMoisSel(null); return }
    if (anneeSel != null) { setAnneeSel(null); return }
    if (agenceSel != null) { setAgenceSel(null); return }
    router.push('/conformite/analyse-internationale')
  }

  if (!villeId) {
    return <Alert severity="error">Aucune ville sélectionnée.</Alert>
  }

  const fil = [villeNom, agenceSel, anneeSel, moisSel != null ? MOIS_LABELS[moisSel - 1] : null]
    .filter(Boolean)
    .join(' — ')

  return (
    <Box>
      <Button startIcon={<ArrowBackOutlined />} onClick={handleRetour} sx={{ mb: 2 }}>
        Retour
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <LocationCityOutlined sx={{ color: '#185FA5', fontSize: 24 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Mouvements d'agence — {fil}{paysNom ? `, ${paysNom}` : ''}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vue de supervision (lecture seule) des mouvements d'agence saisis par la conformité de cette ville.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : agenceSel == null ? (
        agencesData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <Typography sx={{ fontSize: 14 }}>Aucun mouvement pour cette ville</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {agencesData.map(({ agence_code, agence_nom, total }) => (
              <Grid key={agence_code} size={{ xs: 6, sm: 4, md: 3 }}>
                <Card
                  sx={{ borderRadius: 3, cursor: 'pointer', transition: 'transform .15s, box-shadow .15s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}
                  onClick={() => setAgenceSel(agence_code)}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <AccountBalanceOutlined sx={{ fontSize: 32, color: '#185FA5', mb: 1 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{agence_nom}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      {agence_code}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {total} mouvement{total !== 1 ? 's' : ''}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      ) : anneeSel == null ? (
        <Grid container spacing={2}>
          {anneesData.map(({ annee, total }) => (
            <Grid key={annee} size={{ xs: 6, sm: 4, md: 3 }}>
              <Card
                sx={{ borderRadius: 3, cursor: 'pointer', transition: 'transform .15s, box-shadow .15s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}
                onClick={() => setAnneeSel(annee)}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <CalendarMonthOutlined sx={{ fontSize: 32, color: '#1e293b', mb: 1 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: 22 }}>{annee}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {total} mouvement{total !== 1 ? 's' : ''}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : moisSel == null ? (
        <Grid container spacing={2}>
          {moisData.map(({ mois, total }) => (
            <Grid key={mois} size={{ xs: 6, sm: 4, md: 3 }}>
              <Card
                sx={{ borderRadius: 3, cursor: 'pointer', transition: 'transform .15s, box-shadow .15s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}
                onClick={() => setMoisSel(mois)}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{MOIS_LABELS[mois - 1]}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {total} mouvement{total !== 1 ? 's' : ''}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : archivesAffichees.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <Typography sx={{ fontSize: 14 }}>Aucun mouvement pour ce mois</Typography>
        </Box>
      ) : (
        archivesAffichees.map((archive) => <ArchiveRow key={archive.id} archive={archive} />)
      )}
    </Box>
    
  )
}

export default function AnalyseInternationaleMouvementsPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>}>
      <AnalyseInternationaleMouvementsContent />
    </Suspense>
  )
}