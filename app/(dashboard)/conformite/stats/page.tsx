'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent, Button, TextField,
  CircularProgress, Chip, Avatar, Divider, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  LinearProgress, Alert,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  DownloadOutlined, FilterListOutlined, RefreshOutlined,
  CheckCircleOutlined, CancelOutlined, HourglassEmptyOutlined,
  ReceiptOutlined, BadgeOutlined, PeopleOutlined,
  FolderOffOutlined, TrendingUpOutlined, WarningAmberOutlined,
  StorefrontOutlined, InventoryOutlined,
} from '@mui/icons-material'
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar,
  LineChart, Line,
} from 'recharts'
import {archiveAgenceAPI, transactionAPI, agenceAPI, clientAPI, produitAPI } from '@/lib/api'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────



interface ArchiveStat {
  id: number
  agence_nom: string
  produit_nom: string
  date: string
  documents_complets: boolean
  documents: { id: number }[]
  types_requis: { value: string; label: string }[]
}

interface Transaction {
  id: number
  date_transaction: string
  produit: { nom: string } | null
  agence: { nom: string; code: string } | null
  docs_incomplets: number

}

// ─────────────────────────────────────────────────────────────
// PALETTE & CONSTANTS
// ─────────────────────────────────────────────────────────────

const C = {
  blue:   '#1D6FE8',
  green:  '#22C55E',
  amber:  '#F59E0B',
  red:    '#EF4444',
  teal:   '#14B8A6',
  violet: '#8B5CF6',
  slate:  '#64748B',
  indigo: '#6366F1',
}

const PIE_COLORS  = [C.blue, C.green, C.amber, C.red, C.teal, C.violet, C.indigo, C.slate]

const LABELS_PIECE: Record<string, string> = {
  cni:      'CNI',
  passport: 'Passeport',
  niu:      'NIU',
}

// ─────────────────────────────────────────────────────────────
// SOUS-COMPOSANTS
// ─────────────────────────────────────────────────────────────

// KPI Card
function KpiCard({
  icon, label, value, sub, accent, delta,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  accent: string
  delta?: { val: number; label: string }
}) {
  return (
    <Card variant="outlined" sx={{
      borderRadius: 2.5, height: '100%', position: 'relative', overflow: 'hidden',
      borderColor: 'divider',
      '&::before': {
        content: '""', position: 'absolute', top: 0, left: 0,
        width: 4, height: '100%', bgcolor: accent, borderRadius: '3px 0 0 3px',
      },
    }}>
      <CardContent sx={{ pl: 2.5, p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: `${accent}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Box sx={{ color: accent, display: 'flex', fontSize: 20 }}>{icon}</Box>
          </Box>
          {delta && (
            <Chip
              label={`${delta.val > 0 ? '+' : ''}${delta.val} ${delta.label}`}
              size="small"
              sx={{
                fontSize: 10, height: 20, fontWeight: 600,
                bgcolor: delta.val >= 0 ? '#dcfce7' : '#fee2e2',
                color:   delta.val >= 0 ? '#15803d'  : '#b91c1c',
              }}
            />
          )}
        </Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, lineHeight: 1, mb: 0.25, fontFamily: '"DM Sans", sans-serif' }}>
          {value}
        </Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary' }}>{label}</Typography>
        {sub && <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.3 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  )
}

// Section title
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{
      fontSize: 13, fontWeight: 700, color: 'text.secondary',
      textTransform: 'uppercase', letterSpacing: 1, mb: 1.5,
    }}>
      {children}
    </Typography>
  )
}

// Gauge circulaire custom
function GaugeRing({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const data = [{ value: pct }, { value: 100 - pct }]
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ position: 'relative', width: 80, height: 80, mx: 'auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={36}
              startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
              <Cell fill={color} />
              <Cell fill="#f1f5f9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <Box sx={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5, fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{value}</Typography>
    </Box>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [archives,    setArchives]    = useState<ArchiveStat[]>([])
  const [transactions,setTransactions]= useState<Transaction[]>([])
  const [agences,     setAgences]     = useState<{ id: number; nom: string; code: string }[]>([])
  const [clients,     setClients]     = useState<{ id: number }[]>([])
  const [produits,    setProduits]    = useState<{ id: number; nom: string; nom_display: string }[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [exporting,   setExporting]   = useState(false)
  const [filtres,     setFiltres]     = useState({ date_debut: '', date_fin: '' })

  const charger = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [ archRes, txRes, agRes, clRes, prRes] = await Promise.all([
        archiveAgenceAPI.liste().catch(() => ({ data: [] })),
        transactionAPI.liste({ page_size: 500 }).catch(() => ({ data: [] })),
        agenceAPI.liste().catch(() => ({ data: [] })),
        clientAPI.liste().catch(() => ({ data: [] })),
        produitAPI.liste().catch(() => ({ data: [] })),
      ])
      // setEnrStats(enrRes.data)
      setArchives(archRes.data.results ?? archRes.data)
      setTransactions(txRes.data.results ?? txRes.data)
      setAgences(agRes.data.results ?? agRes.data)
      setClients(clRes.data.results ?? clRes.data)
      setProduits(prRes.data.results ?? prRes.data)
    } catch {
      setError('Erreur lors du chargement des statistiques.')
    } finally {
      setLoading(false)
    }
  }, [filtres])

  useEffect(() => { charger() }, [])

 

  // ── Calculs dérivés ────────────────────────────────────────

  // Archives
  const totalArchives      = archives.length
  const archivesCompletes  = archives.filter(a => a.documents_complets).length
  const archivesVides      = archives.filter(a => a.documents.length === 0).length
  const archivesPartielles = totalArchives - archivesCompletes - archivesVides
  const tauxCompletionArchives = totalArchives > 0 ? Math.round(archivesCompletes / totalArchives * 100) : 0

  // Archives par produit (pie)
  const archivesParProduit = produits.map(p => ({
    name: p.nom_display || p.nom,
    value: archives.filter(a => a.produit_nom === p.nom).length,
  })).filter(p => p.value > 0).sort((a, b) => b.value - a.value)

  // Archives par agence (bar)
  const archivesParAgence = agences.map(ag => ({
    name: ag.code || ag.nom.slice(0, 8),
    full: ag.nom,
    total: archives.filter(a => a.agence_nom === ag.nom).length,
    completes: archives.filter(a => a.agence_nom === ag.nom && a.documents_complets).length,
  })).filter(a => a.total > 0).sort((a, b) => b.total - a.total).slice(0, 8)

  // Transactions par produit (pie)
  const txParProduit = produits.map(p => ({
    name: p.nom_display || p.nom,
    value: transactions.filter(t => t.produit?.nom === p.nom).length,
  })).filter(p => p.value > 0)

  // Transactions par mois (line)
  const txParMois: Record<string, number> = {}
  transactions.forEach(t => {
    if (t.date_transaction) {
      const mois = t.date_transaction.slice(0, 7)
      txParMois[mois] = (txParMois[mois] || 0) + 1
    }
  })
  const txMoisData = Object.entries(txParMois)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([mois, total]) => ({
      name: new Date(mois + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      total,
    }))

  // Enregistrements — données pour pie statut
  // const enrStatusPie = enrStats ? [
  //   { name: 'Validés',    value: enrStats.valides,    color: C.green },
  //   { name: 'En attente', value: enrStats.en_attente, color: C.amber },
  //   { name: 'Rejetés',    value: enrStats.rejetes,    color: C.red },
  // ].filter(d => d.value > 0) : []

  // Pièces pie
  // const piecesPie = (transactions?.par_type_piece || []).map((p, i) => ({
  //   name: LABELS_PIECE[p.type_piece] || p.type_piece,
  //   value: p.total,
  //   color: PIE_COLORS[i % PIE_COLORS.length],
  // }))

  // Radial bar caissiers
 

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, px: 1.5, py: 1, boxShadow: 3 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{payload[0].name}</Typography>
          <Typography sx={{ fontSize: 13, color: payload[0].color || C.blue }}>{payload[0].value}</Typography>
        </Box>
      )
    }
    return null
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, fontFamily: '"DM Sans", "Outfit", sans-serif' }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, fontFamily: '"DM Sans", sans-serif' }}>
            Tableau de bord analytique
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>
            Vue consolidée — enregistrements, archives & transactions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Rafraîchir">
            <IconButton size="small" onClick={charger} disabled={loading}>
              <RefreshOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          
        </Box>
      </Box>

      {/* ── Filtres ── */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <FilterListOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
          <TextField
            size="small" label="Date début" type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={filtres.date_debut}
            onChange={e => setFiltres(f => ({ ...f, date_debut: e.target.value }))}
            sx={{ width: 160 }}
          />
          <TextField
            size="small" label="Date fin" type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={filtres.date_fin}
            onChange={e => setFiltres(f => ({ ...f, date_fin: e.target.value }))}
            sx={{ width: 160 }}
          />
          <Button size="small" variant="outlined" onClick={charger}>Appliquer</Button>
          {(filtres.date_debut || filtres.date_fin) && (
            <Button size="small" color="error" variant="text"
              onClick={() => { setFiltres({ date_debut: '', date_fin: '' }); setTimeout(charger, 50) }}>
              Réinitialiser
            </Button>
          )}
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 2 }}>
          <CircularProgress size={36} />
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Chargement des données…</Typography>
        </Box>
      ) : (
        <>
          {/* ════════════════════════════════════════
              SECTION 1 — KPIs GLOBAUX
          ════════════════════════════════════════ */}
          <SectionTitle>Vue globale</SectionTitle>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard icon={<PeopleOutlined />}      label="Clients"            value={clients.length}       accent={C.blue}   />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard icon={<StorefrontOutlined />}  label="Agences"            value={agences.length}       accent={C.teal}   />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard icon={<InventoryOutlined />}   label="Archives totales"   value={totalArchives}        accent={C.indigo} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard icon={<ReceiptOutlined />}     label="Transactions"       value={transactions.length}  accent={C.violet} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard icon={<CheckCircleOutlined />} label="Archives complètes" value={archivesCompletes}
                sub={`${tauxCompletionArchives}% du total`} accent={C.green} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard icon={<FolderOffOutlined />}   label="Archives vides"     value={archivesVides}        accent={C.red}    />
            </Grid>
          </Grid>

          {/* ════════════════════════════════════════
              SECTION 2 — ENREGISTREMENTS
          ════════════════════════════════════════ */}
         

          {/* ════════════════════════════════════════
              SECTION 3 — ARCHIVES
          ════════════════════════════════════════ */}
          <SectionTitle>Archives agence</SectionTitle>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>

            {/* Statut archives — Pie */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5 }}>Statut des archives</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled', mb: 1.5 }}>Complètes / Partielles / Vides</Typography>
                  {totalArchives > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Complètes',  value: archivesCompletes },
                            { name: 'Partielles', value: archivesPartielles },
                            { name: 'Vides',      value: archivesVides },
                          ].filter(d => d.value > 0)}
                          cx="50%" cy="50%" outerRadius={75} innerRadius={42}
                          dataKey="value" paddingAngle={3}
                        >
                          <Cell fill={C.green} />
                          <Cell fill={C.amber} />
                          <Cell fill={C.red} />
                        </Pie>
                        <RTooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8}
                          formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Aucune archive</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Archives par produit — Pie */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5 }}>Archives par produit</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled', mb: 1.5 }}>Distribution par type de produit</Typography>
                  {archivesParProduit.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={archivesParProduit} cx="50%" cy="50%" outerRadius={75}
                          dataKey="value" paddingAngle={3}>
                          {archivesParProduit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <RTooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8}
                          formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Aucune donnée</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Taux complétion par agence — Bar */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5 }}>Archives par agence</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled', mb: 1 }}>Total vs complètes (top 8)</Typography>
                  {archivesParAgence.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={archivesParAgence} barSize={10} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <RTooltip content={({ active, payload, label }) => active && payload?.length ? (
                          <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, px: 1.5, py: 1, boxShadow: 3 }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5 }}>{payload[0]?.payload?.full}</Typography>
                            {payload.map((p: any, i: number) => (
                              <Typography key={i} sx={{ fontSize: 11, color: p.fill }}>{p.name} : {p.value}</Typography>
                            ))}
                          </Box>
                        ) : null} />
                        <Bar dataKey="total"    name="Total"     fill={C.indigo} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="completes" name="Complètes" fill={C.green}  radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Aucune donnée</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Table couverture agences */}
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2 }}>Couverture documentaire par agence</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                          {['Agence', 'Code', 'Total', 'Complètes', 'Partielles', 'Vides', 'Taux'].map(h => (
                            <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', py: 0.75 }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {agences.filter(ag => archives.some(a => a.agence_nom === ag.nom)).map((ag, i) => {
                          const agArch   = archives.filter(a => a.agence_nom === ag.nom)
                          const total    = agArch.length
                          const comp     = agArch.filter(a => a.documents_complets).length
                          const vides    = agArch.filter(a => a.documents.length === 0).length
                          const part     = total - comp - vides
                          const taux     = total > 0 ? Math.round(comp / total * 100) : 0
                          const color    = taux === 100 ? 'success' : taux > 50 ? 'warning' : 'error'
                          return (
                            <TableRow key={i} hover sx={{ '& td': { py: 0.6 } }}>
                              <TableCell><Typography sx={{ fontSize: 12, fontWeight: 600 }}>{ag.nom}</Typography></TableCell>
                              <TableCell><Chip label={ag.code} size="small" sx={{ fontSize: 10, height: 18, bgcolor: '#e0e7ff', color: C.indigo }} /></TableCell>
                              <TableCell><Typography sx={{ fontSize: 12 }}>{total}</Typography></TableCell>
                              <TableCell><Typography sx={{ fontSize: 12, color: C.green, fontWeight: 600 }}>{comp}</Typography></TableCell>
                              <TableCell><Typography sx={{ fontSize: 12, color: C.amber, fontWeight: 600 }}>{part}</Typography></TableCell>
                              <TableCell><Typography sx={{ fontSize: 12, color: C.red, fontWeight: 600 }}>{vides}</Typography></TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress variant="determinate" value={taux} color={color}
                                    sx={{ width: 60, height: 5, borderRadius: 3 }} />
                                  <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{taux}%</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {agences.filter(ag => archives.some(a => a.agence_nom === ag.nom)).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                              <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Aucune agence avec des archives</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ════════════════════════════════════════
              SECTION 4 — TRANSACTIONS
          ════════════════════════════════════════ */}
          <SectionTitle>Transactions</SectionTitle>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>

            {/* Transactions par mois — Line */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <TrendingUpOutlined sx={{ fontSize: 16, color: C.violet }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Évolution mensuelle des transactions</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled', mb: 1.5 }}>6 derniers mois</Typography>
                  {txMoisData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={txMoisData} margin={{ top: 4, right: 16, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <RTooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="total" name="Transactions"
                          stroke={C.violet} strokeWidth={2.5} dot={{ r: 4, fill: C.violet }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                        {transactions.length === 0 ? 'Aucune transaction' : 'Données insuffisantes pour la tendance'}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Transactions par produit — Pie */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5 }}>Transactions par produit</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled', mb: 1.5 }}>Répartition par type</Typography>
                  {txParProduit.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={txParProduit} cx="50%" cy="50%" outerRadius={75}
                          dataKey="value" paddingAngle={3}>
                          {txParProduit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <RTooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8}
                          formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Aucune transaction</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </>
      )}
    </Box>
  )
}