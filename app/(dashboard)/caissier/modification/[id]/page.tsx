'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  Stack,
  Divider,
} from '@mui/material'

import {
  SaveOutlined,
  ArrowBackOutlined,
  UploadFileOutlined,
  DeleteOutlined,
} from '@mui/icons-material'

import { enregistrementAPI, documentAPI } from '@/lib/api'

interface Document {
  id: number
  type_doc: string
  type_doc_display: string
  fichier: string
}

interface Enregistrement {
  id: number
  nom_client: string
  prenom_client: string
  montant: string
  date_paiement: string
  statut: string
  motif_rejet?: string
  est_modifiable?: boolean
  documents?: Document[]
}

const TYPES_DOCS = [
  { value: 'recu_paiement', label: 'Reçu de paiement' },
  { value: 'bordereau', label: 'Bordereau' },
  { value: 'carte_identite', label: "Carte d'identité" },
]

export default function ModifierEnregistrementPage() {

  const params = useParams()
  const router = useRouter()

  const id = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [enregistrement, setEnregistrement] =
    useState<Enregistrement | null>(null)

  const [form, setForm] = useState({
    nom_client: '',
    prenom_client: '',
    montant: '',
    date_paiement: '',
  })

  const [selectedType, setSelectedType] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // ─────────────────────────────────────────────
  // Charger détail
  // ─────────────────────────────────────────────
  useEffect(() => {
    charger()
  }, [])

  const charger = async () => {
    setLoading(true)

    try {
      const { data } = await enregistrementAPI.detail(id)

      setEnregistrement(data)

      setForm({
        nom_client: data.nom_client,
        prenom_client: data.prenom_client,
        montant: data.montant,
        date_paiement: data.date_paiement,
      })

    } catch {
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────
  // Modifier enregistrement
  // ─────────────────────────────────────────────
  const handleSubmit = async () => {

    setSaving(true)
    setError('')
    setSuccess('')

    try {

      await enregistrementAPI.modifier(id, form)

      setSuccess('Enregistrement modifié avec succès.')

      setTimeout(() => {
        router.push('/caissier/enregistrements')
      }, 1200)

    } catch (err: any) {

      setError(
        err?.response?.data?.detail ||
        'Erreur lors de la modification.'
      )

    } finally {
      setSaving(false)
    }
  }

  // ─────────────────────────────────────────────
  // Upload document
  // ─────────────────────────────────────────────
  const handleUpload = async () => {

    if (!selectedFile || !selectedType) {
      setError('Veuillez sélectionner un type et un fichier.')
      return
    }

    const formData = new FormData()

    formData.append('enregistrement', id.toString())
    formData.append('type_doc', selectedType)
    formData.append('fichier', selectedFile)

    try {

      await documentAPI.uploader(formData)

      setSelectedFile(null)
      setSelectedType('')

      charger()

    } catch (err: any) {

      setError(
        err?.response?.data?.detail ||
        'Erreur upload document.'
      )
    }
  }

  // ─────────────────────────────────────────────
  // Supprimer document
  // ─────────────────────────────────────────────
  const supprimerDocument = async (docId: number) => {

    if (!confirm('Supprimer ce document ?')) return

    try {

      await documentAPI.supprimer(docId)

      charger()

    } catch {
      setError('Erreur suppression document.')
    }
  }

  // ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!enregistrement) {
    return (
      <Alert severity="error">
        Enregistrement introuvable.
      </Alert>
    )
  }

  // ─────────────────────────────────────────────
  // Blocage sécurité
  // ─────────────────────────────────────────────
  if (
    enregistrement.statut !== 'rejete' ||
    !enregistrement.est_modifiable
  ) {
    return (
      <Alert severity="warning">
        Cet enregistrement ne peut plus être modifié.
      </Alert>
    )
  }

  return (
    <Box>

      {/* HEADER */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5">
          Modifier l’enregistrement
        </Typography>

        <Button
          startIcon={<ArrowBackOutlined />}
          onClick={() => router.back()}
        >
          Retour
        </Button>
      </Box>

      {/* MOTIF */}
      {enregistrement.motif_rejet && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Motif du rejet :</strong><br />
          {enregistrement.motif_rejet}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* FORMULAIRE */}
      <Card sx={{ mb: 3 }}>
        <CardContent>

          <Typography variant="h6" sx={{ mb: 3 }}>
            Informations du client
          </Typography>

          <Grid container spacing={2}>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nom"
                value={form.nom_client}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nom_client: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Prénom"
                value={form.prenom_client}
                onChange={(e) =>
                  setForm({
                    ...form,
                    prenom_client: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Montant"
                value={form.montant}
                onChange={(e) =>
                  setForm({
                    ...form,
                    montant: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Date paiement"
                value={form.date_paiement}
                slotProps={{
                    inputLabel: {
                        shrink: true,
                    },
                    }}
              />
            </Grid>

          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={
                saving
                  ? <CircularProgress size={16} />
                  : <SaveOutlined />
              }
              onClick={handleSubmit}
              disabled={saving}
            >
              Enregistrer les modifications
            </Button>
          </Box>

        </CardContent>
      </Card>

      {/* DOCUMENTS */}
      <Card>
        <CardContent>

          <Typography variant="h6" sx={{ mb: 3 }}>
            Documents
          </Typography>

          {/* Upload */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ mb: 3 }}
          >

            <TextField
              select
              label="Type document"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              sx={{ minWidth: 220 }}
            >
              {TYPES_DOCS.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              component="label"
            >
              Choisir fichier
              <input
                hidden
                type="file"
                onChange={(e) =>
                  setSelectedFile(
                    e.target.files?.[0] || null
                  )
                }
              />
            </Button>

            <Button
              variant="contained"
              startIcon={<UploadFileOutlined />}
              onClick={handleUpload}
            >
              Upload
            </Button>

          </Stack>

          {selectedFile && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              {selectedFile.name}
            </Typography>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* Liste docs */}
          <Stack spacing={2}>

            {enregistrement.documents?.map((doc) => (

              <Box
                key={doc.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >

                <Box>
                  <Typography sx={{ fontWeight: 600 }}>
                    {doc.type_doc_display}
                  </Typography>

                  <Button
                    href={doc.fichier}
                    target="_blank"
                    size="small"
                  >
                    Voir fichier
                  </Button>
                </Box>

                <Button
                  color="error"
                  startIcon={<DeleteOutlined />}
                  onClick={() => supprimerDocument(doc.id)}
                >
                  Supprimer
                </Button>

              </Box>

            ))}

          </Stack>

        </CardContent>
      </Card>

    </Box>
  )
}