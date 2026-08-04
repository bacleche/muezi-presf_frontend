'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Autocomplete, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, CircularProgress, Alert, Tooltip,
} from '@mui/material'
import {
  LockOutlined, LockOpenOutlined, FolderZipOutlined,
  CalendarMonthOutlined, ArrowForwardOutlined, 
} from '@mui/icons-material'
import { archiveAgenceAPI, agenceAPI } from '@/lib/api'
import type { ClasseurMensuel } from '@/lib/api'

interface Agence {
  id:   number
  nom:  string
  code: string
}

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export default function ClasseursArchivesPage() {
  const [agences, setAgences]         = useState<Agence[]>([])
  const [agenceSel, setAgenceSel]     = useState<Agence | null>(null)
  const [classeurs, setClasseurs]     = useState<ClasseurMensuel[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [downloading, setDownloading] = useState<number | null>(null)
  const router = useRouter() 
  useEffect(() => {
    agenceAPI.liste().then(({ data }) => setAgences(data.results ?? data))
  }, [])

  const charger = useCallback(async (agence: Agence) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await archiveAgenceAPI.classeurs({ agence_id: agence.id })
      setClasseurs(data)
    } catch {
      setError('Erreur lors du chargement des classeurs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (agenceSel) charger(agenceSel)
    else setClasseurs([])
  }, [agenceSel, charger])

  const handleToggle = async (classeur: ClasseurMensuel) => {
    setActionLoading(classeur.id)
    try {
      if (classeur.verrouille) {
        await archiveAgenceAPI.deverrouillerClasseur(classeur.id)
      } else {
        await archiveAgenceAPI.reverrouillerClasseur(classeur.id)
      }
      if (agenceSel) await charger(agenceSel)
    } catch {
      setError("Erreur lors de l'opération.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleTelecharger = async (classeur: ClasseurMensuel) => {
    setDownloading(classeur.id)
    try {
      const dateDebut = `${classeur.annee}-${String(classeur.mois).padStart(2, '0')}-01`
      const dernierJour = new Date(classeur.annee, classeur.mois, 0).getDate()
      const dateFin = `${classeur.annee}-${String(classeur.mois).padStart(2, '0')}-${dernierJour}`

      const { data } = await archiveAgenceAPI.exportZip({
        date_debut: dateDebut,
        date_fin: dateFin,
      })
      const url  = URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `archives_${agenceSel?.code}_${classeur.mois}-${classeur.annee}.zip`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Aucun document à télécharger pour ce mois.')
    } finally {
      setDownloading(null)
    }
  }

  const handleSuivre = (classeur: ClasseurMensuel) => {
    if (!agenceSel) return
    const dateDebut = `${classeur.annee}-${String(classeur.mois).padStart(2, '0')}-01`
    const dernierJour = new Date(classeur.annee, classeur.mois, 0).getDate()
    const dateFin = `${classeur.annee}-${String(classeur.mois).padStart(2, '0')}-${dernierJour}`

    const params = new URLSearchParams({
      agence_id: String(agenceSel.id),
      date_debut: dateDebut,
      date_fin: dateFin,
    })
    router.push(`/conformite/mouvements?${params.toString()}`)
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Classeurs mensuels — Mouvements d'agence
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Chaque mois clos est verrouillé automatiquement. Déverrouillez-le pour modifier ou remplacer un arrêté.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Autocomplete
            options={agences}
            getOptionLabel={(a) => `${a.code} — ${a.nom}`}
            value={agenceSel}
            onChange={(_, v) => setAgenceSel(v)}
            renderInput={(params) => <TextField {...params} label="Sélectionner une agence" size="small" />}
            sx={{ maxWidth: 400 }}
          />
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {!agenceSel && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <CalendarMonthOutlined sx={{ fontSize: 40, mb: 1.5, opacity: 0.4 }} />
          <Typography sx={{ fontSize: 14 }}>Sélectionnez une agence pour voir ses classeurs</Typography>
        </Box>
      )}

      {agenceSel && (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#1e293b' }}>
                {['Mois', 'Statut', 'Déverrouillé par', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : classeurs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Aucun classeur pour cette agence
                  </TableCell>
                </TableRow>
              ) : classeurs.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>
                      {MOIS_LABELS[c.mois - 1]} {c.annee}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={c.verrouille ? <LockOutlined sx={{ fontSize: 14 }} /> : <LockOpenOutlined sx={{ fontSize: 14 }} />}
                      label={c.verrouille ? 'Verrouillé' : 'Déverrouillé'}
                      color={c.verrouille ? 'default' : 'success'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {c.deverrouille_par_nom ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 , flexWrap: 'wrap'}}>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleSuivre(c)}
                            endIcon={<ArrowForwardOutlined sx={{ fontSize: 16 }} />}
                            sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
                        >
                            Suivre
                        </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color={c.verrouille ? 'primary' : 'warning'}
                        onClick={() => handleToggle(c)}
                        disabled={actionLoading === c.id}
                        startIcon={
                          actionLoading === c.id
                            ? <CircularProgress size={14} />
                            : c.verrouille ? <LockOpenOutlined /> : <LockOutlined />
                        }
                      >
                        {c.verrouille ? 'Déverrouiller' : 'Reverrouiller'}
                      </Button>
                      <Tooltip title="Télécharger le ZIP du mois">
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleTelecharger(c)}
                            disabled={downloading === c.id}
                            startIcon={
                              downloading === c.id
                                ? <CircularProgress size={14} />
                                : <FolderZipOutlined />
                            }
                          >
                            ZIP
                          </Button>
                        </span>
                      </Tooltip>
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