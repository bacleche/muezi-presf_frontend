'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Grid as Grid, TextField, MenuItem, Alert, CircularProgress,
  Divider
} from '@mui/material'
import { SaveOutlined, ArrowBackOutlined } from '@mui/icons-material'
import { userAPI, agenceAPI, paysAPI, villeAPI } from '@/lib/api'

interface Agence { 
  id: number 
  nom: string 
  code: string 
  ville: string 
}

interface Pays {
  id:  number
  nom: string
}

interface Ville {
  id:   number
  nom:  string
  pays: number
}

const ROLES = [
  { value: 'conformite',  label: 'Conformité' },
  { value: 'chef_agence', label: "Chef d'agence" },
  { value: 'chef_produit',label: 'Chef de produit' },
  { value: 'superadmin',  label: 'Super Admin' },
]

export default function NouvelUtilisateurPage() {
  const router = useRouter()
  const [agences, setAgences]   = useState<Agence[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [paysList, setPaysList] = useState<Pays[]>([])
  const [villesList, setVillesList] = useState<Ville[]>([])   // NOUVEAU

  const [form, setForm] = useState({
    email: '', nom: '', prenom: '',
    role: '', password: '', agence: '' as number | '',
    pays: '' as number | '',
    ville: '' as number | '',   // NOUVEAU
  })

  useEffect(() => {
    paysAPI.liste().then(({ data }) => setPaysList(data.results || data))
    villeAPI.liste().then(({ data }) => setVillesList(data.results || data))   // NOUVEAU
    agenceAPI.liste()
      .then(({ data }: { data: { results?: Agence[] } & Agence[] }) => {
        setAgences(data.results ?? data)
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des agences", err)
        setError("Erreur lors du chargement des agences.")
      })
  }, [])

  // NOUVEAU : villes filtrées par le pays sélectionné (une conformité
  // ne doit pouvoir choisir qu'une ville de son propre pays)
  const villesFiltrees = form.pays
    ? villesList.filter(v => v.pays === Number(form.pays))
    : []

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      if (name === 'role' && value !== 'chef_agence') {
        updated.agence = ''
      }
      if (name === 'role' && value !== 'conformite') {
        updated.ville = ''   // NOUVEAU : reset ville si on quitte le rôle conformité
      }
      if (name === 'pays') {
        updated.ville = ''   // NOUVEAU : reset ville si on change de pays
      }
      return updated
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const payload: Record<string, any> = {
        email: form.email,
        nom: form.nom,
        prenom: form.prenom,
        role: form.role,
        password: form.password,
      }

      if (form.role === 'chef_agence') {
        if (form.agence === '') {
          setError("Veuillez sélectionner une agence affiliée.");
          setLoading(false);
          return;
        }
        payload.agence = Number(form.agence);
      } else if (form.role === 'chef_produit' || form.role === 'conformite') {
        if (!form.pays) {
          setError("Veuillez sélectionner un pays.")
          setLoading(false); return;
        }
        payload.pays = Number(form.pays)

        // NOUVEAU : ville optionnelle, uniquement pour conformité
        if (form.role === 'conformite' && form.ville) {
          payload.ville = Number(form.ville)
        }
      }

      await userAPI.creer(payload)
      router.push('/admin/utilisateurs')
    } catch (err: unknown) {
      console.error(err)
      const e = err as { response?: { data?: Record<string, string[] | Record<string, string[]>> } }
      
      if (e.response?.data) {
        const errorData = e.response.data;
        const msgs = Object.entries(errorData).map(([key, val]) => {
          return `${key}: ${Array.isArray(val) ? val.join(' ') : JSON.stringify(val)}`;
        });
        setError(msgs[0] || "Erreur lors de la création de l'utilisateur.");
      } else {
        setError('Erreur lors de la création de l\'utilisateur.');
      }
    } finally {
      setLoading(false)
    }
  }

  const agenceValide = form.role === 'chef_agence' ? form.agence !== '' : true
  
  const valide = 
    !!form.email && 
    !!form.nom && 
    !!form.prenom && 
    !!form.role && 
    !!form.password && 
    form.password.length >= 8 &&
    agenceValide

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button 
          startIcon={<ArrowBackOutlined />} 
          variant="outlined" 
          size="small"
          onClick={() => router.back()}
        >
          Retour
        </Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Nouvel Utilisateur</Typography>
          <Typography variant="body2" color="text.secondary">
            Créer un compte et définir les accès de gestionnaires
          </Typography>
        </Box>
      </Box>

      <Card sx={{ maxWidth: 640, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
            Identité
          </Typography>
          
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Prénom" name="prenom"
                value={form.prenom} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Nom" name="nom"
                value={form.nom} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Email" name="email" type="email"
                value={form.email} onChange={handleChange} required />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
            Accès & Rôle
          </Typography>
          
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth select label="Rôle" name="role"
                value={form.role} onChange={handleChange} required>
                {ROLES.map((r) => (
                  <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {form.role === 'chef_agence' && (
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth select label="Agence affiliée" name="agence"
                  value={form.agence} onChange={handleChange} required>
                  {agences.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      [{a.code}] {a.nom}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {(form.role === 'chef_produit' || form.role === 'conformite') && (
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth select label="Pays" name="pays"
                  value={form.pays} onChange={handleChange} required>
                  {paysList.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {/* NOUVEAU : Ville — visible uniquement pour Conformité, optionnelle */}
            {form.role === 'conformite' && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth select label="Ville (optionnel)" name="ville"
                  value={form.ville} onChange={handleChange}
                  disabled={!form.pays}
                  helperText={
                    !form.pays
                      ? 'Sélectionnez un pays au préalable'
                      : 'Laisser vide pour une conformité principale (vue nationale)'
                  }
                >
                  <MenuItem value="">— Aucune (conformité principale) —</MenuItem>
                  {villesFiltrees.map((v) => (
                    <MenuItem key={v.id} value={v.id}>{v.nom}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Mot de passe" name="password"
                type="password" value={form.password} onChange={handleChange}
                required helperText="Minimum 8 caractères" />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained" 
              size="large"
              onClick={handleSubmit}
              disabled={loading || !valide}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
              sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' }, px: 4 }}
            >
              Créer l'utilisateur
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}