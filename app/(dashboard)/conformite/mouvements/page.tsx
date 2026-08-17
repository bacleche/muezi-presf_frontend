'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    Box, Typography, Card, CardContent, Button,
    Grid, TextField, Alert, CircularProgress,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem,
    LinearProgress, Collapse, Tooltip, IconButton,
    Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material'

import {
  AccountBalanceOutlined,
  AddOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  DownloadOutlined,
  UploadFileOutlined,
  CheckCircleOutlined,
  RadioButtonUncheckedOutlined,
  CloseOutlined,
  FolderOffOutlined,
  ApartmentOutlined,
  ScienceOutlined,
} from '@mui/icons-material'
import { archiveAgenceAPI, agenceAPI, produitAPI, userAPI, villeAPI } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────

interface Agence {
  id: number
  nom: string
  code: string
}

// NOUVEAU : ville (pour le filtre réservé à la conformité principale)
interface Ville {
  id: number
  nom: string
  pays_nom?: string
}

// NOUVEAU : utilisateur courant — sert à détecter la conformité principale
// (role === 'conformite' && ville === null)
interface CurrentUser {
  id: number
  role: 'superadmin' | 'conformite' | 'chef_produit' | 'chef_agence'
  pays: number | null
  ville: number | null
}

interface Produit {
  id: number
  nom: string
  nom_display: string
  is_active: boolean
}

interface DocumentArchive {
  id: number
  type_doc: string
  type_doc_display: string
  fichier_url: string
  uploade_par: number
  uploaded_at: string
}

interface Archive {
  id: number
  agence: number
  agence_nom: string
  agence_code: string
  agence_ville: number | null
  agence_ville_nom?: string
  produit: number
  produit_nom: string
  date: string
  archive_par: number
  archive_par_nom: string
  documents: DocumentArchive[]
  documents_complets: boolean
  types_requis: { value: string; label: string }[]
  created_at: string
  updated_at: string
}

// ─── Couleurs par produit ──────────────────────────────────────

const PRODUIT_COLORS: Record<string, { bg: string; color: string }> = {
  western_union: { bg: '#E6F1FB', color: '#0C447C' },
  change:        { bg: '#EAF3DE', color: '#27500A' },
  visa:          { bg: '#EEEDFE', color: '#3C3489' },
  momo:          { bg: '#FAEEDA', color: '#633806' },
  airtel_money:  { bg: '#FAECE7', color: '#712B13' },
}

function getProduitStyle(nom: string) {
  return PRODUIT_COLORS[nom] ?? { bg: '#F1EFE8', color: '#444441' }
}

// ─── Statut archive ────────────────────────────────────────────

function getStatut(archive: Archive): { label: string; color: 'success' | 'warning' | 'error' } {
  const total  = archive.types_requis.length
  const done   = archive.documents.length
  if (done === 0)     return { label: 'Vide',    color: 'error'   }
  if (done >= total)  return { label: 'Complet', color: 'success' }
  return { label: `${done}/${total}`, color: 'warning' }
}

// ─── Regroupement Produit → Agence → Archives ──────────────────

interface AgenceGroupe {
  agenceId:   number
  agenceNom:  string
  agenceCode: string
  archives:   Archive[]
}

interface ProduitGroupe {
  produitId:   number
  produitNom:  string
  agences:     AgenceGroupe[]
  totalArchives: number
}

function regrouperParProduitEtAgence(archives: Archive[]): ProduitGroupe[] {
  const parProduit = new Map<number, Map<number, AgenceGroupe>>()

  for (const archive of archives) {
    if (!parProduit.has(archive.produit)) {
      parProduit.set(archive.produit, new Map())
    }
    const parAgence = parProduit.get(archive.produit)!

    if (!parAgence.has(archive.agence)) {
      parAgence.set(archive.agence, {
        agenceId:   archive.agence,
        agenceNom:  archive.agence_nom,
        agenceCode: archive.agence_code,
        archives:   [],
      })
    }
    parAgence.get(archive.agence)!.archives.push(archive)
  }

  const groupes: ProduitGroupe[] = []
  for (const [produitId, parAgence] of parProduit) {
    const agences = Array.from(parAgence.values())
      .sort((a, b) => a.agenceNom.localeCompare(b.agenceNom))

    agences.forEach(a => {
      a.archives.sort((x, y) => y.date.localeCompare(x.date))
    })

    const produitNom = agences[0]?.archives[0]?.produit_nom ?? ''
    const totalArchives = agences.reduce((sum, a) => sum + a.archives.length, 0)

    groupes.push({ produitId, produitNom, agences, totalArchives })
  }

  return groupes.sort((a, b) => a.produitNom.localeCompare(b.produitNom))
}

// ─── Aperçu inline d'un fichier (image, PDF, ou fallback) ──────

function getExtension(url?: string | null): string {
  if (!url) return ''
  const clean = url.split('?')[0]
  const parts = clean.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

function FilePreview({ url, height = 260 }: { url?: string | null; height?: number }) {
  if (!url) {
    return (
      <Box
        sx={{
          height, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Aucun fichier</Typography>
      </Box>
    )
  }

  const ext = getExtension(url)
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  const isPdf   = ext === 'pdf'

  if (isImage) {
    return (
      <Box
        sx={{
          height, borderRadius: 1.5, overflow: 'hidden',
          bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <img
          src={url}
          alt="Aperçu du document"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </Box>
    )
  }

  if (isPdf) {
    return (
      <Box sx={{ height, borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <iframe
          src={`${url}#toolbar=0`}
          title="Aperçu PDF"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        height, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1,
      }}
    >
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Aperçu indisponible</Typography>
      <Typography component="a" href={url} target="_blank" color="primary" sx={{ fontSize: 12, textDecoration: 'underline' }}>
        Ouvrir dans un nouvel onglet
      </Typography>
    </Box>
  )
}

// ─── Carte d'un document ───────────────────────────────────────

function DocSlot({
  typeDoc,
  label,
  document,
  onUpload,
  uploading,
}: {
  typeDoc:   string
  label:     string
  document?: DocumentArchive
  onUpload:  (typeDoc: string, file: File) => void
  uploading: boolean
}) {
  const done = !!document

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(typeDoc, file)
    e.target.value = ''
  }

  return (
    <Box
      sx={{
        border: done ? '1px solid' : '1px dashed',
        borderColor: done ? 'success.light' : 'divider',
        borderRadius: 2,
        p: 1.5,
        bgcolor: done ? 'success.50' : 'background.default',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Typography
        sx={{ fontSize: 13, fontWeight: 500 }}
        color={done ? 'success.dark' : 'text.primary'}
      >
        {label}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {done ? (
          <CheckCircleOutlined sx={{ fontSize: 14, color: 'success.main' }} />
        ) : (
          <RadioButtonUncheckedOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
        )}
        <Typography  sx={{ fontSize: 11}} color={done ? 'success.main' : 'text.secondary'}>
          {done ? 'Téléversé' : 'Manquant'}
        </Typography>
      </Box>

      {done && document ? (
        <Tooltip title="Télécharger ce document">
          <Typography
            component="a"
            href={document.fichier_url}
            target="_blank"
            color="primary"
            sx={{ fontSize: 11 ,textDecoration: 'underline', cursor: 'pointer' }}
          >
            Voir le fichier
          </Typography>
        </Tooltip>
      ) : (
        <label>
          <input
            type="file"
            hidden
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleChange}
            disabled={uploading}
          />
          <Button
            component="span"
            size="small"
            variant="outlined"
            disabled={uploading}
            startIcon={
              uploading
                ? <CircularProgress size={10} />
                : <UploadFileOutlined sx={{ fontSize: 14 }} />
            }
            sx={{ fontSize: 11, py: 0.25, px: 1 }}
          >
            Téléverser
          </Button>
        </label>
      )}
    </Box>
  )
}

// ─── Modal Laboratoire — comparaison matin/soir du même jour ──

function LaboratoireJourModal({
  open,
  archive,
  onClose,
  onRemplace,
}: {
  open:      boolean
  archive:   Archive | null
  onClose:   () => void
  onRemplace: (archiveId: number, docId: number, file: File) => Promise<void>
}) {
  const [remplacant, setRemplacant] = useState<string | null>(null)

  if (!archive) return null

  const docMatin = archive.documents.find(d => d.type_doc === 'arrete_matin')
  const docSoir  = archive.documents.find(d => d.type_doc === 'arrete_soir')

  const handleChange = async (docId: number | undefined, typeDoc: string, file: File) => {
    if (!docId) return
    setRemplacant(typeDoc)
    await onRemplace(archive.id, docId, file)
    setRemplacant(null)
  }

  const renderSlot = (label: string, doc: DocumentArchive | undefined, typeDoc: string) => (
    <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5 }}>{label}</Typography>
      {doc ? (
        <>
          <FilePreview url={doc.fichier_url} />
          <Typography
            component="a"
            href={doc.fichier_url}
            target="_blank"
            color="primary"
            sx={{ fontSize: 11, textDecoration: 'underline', display: 'block', mt: 1, mb: 1.5 }}
          >
            Ouvrir en plein écran
          </Typography>
          <label>
            <input
              type="file"
              hidden
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleChange(doc.id, typeDoc, file)
                e.target.value = ''
              }}
              disabled={remplacant === typeDoc}
            />
            <Button
              component="span"
              size="small"
              variant="outlined"
              fullWidth
              disabled={remplacant === typeDoc}
              startIcon={
                remplacant === typeDoc
                  ? <CircularProgress size={12} />
                  : <UploadFileOutlined sx={{ fontSize: 14 }} />
              }
            >
              Remplacer
            </Button>
          </label>
        </>
      ) : (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          Aucun document Téléversé pour ce créneau
        </Typography>
      )}
    </Box>
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
          Laboratoire — {new Date(archive.date).toLocaleDateString('fr-FR')}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseOutlined /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 2 }}>
          Comparez les arrêtés matin et soir de cette journée. En cas d'incohérence, remplacez le fichier concerné.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          {renderSlot('Arrêté matin', docMatin, 'arrete_matin')}
          {renderSlot('Arrêté soir',  docSoir,  'arrete_soir')}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Ligne d'une archive ──

function ArchiveRow({
  archive,
  onUpload,
  onDownloadZip,
  onOuvrirLaboratoire,
}: {
  archive:        Archive
  onUpload:       (archiveId: number, typeDoc: string, file: File) => void
  onDownloadZip:  (archive: Archive) => void
  onOuvrirLaboratoire:  (archive: Archive) => void
}) {
  const [open, setOpen]           = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  const statut = getStatut(archive)

  const handleUpload = async (typeDoc: string, file: File) => {
    setUploading(typeDoc)
    await onUpload(archive.id, typeDoc, file)
    setUploading(null)
  }

  const total    = archive.types_requis.length
  const done     = archive.documents.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mb: 1 }}>
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: '10px 16px',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
          {new Date(archive.date).toLocaleDateString('fr-FR', {
            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
          })}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={statut.label}
            color={statut.color}
            size="small"
            sx={{ fontSize: 11, height: 22 }}
          />
          <Tooltip title="Ouvrir laboratoire (comparer matin/soir)">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onOuvrirLaboratoire(archive) }}
            >
              <ScienceOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Télécharger ZIP">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onDownloadZip(archive) }}
            >
              <DownloadOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {open ? (
            <ExpandLessOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
          ) : (
            <ExpandMoreOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
          )}
        </Box>
      </Box>

      {!archive.documents_complets && (
        <LinearProgress
          variant="determinate"
          value={progress}
          color={statut.color === 'error' ? 'error' : 'warning'}
          sx={{ height: 2 }}
        />
      )}

      <Collapse in={open} unmountOnExit>
        <CardContent sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
          <Typography
            sx={{ fontSize: 11, color: 'text.secondary', mb: 1, fontWeight: 500, letterSpacing: '0.05em' }}
          >
            Documents requis
          </Typography>
          <Grid container spacing={1}>
            {archive.types_requis.map(({ value, label }) => {
              const doc = archive.documents.find(d => d.type_doc === value)
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={value}>
                  <DocSlot
                    typeDoc={value}
                    label={label}
                    document={doc}
                    onUpload={handleUpload}
                    uploading={uploading === value}
                  />
                </Grid>
              )
            })}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
            <Button
              size="small"
              startIcon={<DownloadOutlined />}
              onClick={() => onDownloadZip(archive)}
            >
              Télécharger ZIP
            </Button>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  )
}

// ─── Bloc agence : son nom + toutes ses archives pour le produit ──

function AgenceBloc({
  agence,
  onUpload,
  onDownloadZip,
  onOuvrirLaboratoire,
}: {
  agence:              AgenceGroupe
  onUpload:            (archiveId: number, typeDoc: string, file: File) => void
  onDownloadZip:       (archive: Archive) => void
  onOuvrirLaboratoire: (archive: Archive) => void
}) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <ApartmentOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
          {agence.agenceNom}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          ({agence.agenceCode})
        </Typography>
        <Chip
          label={`${agence.archives.length} archive${agence.archives.length !== 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 10, height: 20, ml: 0.5 }}
        />
      </Box>

      <Box sx={{ pl: { xs: 0, sm: 3 } }}>
        {agence.archives.map(archive => (
          <ArchiveRow
            key={archive.id}
            archive={archive}
            onUpload={onUpload}
            onDownloadZip={onDownloadZip}
            onOuvrirLaboratoire={onOuvrirLaboratoire}
          />
        ))}
      </Box>
    </Box>
  )
}

// ─── Section accordéon par produit ──────────────────────────────

function ProduitAccordeon({
  groupe,
  onUpload,
  onDownloadZip,
  onOuvrirLaboratoire,
}: {
  groupe:        ProduitGroupe
  onUpload:      (archiveId: number, typeDoc: string, file: File) => void
  onDownloadZip: (archive: Archive) => void
  onOuvrirLaboratoire: (archive: Archive) => void
}) {
  const style = getProduitStyle(groupe.produitNom)

  return (
    <Accordion
      variant="outlined"
      defaultExpanded
      sx={{ borderRadius: 2, mb: 1.5, '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', flexWrap: 'wrap' }}>
          <Chip
            label={groupe.produitNom}
            size="small"
            sx={{
              bgcolor: style.bg,
              color:   style.color,
              fontWeight: 600,
              fontSize: 12,
              height: 26,
            }}
          />
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {groupe.agences.length} agence{groupe.agences.length !== 1 ? 's' : ''}
            {' · '}
            {groupe.totalArchives} archive{groupe.totalArchives !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
        {groupe.agences.map(agence => (
          <AgenceBloc
            key={agence.agenceId}
            agence={agence}
            onUpload={onUpload}
            onDownloadZip={onDownloadZip}
            onOuvrirLaboratoire={onOuvrirLaboratoire}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  )
}

// ─── Modal nouvelle archive ────────────────────────────────────

function NouvelleArchiveModal({
  open,
  agences,
  produits,
  onClose,
  onCreate,
}: {
  open:     boolean
  agences:  Agence[]
  produits: Produit[]
  onClose:  () => void
  onCreate: (data: { agence: number; produit: number; date: string }) => Promise<void>
}) {
  const [agenceId,  setAgenceId]  = useState<number | ''>('')
  const [produitId, setProduitId] = useState<number | ''>('')
  const [date,      setDate]      = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const produitNom = produits.find(p => p.id === produitId)?.nom ?? ''

  const TYPES_PREVIEW: Record<string, string[]> = {
    western_union: ['Réconciliation','API','Arrêté de caisse (matin)','Arrêté de caisse (soir)','Journal de transaction'],
    change:        ['Mouvement de caisse','Arrêté de caisse (matin)','Arrêté de caisse (soir)','Journal de transaction'],
    visa:          ['Arrêté (matin)','Arrêté (soir)','Fiche de souscription','Fiche de réclamation'],
    momo:          ['Arrêté de caisse (matin)','Arrêté de caisse (soir)'],
    airtel_money:  ['Arrêté (matin)','Arrêté (soir)'],
  }

  const handleSubmit = async () => {
    if (!agenceId || !produitId || !date) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onCreate({ agence: agenceId as number, produit: produitId as number, date })
      setAgenceId(''); setProduitId(''); setDate('')
      onClose()
    } catch (err: any) {
    const dataErr    = err?.response?.data
    const messageErr = typeof dataErr === 'string' ? dataErr : JSON.stringify(dataErr ?? {})

    // NOUVEAU : message dédié quand le classeur mensuel de la date choisie est verrouillé
    if (err?.response?.status === 403 || messageErr.toLowerCase().includes('classeur') || messageErr.toLowerCase().includes('verrou')) {
      setError('Ce mois est clôturé (classeur verrouillé). Veuillez déverrouiller le classeur mensuel correspondant.')
    } else {
      setError('Erreur lors de la création. Veuillez réessayer.')
    }
  } finally {
    setLoading(false)
  }
}

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 16, fontWeight: 500 }}>Nouvelle archive</Typography>
        <IconButton size="small" onClick={onClose}><CloseOutlined /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <FormControl fullWidth size="small">
          <InputLabel>Agence</InputLabel>
          <Select
            value={agenceId}
            label="Agence"
            onChange={e => setAgenceId(e.target.value as number)}
          >
            {agences.map(a => (
              <MenuItem key={a.id} value={a.id}>{a.nom} ({a.code})</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Produit</InputLabel>
          <Select
            value={produitId}
            label="Produit"
            onChange={e => setProduitId(e.target.value as number)}
          >
            {produits.filter(p => p.is_active).map(p => (
              <MenuItem key={p.id} value={p.id}>{p.nom_display}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Date"
          type="date"
          size="small"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          value={date}
          onChange={e => setDate(e.target.value)}
        />

        {produitNom && TYPES_PREVIEW[produitNom] && (
          <Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.75 }}>
              Documents requis pour ce produit
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {TYPES_PREVIEW[produitNom].map(label => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <RadioButtonUncheckedOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Créer l'archive
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Modal Laboratoire — comparaison entre deux dates ──────────

interface ComparaisonResult {
  archive_id:   number
  date:         string
  arrete_matin: DocumentArchive | null
  arrete_soir:  DocumentArchive | null
}

function LaboratoireComparaisonModal({
  open,
  agences,
  produits,
  onClose,
  onComparer,
  onRemplace,
}: {
  open:       boolean
  agences:    Agence[]
  produits:   Produit[]
  onClose:    () => void
  onComparer: (params: { agence_id: number; produit_id: number; date1: string; date2: string }) =>
                Promise<{ date1: ComparaisonResult | null; date2: ComparaisonResult | null }>
  onRemplace: (archiveId: number, docId: number, file: File) => Promise<void>
}) {
  const [agenceId,  setAgenceId]  = useState<number | ''>('')
  const [produitId, setProduitId] = useState<number | ''>('')
  const [date1,     setDate1]     = useState('')
  const [date2,     setDate2]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [resultat,  setResultat]  = useState<{ date1: ComparaisonResult | null; date2: ComparaisonResult | null } | null>(null)
  const [remplacant, setRemplacant] = useState<string | null>(null)

  const reset = () => {
    setAgenceId(''); setProduitId(''); setDate1(''); setDate2('')
    setResultat(null); setError('')
  }

  const handleFermer = () => { reset(); onClose() }

  const handleComparer = async () => {
    if (!agenceId || !produitId || !date1 || !date2) {
      setError('Agence, produit et les deux dates sont obligatoires.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await onComparer({
        agence_id: agenceId as number,
        produit_id: produitId as number,
        date1, date2,
      })
      setResultat(res)
    } catch {
      setError('Erreur lors de la comparaison.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemplace = async (
    archiveId: number | undefined,
    docId: number | undefined,
    slotKey: string,
    file: File
  ) => {
    if (!archiveId || !docId) return
    setRemplacant(slotKey)
    await onRemplace(archiveId, docId, file)
    setRemplacant(null)
    if (agenceId && produitId && date1 && date2) {
      const res = await onComparer({ agence_id: agenceId as number, produit_id: produitId as number, date1, date2 })
      setResultat(res)
    }
  }

  const renderColonne = (label: string, data: ComparaisonResult | null, slotPrefix: string) => (
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>{label}</Typography>
      {!data ? (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Aucune archive pour cette date</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {(['arrete_matin', 'arrete_soir'] as const).map((champ) => {
            const doc = data[champ]
            const slotKey = `${slotPrefix}-${champ}`
            return (
              <Box key={champ} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 500, mb: 1 }}>
                  {champ === 'arrete_matin' ? 'Arrêté matin' : 'Arrêté soir'}
                </Typography>
                {doc ? (
                  <>
                    <FilePreview url={doc.fichier_url} height={200} />
                    <Typography
                      component="a" href={doc.fichier_url} target="_blank" color="primary"
                      sx={{ fontSize: 11, textDecoration: 'underline', display: 'block', mt: 1, mb: 1 }}
                    >
                      Ouvrir en plein écran
                    </Typography>
                    <label>
                      <input
                        type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleRemplace(data.archive_id, doc.id, slotKey, file)
                          e.target.value = ''
                        }}
                        disabled={remplacant === slotKey}
                      />
                      <Button
                        component="span" size="small" variant="outlined" fullWidth
                        disabled={remplacant === slotKey}
                        startIcon={remplacant === slotKey ? <CircularProgress size={12} /> : <UploadFileOutlined sx={{ fontSize: 13 }} />}
                        sx={{ fontSize: 11 }}
                      >
                        Remplacer
                      </Button>
                    </label>
                  </>
                ) : (
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Manquant</Typography>
                )}
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )

  return (
    <Dialog open={open} onClose={handleFermer} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 16, fontWeight: 500 }}>Laboratoire — Comparaison entre deux dates</Typography>
        <IconButton size="small" onClick={handleFermer}><CloseOutlined /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={1.5} sx={{ mb: resultat ? 3 : 0 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Agence</InputLabel>
              <Select value={agenceId} label="Agence" onChange={e => setAgenceId(e.target.value as number)}>
                {agences.map(a => <MenuItem key={a.id} value={a.id}>{a.nom} ({a.code})</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Produit</InputLabel>
              <Select value={produitId} label="Produit" onChange={e => setProduitId(e.target.value as number)}>
                {produits.map(p => <MenuItem key={p.id} value={p.id}>{p.nom_display}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="Date 1" type="date" size="small" fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={date1} onChange={e => setDate1(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="Date 2" type="date" size="small" fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={date2} onChange={e => setDate2(e.target.value)}
            />
          </Grid>
        </Grid>

        {resultat && (
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            {renderColonne(new Date(date1).toLocaleDateString('fr-FR'), resultat.date1, 'd1')}
            {renderColonne(new Date(date2).toLocaleDateString('fr-FR'), resultat.date2, 'd2')}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleFermer}>Fermer</Button>
        <Button
          variant="contained"
          onClick={handleComparer}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <ScienceOutlined />}
        >
          Comparer
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Page principale ───────────────────────────────────────────

function MouvementsAgencesContent() {
  const searchParams = useSearchParams()

  const [archives,     setArchives]     = useState<Archive[]>([])
  const [agences,      setAgences]      = useState<Agence[]>([])
  const [produits,     setProduits]     = useState<Produit[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [modalOpen,    setModalOpen]    = useState(false)

  // NOUVEAU : utilisateur courant + villes, pour le filtre "Ville"
  // réservé à la conformité principale (role === 'conformite' && !ville)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [villes,      setVilles]      = useState<Ville[]>([])
  const estConformitePrincipale =
    currentUser?.role === 'conformite' && !currentUser?.ville

  // NOUVEAU : contexte "classeur"
  const [contexteClasseur, setContexteClasseur] = useState<string | null>(null)

  // Filtres
  const [filtreAgence,  setFiltreAgence]  = useState('')
  const [filtreProduit, setFiltreProduit] = useState('')
  const [filtreStatut,  setFiltreStatut]  = useState('')
  const [filtreDebut,   setFiltreDebut]   = useState('')
  const [filtreFin,     setFiltreFin]     = useState('')
  const [filtreVille,   setFiltreVille]   = useState('')

  const [labJourOpen,    setLabJourOpen]    = useState(false)
  const [labJourArchive, setLabJourArchive] = useState<Archive | null>(null)

  const [labComparaisonOpen, setLabComparaisonOpen] = useState(false)

  // ── Chargement initial ─────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [archRes, agRes, prRes, meRes] = await Promise.all([
          archiveAgenceAPI.liste(),
          agenceAPI.liste(),
          produitAPI.liste(),
          userAPI.me(),
        ])
        setArchives(archRes.data.results ?? archRes.data)
        setAgences(agRes.data.results   ?? agRes.data)
        setProduits(prRes.data.results  ?? prRes.data)
        setCurrentUser(meRes.data)

        // Filtre "Ville" réservé à la conformité principale : on ne
        // charge la liste des villes (toutes villes, tous pays) que
        // pour ce profil.
        if (meRes.data?.role === 'conformite' && !meRes.data?.ville) {
          const villesRes = await villeAPI.liste()
          setVilles(villesRes.data.results ?? villesRes.data)
        }
      } catch {
        setError('Impossible de charger les données.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // NOUVEAU : préremplir les filtres depuis l'URL (venant d'un classeur)
  useEffect(() => {
    const agenceId = searchParams.get('agence_id')
    const dd = searchParams.get('date_debut')
    const df = searchParams.get('date_fin')
    if (agenceId) setFiltreAgence(agenceId)
    if (dd) setFiltreDebut(dd)
    if (df) setFiltreFin(df)

    if (agenceId && dd && agences.length > 0) {
      const ag = agences.find(a => String(a.id) === agenceId)
      if (ag) {
        const moisAnnee = new Date(dd + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        setContexteClasseur(`${ag.code} — ${moisAnnee}`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, agences])

  // ── Filtrage local ─────────────────────────────────────────
  const archivesFiltrees = archives.filter(a => {
    if (filtreAgence  && String(a.agence)  !== filtreAgence)  return false
    if (filtreProduit && String(a.produit) !== filtreProduit) return false
    if (filtreDebut   && a.date < filtreDebut)                return false
    if (filtreFin     && a.date > filtreFin)                  return false
    // NOUVEAU : filtre ville, actif uniquement pour la conformité principale
    if (estConformitePrincipale && filtreVille && String(a.agence_ville) !== filtreVille) return false
    if (filtreStatut) {
      const st = getStatut(a)
      if (filtreStatut === 'complet' && st.color !== 'success') return false
      if (filtreStatut === 'partiel' && st.color !== 'warning') return false
      if (filtreStatut === 'vide'    && st.color !== 'error')   return false
    }
    return true
  })

  // ── Regroupement Produit → Agence → Archives (toutes dates) ──
  const groupes = useMemo(
    () => regrouperParProduitEtAgence(archivesFiltrees),
    [archivesFiltrees]
  )

  // ── Créer une archive ──────────────────────────────────────
  const handleCreate = async (data: { agence: number; produit: number; date: string }) => {
    const res = await archiveAgenceAPI.creer(data)
    setArchives(prev => [res.data, ...prev])
  }

  // ── Téléverser un document ───────────────────────────────────
  const handleUpload = async (archiveId: number, typeDoc: string, file: File) => {
    const formData = new FormData()
    formData.append('type_doc', typeDoc)
    formData.append('fichier',  file)

    const token = localStorage.getItem('access_token')
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      formData.append('uploade_par', String(payload.user_id))
    }

    try {
      const res = await archiveAgenceAPI.uploadDoc(archiveId, formData)
      setArchives(prev =>
        prev.map(a =>
          a.id === archiveId
            ? {
                ...a,
                documents: [...a.documents, res.data],
                documents_complets:
                  a.documents.length + 1 >= a.types_requis.length,
              }
            : a
        )
      )
    } catch (err: any) {
      console.error('Upload échoué', err.response?.data)
      if (err.response?.status === 403) {
        setError("Ce classeur mensuel est verrouillé. Déverrouillez-le pour Téléverser un document.")
      }
    }
  }

  // ── Télécharger ZIP ────────────────────────────────────────
  const handleDownloadZip = async (archive: Archive) => {
    try {
      const res  = await archiveAgenceAPI.telechargerZip(archive.id)
      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href  = url
      const fileName = `${archive.produit_nom}_${archive.date}.zip`
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      console.error('Échec du téléchargement ZIP')
    }
  }

  const handleOuvrirLaboratoire = (archive: Archive) => {
    setLabJourArchive(archive)
    setLabJourOpen(true)
  }

  // ── Remplacement d'un document (partagé entre les deux modals) ──
  const handleRemplacerDocument = async (archiveId: number, docId: number, file: File) => {
    const formData = new FormData()
    formData.append('fichier', file)
    try {
      const res = await archiveAgenceAPI.remplacerDocument(archiveId, docId, formData)
      setArchives(prev =>
        prev.map(a =>
          a.id === archiveId
            ? { ...a, documents: a.documents.map(d => d.id === docId ? res.data : d) }
            : a
        )
      )
      setLabJourArchive(prev =>
        prev && prev.id === archiveId
          ? { ...prev, documents: prev.documents.map(d => d.id === docId ? res.data : d) }
          : prev
      )
    } catch (err: any) {
      console.error('Remplacement échoué', err.response?.data)
      setError(
        err.response?.status === 403
          ? "Ce classeur mensuel est verrouillé. Déverrouillez-le pour remplacer un document."
          : 'Erreur lors du remplacement du document.'
      )
    }
  }

  const handleComparer = async (params: { agence_id: number; produit_id: number; date1: string; date2: string }) => {
    const res = await archiveAgenceAPI.comparer(params)
    return res.data
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* En-tête */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2.5,
          flexWrap: 'wrap',
          gap: 1.5
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceOutlined sx={{ color: '#185FA5', fontSize: 26 }} />
            <Typography  sx={{ fontSize: 20, fontWeight: 500 }}>
              Mouvements agences
            </Typography>
          </Box>
          {/* NOUVEAU : bandeau de contexte quand on arrive depuis un classeur */}
          {contexteClasseur && (
            <Chip
              label={`Classeur : ${contexteClasseur}`}
              size="small"
              sx={{ mt: 1, bgcolor: '#1e293b', color: 'white', fontWeight: 600 }}
              onDelete={() => setContexteClasseur(null)}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ScienceOutlined />}
            onClick={() => setLabComparaisonOpen(true)}
          >
            Ouvrir laboratoire
          </Button>
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setModalOpen(true)}>
            Nouvelle archive
          </Button>
        </Box>
      </Box>

      {/* Filtres */}
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 2.5 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, md: 2 }} >
              <FormControl fullWidth size="small">
                <InputLabel>Agence</InputLabel>
                <Select
                  value={filtreAgence}
                  label="Agence"
                  onChange={e => setFiltreAgence(e.target.value)}
                >
                  <MenuItem value="">Toutes</MenuItem>
                  {agences.map(a => (
                    <MenuItem key={a.id} value={String(a.id)}>{a.nom}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Produit</InputLabel>
                <Select
                  value={filtreProduit}
                  label="Produit"
                  onChange={e => setFiltreProduit(e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  {produits.map(p => (
                    <MenuItem key={p.id} value={String(p.id)}>{p.nom_display}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <TextField
                label="Du"
                type="date"
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={filtreDebut}
                onChange={e => setFiltreDebut(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <TextField
                label="Au"
                type="date"
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={filtreFin}
                onChange={e => setFiltreFin(e.target.value)}
              />
            </Grid>

            {/* NOUVEAU : filtre Ville, réservé à la conformité principale
                (toutes villes de tous les pays de la plateforme) */}
            {estConformitePrincipale && (
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Ville</InputLabel>
                  <Select
                    value={filtreVille}
                    label="Ville"
                    onChange={e => setFiltreVille(e.target.value)}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {villes.map(v => (
                      <MenuItem key={v.id} value={String(v.id)}>
                        {v.nom}{v.pays_nom ? ` (${v.pays_nom})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filtreStatut}
                  label="Statut"
                  onChange={e => setFiltreStatut(e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="complet">Complet</MenuItem>
                  <MenuItem value="partiel">Partiel</MenuItem>
                  <MenuItem value="vide">Vide</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                size="small"
                onClick={() => {
                  setFiltreAgence('')
                  setFiltreProduit('')
                  setFiltreStatut('')
                  setFiltreDebut('')
                  setFiltreFin('')
                  setFiltreVille('')
                  setContexteClasseur(null)
                }}
              >
                Réinitialiser
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Compteur */}
      <Typography sx={{ fontSize: 14, mb: 2, color: 'text.secondary' }}>
        {archivesFiltrees.length} archive{archivesFiltrees.length !== 1 ? 's' : ''}
        {' · '}
        {groupes.length} produit{groupes.length !== 1 ? 's' : ''}
      </Typography>

      {/* Contenu */}
      {loading && <LinearProgress />}

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {!loading && archivesFiltrees.length === 0 && (
        <Box sx={{textAlign: 'center', py: 6, color: 'text.secondary'}}>
          <FolderOffOutlined sx={{ fontSize: 40, mb: 1.5, opacity: 0.4 }} />
          <Typography sx={{ fontSize: 14 }}>Aucune archive trouvée</Typography>
        </Box>
      )}

      {groupes.map(groupe => (
        <ProduitAccordeon
          key={groupe.produitId}
          groupe={groupe}
          onUpload={handleUpload}
          onDownloadZip={handleDownloadZip}
          onOuvrirLaboratoire={handleOuvrirLaboratoire}
        />
      ))}

      {/* Modal création */}
      <NouvelleArchiveModal
        open={modalOpen}
        agences={agences}
        produits={produits}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />

      <LaboratoireJourModal
        open={labJourOpen}
        archive={labJourArchive}
        onClose={() => { setLabJourOpen(false); setLabJourArchive(null) }}
        onRemplace={handleRemplacerDocument}
      />

      <LaboratoireComparaisonModal
        open={labComparaisonOpen}
        agences={agences}
        produits={produits}
        onClose={() => setLabComparaisonOpen(false)}
        onComparer={handleComparer}
        onRemplace={handleRemplacerDocument}
      />

    </Box>
  )
}

export default function MouvementsAgencesPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>}>
      <MouvementsAgencesContent />
    </Suspense>
  )
}