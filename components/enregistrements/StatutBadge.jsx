import { Chip } from '@mui/material'

const config = {
  en_attente: { label: 'En attente', color: 'warning' },
  valide:     { label: 'Validé',     color: 'success' },
  rejete:     { label: 'Rejeté',     color: 'error'   },
}

export default function StatutBadge({ statut }) {
  const { label, color } = config[statut] || { label: statut, color: 'default' }
  return <Chip label={label} color={color} size="small" />
}