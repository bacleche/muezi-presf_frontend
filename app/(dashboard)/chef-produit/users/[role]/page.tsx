'use client'
import { useEffect, useState, use } from 'react'
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, CircularProgress,
  Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, MenuItem
} from '@mui/material'
import { EditOutlined, PowerSettingsNewOutlined, AddCircleOutlined } from '@mui/icons-material'
import { userAPI, agenceAPI, paysAPI } from '@/lib/api'

export default function UserList({ params }: { params: Promise<{ role: string }> }) {
  const { role } = use(params) 
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  
  // Données pour les selects dynamiques
  const [agences, setAgences] = useState<any[]>([])
  const [paysList, setPaysList] = useState<any[]>([])
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', password: '', agence: '', pays: '' })

  const mapping = { 'chefs-agence': 'chef_agence', 'conformite': 'conformite' };
  const roleReel = mapping[role as keyof typeof mapping] || role;

  const load = async () => {
    setLoading(true)
    try {
      const [uRes, aRes, pRes] = await Promise.all([
        userAPI.liste({ role: roleReel }),
        agenceAPI.liste(),
        paysAPI.liste()
      ]);
      setUsers(Array.isArray(uRes.data) ? uRes.data : (uRes.data.results || []));
      setAgences(aRes.data.results || aRes.data || []);
      setPaysList(pRes.data.results || pRes.data || []);
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

 const handleCreate = async () => {
  // Prépare un objet qui ne contient que ce que le Backend attend
  const payload: any = { 
    nom: formData.nom,
    prenom: formData.prenom,
    email: formData.email,
    password: formData.password,
    role: roleReel, // Assure-toi que c'est le "nom technique" (ex: 'chef_agence')
  };

  // Ajout conditionnel uniquement si la valeur est présente
  if (roleReel === 'chef_agence' && formData.agence) {
    payload.agence = Number(formData.agence);
  }
  if (roleReel === 'conformite' && formData.pays) {
    payload.pays = Number(formData.pays);
  }

  try {
    console.log("Envoi du payload :", payload); // Affiche ça dans ta console F12
    await userAPI.creer(payload);
    setOpenModal(false);
    load();
  } catch (err: any) {
    // Affiche l'erreur détaillée dans la console pour comprendre
    console.error("Détails erreur API:", err.response?.data);
    alert("Erreur: " + JSON.stringify(err.response?.data || "Erreur inconnue"));
  }
}

  useEffect(() => { load() }, [role]) 

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Gestion des {roleReel === 'chef_agence' ? 'Chefs d\'agence' : 'Agents Conformité'}
        </Typography>
        <Button variant="contained" startIcon={<AddCircleOutlined />} onClick={() => setOpenModal(true)}>
          Ajouter
        </Button>
      </Box>

      {/* Tableau */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>Aucune donnée.</TableCell></TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.nom} {user.prenom}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Chip label={user.is_active ? 'Actif' : 'Inactif'} size="small" /></TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => userAPI.toggle(user.id).then(load)}><PowerSettingsNewOutlined /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nouvel utilisateur ({roleReel})</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField name="nom" label="Nom" fullWidth size="small" value={formData.nom} onChange={handleInputChange} />
            <TextField name="prenom" label="Prénom" fullWidth size="small" value={formData.prenom} onChange={handleInputChange} />
            <TextField name="email" label="Email" fullWidth size="small" value={formData.email} onChange={handleInputChange} />
            <TextField name="password" label="Mot de passe" type="password" fullWidth size="small" value={formData.password} onChange={handleInputChange} />
            
            {roleReel === 'chef_agence' && (
              <TextField select fullWidth label="Agence" name="agence" value={formData.agence} onChange={handleInputChange}>
                {agences.map(a => <MenuItem key={a.id} value={a.id}>{a.nom}</MenuItem>)}
              </TextField>
            )}
            {roleReel === 'conformite' && (
              <TextField select fullWidth label="Pays" name="pays" value={formData.pays} onChange={handleInputChange}>
                {paysList.map(p => <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>)}
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreate}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}