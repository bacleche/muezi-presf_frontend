'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert,
  Button, Card, CardContent, Grid, Tooltip, IconButton,
} from '@mui/material'
import {
  ArrowBackOutlined, VisibilityOutlined, CheckCircleOutlined,
  WarningAmberOutlined, LocationCityOutlined, AccountBalanceOutlined,
  CalendarMonthOutlined, BadgeOutlined,
} from '@mui/icons-material'
import { transactionAPI } from '@/lib/api'

interface Document {
  id:               number
  type_doc:         string
  type_doc_display: string
  uploaded_at:      string
}

interface PieceUtilisee {
  type_piece_display: string
  numero:              string
  // Scan de la pièce d'identité — champ exposé par PieceIdentiteSerializer
  url_fichier?:        string | null
}

interface Transaction {
  id:                   number
  client_nom:           string
  produit_nom:          string
  agence_code:          string
  piece_utilisee_detail: PieceUtilisee | null
  date_transaction:     string
  archive_par_nom:      string
  documents:            Document[]
  documents_complets:   boolean
}

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const DocsBadge = ({ complets }: { complets: boolean }) => (
  <Chip
    size="small"
    icon={complets ? <CheckCircleOutlined sx={{ fontSize: 14 }} /> : <WarningAmberOutlined sx={{ fontSize: 14 }} />}
    label={complets ? 'Complets' : 'Incomplets'}
    color={complets ? 'success' : 'warning'}
  />
)

function AnalyseInternationaleTransactionsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const villeId  = searchParams.get('ville_id')
  const villeNom = searchParams.get('ville_nom') ?? ''
  const paysNom  = searchParams.get('pays_nom') ?? ''

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

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
        const { data } = await transactionAPI.internationalParVille({ ville_id: Number(villeId) })
        setTransactions(data)
      } catch {
        setError('Impossible de charger les transactions de cette ville.')
      } finally {
        setLoading(false)
      }
    }
    charger()
  }, [villeId])

  // Niveau 1 : regroupement par agence
  const agencesData = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    transactions.forEach((tx) => {
      if (!map.has(tx.agence_code)) map.set(tx.agence_code, [])
      map.get(tx.agence_code)!.push(tx)
    })
    return Array.from(map.entries())
      .map(([agence_code, items]) => ({ agence_code, items, total: items.length }))
      .sort((a, b) => a.agence_code.localeCompare(b.agence_code))
  }, [transactions])

  // Niveau 2 : regroupement par année, pour l'agence sélectionnée
  const anneesData = useMemo(() => {
    if (!agenceSel) return []
    const items = agencesData.find((a) => a.agence_code === agenceSel)?.items ?? []
    const map = new Map<number, Transaction[]>()
    items.forEach((tx) => {
      const annee = new Date(tx.date_transaction).getFullYear()
      if (!map.has(annee)) map.set(annee, [])
      map.get(annee)!.push(tx)
    })
    return Array.from(map.entries())
      .map(([annee, items]) => ({ annee, items, total: items.length }))
      .sort((a, b) => b.annee - a.annee)
  }, [agencesData, agenceSel])

  // Niveau 3 : regroupement par mois, pour l'année sélectionnée
  const moisData = useMemo(() => {
    if (anneeSel == null) return []
    const items = anneesData.find((a) => a.annee === anneeSel)?.items ?? []
    const map = new Map<number, Transaction[]>()
    items.forEach((tx) => {
      const mois = new Date(tx.date_transaction).getMonth() + 1
      if (!map.has(mois)) map.set(mois, [])
      map.get(mois)!.push(tx)
    })
    return Array.from(map.entries())
      .map(([mois, items]) => ({ mois, items, total: items.length }))
      .sort((a, b) => a.mois - b.mois)
  }, [anneesData, anneeSel])

  // Niveau 4 : transactions du mois sélectionné
  const transactionsAffichees = useMemo(() => {
    if (moisSel == null) return []
    return moisData.find((m) => m.mois === moisSel)?.items ?? []
  }, [moisData, moisSel])

  const handleViewDoc = async (txId: number, docId: number) => {
    try {
      const response = await transactionAPI.afficherDoc(txId, docId)
      const contentType = (response.headers['content-type'] as string) || 'application/pdf'
      const file = new Blob([response.data], { type: contentType })
      const fileURL = URL.createObjectURL(file)
      window.open(fileURL, '_blank')
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000)
    } catch (error) {
      console.error("Erreur lors de l'ouverture du document", error)
    }
  }

  // Ouvrir le scan/image de la pièce d'identité utilisée par le client
  const handleViewPiece = (fichierUrl?: string | null) => {
    if (!fichierUrl) return
    window.open(fichierUrl, '_blank')
  }

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
        <LocationCityOutlined sx={{ color: '#0D47A1', fontSize: 24 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Transactions — {fil}{paysNom ? `, ${paysNom}` : ''}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vue de supervision (lecture seule) des transactions saisies par la conformité de cette ville.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : agenceSel == null ? (
        agencesData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <Typography sx={{ fontSize: 14 }}>Aucune transaction pour cette ville</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {agencesData.map(({ agence_code, total }) => (
              <Grid key={agence_code} size={{ xs: 6, sm: 4, md: 3 }}>
                <Card
                  sx={{ borderRadius: 3, cursor: 'pointer', transition: 'transform .15s, box-shadow .15s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}
                  onClick={() => setAgenceSel(agence_code)}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <AccountBalanceOutlined sx={{ fontSize: 32, color: '#0D47A1', mb: 1 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{agence_code}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {total} transaction{total !== 1 ? 's' : ''}
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
                    {total} transaction{total !== 1 ? 's' : ''}
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
                    {total} transaction{total !== 1 ? 's' : ''}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#1e293b' }}>
                {['Client', 'Produit', 'Agence', 'Pièce utilisée', 'Date', 'Documents'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {transactionsAffichees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Aucune transaction pour ce mois
                  </TableCell>
                </TableRow>
              ) : transactionsAffichees.map((tx) => (
                <TableRow key={tx.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{tx.client_nom}</Typography>
                    <Typography variant="caption" color="text.secondary">#{tx.id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={tx.produit_nom} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{tx.agence_code}</Typography>
                  </TableCell>
                  <TableCell>
                    {tx.piece_utilisee_detail ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {tx.piece_utilisee_detail.type_piece_display}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tx.piece_utilisee_detail.numero}
                          </Typography>
                        </Box>
                        {tx.piece_utilisee_detail.url_fichier && (
                          <Tooltip title="Voir la pièce d'identité">
                            <IconButton
                              size="small" color="primary"
                              onClick={() => handleViewPiece(tx.piece_utilisee_detail?.url_fichier)}
                            >
                              <BadgeOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(tx.date_transaction).toLocaleDateString('fr-FR')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <DocsBadge complets={tx.documents_complets} />
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {tx.documents.map((doc) => (
                          <Button
                            key={doc.id} size="small" variant="text"
                            startIcon={<VisibilityOutlined sx={{ fontSize: 13 }} />}
                            onClick={() => handleViewDoc(tx.id, doc.id)}
                            sx={{ fontSize: 11, px: 0.5 }}
                          >
                            {doc.type_doc_display}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

export default function AnalyseInternationaleTransactionsPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>}>
      <AnalyseInternationaleTransactionsContent />
    </Suspense>
  )
}