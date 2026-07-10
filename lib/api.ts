

import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios'


// function getBaseUrl(): string {
//   const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
//   if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:8000/api'
//   return `http://${host}:8000/api`
// }

// export function getWsUrl(): string {
//   const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
//   if (host === 'localhost' || host === '127.0.0.1') return 'ws://localhost:8000'
//   return `ws://${host}:8000`
// }

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  return `https://${host}:8000/api`
}

export function getWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL
  }
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  return `ws://${host}:8000`
}
const api = axios.create({
  // baseURL: process.env.NEXT_PUBLIC_API_URL, // Exemple: http://localhost:8000/api
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
})

// ── Injecter le token JWT ──────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Rafraîchir le token si expiré ─────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post(
          // `${process.env.NEXT_PUBLIC_API_URL}/token/refresh/`, 
          `${getBaseUrl()}/token/refresh/`, 

          { refresh }
        )
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        if (typeof window !== 'undefined') window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)



// ── Types réponses Authentification ─────────────
export interface LoginData {
  email:     string
  password:  string
}

export interface UserBackend {
  id:         number
  email:      string
  nom:        string
  prenom:     string
  role:       'superadmin' | 'conformite' | 'chef_produit' | 'chef_agence' // Harmonisé ici !
  pays:       number | null
  agence:     number | null
  is_active:  boolean
}

export interface VerifyOtpResponse {
  access:  string
  refresh: string
  user:    UserBackend
}

// ── Endpoints d'API ────────────────────────────

export const authAPI = {
  login: (data: LoginData) => 
    api.post('/auth/login/', data),

  verifyOtp: (data: { email: string; otp: string }) => 
    api.post<{ access: string; refresh: string; user: any }>('/auth/verify_otp/', data),
}

export const userAPI = {
  liste: (params?: object) =>
    api.get('/users/', { params }),

  creer: (data: object) =>
    api.post('/users/', data),

  modifier: (id: number, data: object) =>
    api.patch(`/users/${id}/`, data),

  toggle: (id: number) =>
    api.post(`/users/${id}/toggle_actif/`),

  me: () =>
    api.get('/users/me/'),

  changerMotDePasse: (id: number, data: { old_password: string; new_password: string }) =>
    api.post(`/users/${id}/change_password/`, data),
}

// ── NOUVEAU : Endpoints PAYS ───────────────────
export const paysAPI = {
  liste: (params?: object) => 
    api.get('/pays/', { params }),
  
  detail: (id: number) => 
    api.get(`/pays/${id}/`),
  
  creer: (data: object) => 
    api.post('/pays/', data),
  
  modifier: (id: number, data: object) => 
    api.patch(`/pays/${id}/`, data),
  
  supprimer: (id: number) => 
    api.delete(`/pays/${id}/`),
}

// ── NOUVEAU : Endpoints VILLES ─────────────────
export const villeAPI = {
  liste: (params?: object) => 
    api.get('/villes/', { params }),
  
  detail: (id: number) => 
    api.get(`/villes/${id}/`),
  
  creer: (data: object) => 
    api.post('/villes/', data),
  
  modifier: (id: number, data: object) => 
    api.patch(`/villes/${id}/`, data),
  
  supprimer: (id: number) => 
    api.delete(`/villes/${id}/`),
}

export const agenceAPI = {
  liste: (params?: object) =>
    api.get('/agences/', { params }),

  detail: (id: number) =>
    api.get(`/agences/${id}/`),

  creer: (data: object) => 
    api.post('/agences/', data),

  modifier: (id: number, data: object) => 
    api.patch(`/agences/${id}/`, data),
  previewCode: (params: { pays_id: number; ville_id: number; nom: string }) =>
    api.get('/agences/preview-code/', { params }),
}

export const archiveAgenceAPI = {
  stats: () => api.get('/archives/stats/'),
  liste: (params?: object) => api.get('/archives/', { params }),
  telechargerZip: (id: number) => api.get(`/archives/${id}/zip/`, { responseType: 'blob' }),
  uploadDoc: (id: number, formData: FormData) =>
    api.post(`/archives/${id}/documents/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    creer: (data: { agence: number; produit: number; date: string }) =>  // ← ajouter
    api.post('/archives/', data),


  exportZip: (params: { date_debut: string; date_fin: string }) =>
    api.get('/archives/export-zip/', { params, responseType: 'blob' }),
}

export const transactionAPI = {
  liste: (params?: object) => api.get('/transactions/', { params }),
  telechargerZip: (id: number) => api.get(`/transactions/${id}/zip/`, { responseType: 'blob' }),
  stats: (params?: object) => api.get('/transactions/stats/', { params }),
  exportCsv: (params?: object) => api.get('/transactions/export-csv/', { params, responseType: 'blob' }),
   detail:  (id: number)              => api.get(`/transactions/${id}/`),
  valider: (id: number, data: object) => api.post(`/transactions/${id}/valider/`, data),

  creer:     (data: object)                 => api.post('/transactions/', data),
  uploadDoc: (id: number, data: FormData)   => api.post(`/transactions/${id}/documents/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

   exportZip: (params: {
    date_debut: string
    date_fin: string
    agence_id?: number
    client_id?: number
    produit_id?: number
  }) => api.get('/transactions/export-zip/', { params, responseType: 'blob' }),

   afficherDoc: (txId: number, docId: number) => 
    api.get(`/transactions/${txId}/afficher_doc/`, { 
      params: { doc_id: docId }, 
      responseType: 'blob' 
    }),

    // recapClient: (params: { client_id: number; date_debut?: string; date_fin?: string }) =>
    // api.get('/transactions/recap-client/', { params }),
    recapClient: (params: { client_id: number; date_debut?: string; date_fin?: string; produit_id?: number }) =>
  api.get('/transactions/recap-client/', { params }),
}

export const produitAPI = {
  liste: () => api.get('/produits/'),
  creer: (data: object) => api.post('/produits/', data),
  modifier: (id: number, data: object) => api.patch(`/produits/${id}/`, data),
  supprimer: (id: number) => api.delete(`/produits/${id}/`),
}

// ── NOUVEAU : Endpoints pour les Logs d'Audit ──
export const auditAPI = {
  // liste: (params?: object) =>
  //   api.get('/audit-logs/', { params }), // Ajuste l'URL selon ton routage Django backend (ex: /logs/ ou /audit/)
  
  // detail: (id: number) =>
  //   api.get(`/audit-logs/${id}/`),

  liste: (params?: object) => api.get('/audit/', { params }),
  detail: (id: number)     => api.get(`/audit/${id}/`),

}

// À vérifier/ajouter dans ton lib/api.ts
export const clientAPI = {
  liste: (params?: object) => api.get('/clients/', { params }),
  detail: (id: number) => api.get(`/clients/${id}/`), 
  // Modifiez la méthode creer ici
  creer: (data: FormData) => api.post('/clients/', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  modifier: (id: number, data: object) => api.put(`/clients/${id}/`, data),
  
  pieces: (id: number) => api.get(`/clients/${id}/pieces/`),
  
  // URL : POST /api/clients/{id}/add-piece/
 // Dans lib/api.ts
ajouterPiece: (id: number, data: FormData) => api.post(`/clients/${id}/pieces/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' } 
}),

statschefAgence: () => api.get('/clients/stats-chefagence/'),
 renouvelerPiece: (clientId: number, pieceId: number, data: FormData) =>
    api.patch(`/clients/${clientId}/pieces/${pieceId}/renouveler/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
}

export const StatsAPI = {
  /**
   * Appelle l'action @action(detail=False, url_path='stats') 
   * de ton ArchiveAgenceViewSet dans Django
   */
  stats: () => 
    api.get('/archives-agence/stats/'), // Assure-toi que le préfixe correspond à ton router DRF

  statsAdmin: () => api.get('/archives/stats/'),
}
export default api