'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardActionArea, CardContent,
  Grid, CircularProgress, Alert, Chip,
} from '@mui/material'
import {
  TravelExploreOutlined, AccountBalanceOutlined, SwapHorizOutlined,
  LocationCityOutlined, ChevronRightOutlined, PublicOutlined,
} from '@mui/icons-material'
import { transactionAPI, archiveAgenceAPI } from '@/lib/api'

interface StatVille {
  agence__ville__id:        number
  agence__ville__nom:       string
  agence__ville__pays__id:  number
  agence__ville__pays__nom: string
  total:                    number
  completes?:               number
}

interface VilleAgregee {
  villeId:            number
  villeNom:           string
  paysId:             number
  paysNom:            string
  totalTransactions:  number
  totalArchives:      number
}

interface PaysGroupe {
  paysId:  number
  paysNom: string
  villes:  VilleAgregee[]
}

export default function AnalyseInternationalePage() {
  const router = useRouter()
  const [paysList, setPaysList] = useState<PaysGroupe[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    const charger = async () => {
      setLoading(true)
      setError('')
      try {
        const [tx, arch] = await Promise.all([
          transactionAPI.statsInternational(),
          archiveAgenceAPI.statsInternational(),
        ])

        const txData: StatVille[]   = tx.data
        const archData: StatVille[] = arch.data

        // Fusionne les deux listes par ville_id, même si une ville n'a
        // que des transactions ou que des archives.
        const map = new Map<number, VilleAgregee>()

        txData.forEach((v) => {
          map.set(v.agence__ville__id, {
            villeId: v.agence__ville__id,
            villeNom: v.agence__ville__nom,
            paysId: v.agence__ville__pays__id,
            paysNom: v.agence__ville__pays__nom,
            totalTransactions: v.total,
            totalArchives: 0,
          })
        })

        archData.forEach((v) => {
          const existant = map.get(v.agence__ville__id)
          if (existant) {
            existant.totalArchives = v.total
          } else {
            map.set(v.agence__ville__id, {
              villeId: v.agence__ville__id,
              villeNom: v.agence__ville__nom,
              paysId: v.agence__ville__pays__id,
              paysNom: v.agence__ville__pays__nom,
              totalTransactions: 0,
              totalArchives: v.total,
            })
          }
        })

        // Regroupe par pays
        const parPays = new Map<number, PaysGroupe>()
        Array.from(map.values()).forEach((v) => {
          const groupe = parPays.get(v.paysId)
          if (groupe) {
            groupe.villes.push(v)
          } else {
            parPays.set(v.paysId, { paysId: v.paysId, paysNom: v.paysNom, villes: [v] })
          }
        })

        const liste = Array.from(parPays.values())
          .map((g) => ({ ...g, villes: g.villes.sort((a, b) => a.villeNom.localeCompare(b.villeNom)) }))
          .sort((a, b) => a.paysNom.localeCompare(b.paysNom))

        setPaysList(liste)
      } catch {
        setError('Impossible de charger les statistiques internationales.')
      } finally {
        setLoading(false)
      }
    }
    charger()
  }, [])

  const voirTransactions = (v: VilleAgregee) => {
    const params = new URLSearchParams({
      ville_id: String(v.villeId),
      ville_nom: v.villeNom,
      pays_nom: v.paysNom,
    })
    router.push(`/conformite/analyse-internationale/transactions?${params.toString()}`)
  }

  const voirMouvements = (v: VilleAgregee) => {
    const params = new URLSearchParams({
      ville_id: String(v.villeId),
      ville_nom: v.villeNom,
      pays_nom: v.paysNom,
    })
    router.push(`/conformite/analyse-internationale/mouvements?${params.toString()}`)
  }

  const totalVilles = paysList.reduce((acc, g) => acc + g.villes.length, 0)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <TravelExploreOutlined sx={{ color: '#0D47A1', fontSize: 26 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Analyse Internationale</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vue d'ensemble par pays et par ville des transactions et mouvements d'agence, tous pays du système confondus.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : totalVilles === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <LocationCityOutlined sx={{ fontSize: 40, mb: 1.5, opacity: 0.4 }} />
          <Typography sx={{ fontSize: 14 }}>Aucune donnée disponible</Typography>
        </Box>
      ) : (
        paysList.map((groupe) => (
          <Box key={groupe.paysId} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <PublicOutlined sx={{ fontSize: 20, color: '#0D47A1' }} />
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{groupe.paysNom}</Typography>
            </Box>

            <Grid container spacing={2.5}>
              {groupe.villes.map((v) => (
                <Grid key={v.villeId} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    {/* En-tête de la carte ville */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <LocationCityOutlined sx={{ fontSize: 20, color: '#185FA5' }} />
                      <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{v.villeNom}</Typography>
                    </Box>

                    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2 }}>
                      {/* Sous-carte : Transactions */}
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardActionArea onClick={() => voirTransactions(v)} sx={{ p: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <AccountBalanceOutlined sx={{ fontSize: 22, color: '#0D47A1' }} />
                              <Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Transactions</Typography>
                                <Chip
                                  label={`${v.totalTransactions} transaction${v.totalTransactions !== 1 ? 's' : ''}`}
                                  size="small"
                                  sx={{ mt: 0.5, fontSize: 10, height: 20, bgcolor: '#1e293b', color: 'white' }}
                                />
                              </Box>
                            </Box>
                            <ChevronRightOutlined sx={{ color: 'text.secondary' }} />
                          </Box>
                        </CardActionArea>
                      </Card>

                      {/* Sous-carte : Mouvements d'agence */}
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardActionArea onClick={() => voirMouvements(v)} sx={{ p: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <SwapHorizOutlined sx={{ fontSize: 22, color: '#185FA5' }} />
                              <Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Mouvements d'agence</Typography>
                                <Chip
                                  label={`${v.totalArchives} mouvement${v.totalArchives !== 1 ? 's' : ''}`}
                                  size="small"
                                  sx={{ mt: 0.5, fontSize: 10, height: 20, bgcolor: '#1e293b', color: 'white' }}
                                />
                              </Box>
                            </Box>
                            <ChevronRightOutlined sx={{ color: 'text.secondary' }} />
                          </Box>
                        </CardActionArea>
                      </Card>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
    </Box>
  )
}