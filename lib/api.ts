import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh/`,
          { refresh }
        )
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Types réponses ─────────────────────────────
interface LoginResponse {
  detail: string
  email:  string
}

interface VerifyOtpResponse {
  access:  string
  refresh: string
  user: {
    id:        number
    email:     string
    nom:       string
    prenom:    string
    role:      'caissier' | 'conformite' | 'superadmin'
    is_active: boolean
  }
}

// interface StatsResponse {
//   total:               number
//   en_attente:          number
//   valides:             number
//   rejetes:             number
//   montant_total_valide: number
//   par_caissier: {
//     caissier__nom:    string
//     caissier__prenom: string
//     total:            number
//     montant:          number
//   }[]
// }

interface StatsResponse {
  total:           number
  en_attente:      number
  valides:         number
  rejetes:         number
  par_caissier: {
    caissier__nom:    string
    caissier__prenom: string
    total:            number
  }[]
  par_type_piece: {   // ✅ ajouté
    type_piece: string
    total:      number
  }[]
  docs_incomplets: number  // ✅ ajouté
}

// ── Auth ──────────────────────────────────────
export const authAPI = {
  login:     (data: { email: string; password: string }) =>
    api.post<LoginResponse>('/auth/login/', data),

  verifyOtp: (data: { email: string; otp: string }) =>
    api.post<VerifyOtpResponse>('/auth/verify_otp/', data),

  refresh:   (data: { refresh: string }) =>
    api.post('/auth/refresh/', data),

  me: () => api.get('/users/me/'),

  resendOtp: (data: { email: string }) =>
    api.post('/auth/resend_otp/', data),
}

// ── Enregistrements ───────────────────────────
export const enregistrementAPI = {
  liste:     (params?: object) =>
    api.get('/enregistrements/', { params }),

  detail:    (id: number) =>
    api.get(`/enregistrements/${id}/`),

  creer:     (data: object) =>
    api.post('/enregistrements/', data),

  modifier:  (id: number, data: object) =>
    api.patch(`/enregistrements/${id}/`, data),

  valider:   (id: number, data: { statut: 'valide' | 'rejete'; motif_rejet?: string }) =>
    api.post(`/enregistrements/${id}/valider/`, data),

  stats:     (params?: object) =>
    api.get<StatsResponse>('/enregistrements/stats/', { params }),

  exportCsv: (params?: object) =>
    api.get('/enregistrements/export_csv/', {
      params,
      responseType: 'blob',
    }),

    telechargerZip: (id: number) =>
    api.get(`/enregistrements/${id}/telecharger_zip/`, {
      responseType: 'blob',
    }),
}

// ── Documents ─────────────────────────────────
export const documentAPI = {
  uploader:  (data: FormData) =>
    api.post('/documents/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  supprimer: (id: number) =>
    api.delete(`/documents/${id}/`),
}

// ── Utilisateurs ──────────────────────────────
// export const userAPI = {
//   liste:    () =>
//     api.get('/users/'),

//   creer:    (data: object) =>
//     api.post('/users/', data),

//   modifier: (id: number, data: object) =>
//     api.patch(`/users/${id}/`, data),

//   toggle:   (id: number) =>
//     api.post(`/users/${id}/toggle_actif/`),

//   me:       () =>
//     api.get('/users/me/'),
// }


// ── Utilisateurs ──────────────────────────────
export const userAPI = {
  liste:    (params?: object) =>        // ← ajout params
    api.get('/users/', { params }),

  creer:    (data: object) =>
    api.post('/users/', data),

  modifier: (id: number, data: object) =>
    api.patch(`/users/${id}/`, data),

  toggle:   (id: number) =>
    api.post(`/users/${id}/toggle_actif/`),

  me:       () =>
    api.get('/users/me/'),

  changerMotDePasse: (id: number, data: { old_password: string; new_password: string }) =>
    api.post(`/users/${id}/change_password/`, data),
}

// ── Agences ───────────────────────────────────
export const agenceAPI = {
  liste:    (params?: object) =>
    api.get('/agences/', { params }),

  detail:   (id: number) =>
    api.get(`/agences/${id}/`),

  creer:    (data: object) =>
    api.post('/agences/', data),

  modifier: (id: number, data: object) =>
    api.patch(`/agences/${id}/`, data),
}
// ── Audit ─────────────────────────────────────
export const auditAPI = {
  liste: (params?: object) =>
    api.get('/audit/', { params }),
}

export default api