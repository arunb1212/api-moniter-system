import axios from 'axios'
import { useAuthStore } from '@/store/auth'
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})


// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export interface ApiEndpoint {
  _id: string
  name: string
  url: string
  method: string
  expectedStatus: number
  alertEmail: string
  pingInterval: 1 | 5 | 10 | 15 | 30 | 60
  isActive: boolean
  lastStatus: 'up' | 'down' | 'unknown'
  lastChecked: string | null
  createdAt: string
}

export interface PingRecord {
  _id: string
  apiId: string
  responseTime: number | null
  statusCode: number | null
  status: 'up' | 'down'
  error: string | null
  timestamp: string
}

export interface ApiStats {
  total: number
  upCount: number
  downCount: number
  uptime: string
  avgResponseTime: number
}

export interface NewApiPayload {
  name: string
  url: string
  method: string
  expectedStatus: number
  alertEmail: string
  pingInterval: number
}

export const authService = {
  login: (username: string, password: string) =>
    API.post<{ token: string; username: string; email: string }>('/auth/login', { username, password }).then(r => r.data),
  register: (username: string, email: string, password: string) =>
    API.post<{ token: string; username: string; email: string }>('/auth/register', { username, email, password }).then(r => r.data),
  me: () => API.get<{ username: string; email: string }>('/auth/me').then(r => r.data),
}

export const apiService = {
  list: () => API.get<ApiEndpoint[]>('/apis').then(r => r.data),
  get: (id: string) => API.get<ApiEndpoint>(`/apis/${id}`).then(r => r.data),
  create: (data: NewApiPayload) => API.post<ApiEndpoint>('/apis', data).then(r => r.data),
  delete: (id: string) => API.delete(`/apis/${id}`).then(r => r.data),
  toggle: (id: string, isActive: boolean) => API.patch<ApiEndpoint>(`/apis/${id}`, { isActive }).then(r => r.data),
  pings: (id: string, limit = 60) => API.get<PingRecord[]>(`/apis/${id}/pings?limit=${limit}`).then(r => r.data),
  stats: (id: string) => API.get<ApiStats>(`/apis/${id}/stats`).then(r => r.data),
  manualPing: (id: string) => API.post<PingRecord>(`/apis/${id}/ping`).then(r => r.data),
  updateInterval: (id: string, pingInterval: number) => API.patch<ApiEndpoint>(`/apis/${id}`, { pingInterval }).then(r => r.data),
}
