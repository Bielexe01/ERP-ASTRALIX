import axios from 'axios'

const rawEnvBaseURL = String(import.meta.env.VITE_API_URL || '').trim()
const normalizedEnvBaseURL = rawEnvBaseURL.replace(/\/+$/g, '')
const isLocalhostUrl = /localhost|127\.0\.0\.1/i.test(normalizedEnvBaseURL)
const isDesktopFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:'
const defaultDesktopApiURL = 'http://localhost:5000/api'
const shouldIgnoreLocalhostEnv = import.meta.env.PROD && isLocalhostUrl && !isDesktopFileProtocol
const envBaseURL = shouldIgnoreLocalhostEnv ? '' : normalizedEnvBaseURL
const fallbackBaseURL = import.meta.env.DEV
  ? defaultDesktopApiURL
  : (isDesktopFileProtocol ? defaultDesktopApiURL : '/api')

if (shouldIgnoreLocalhostEnv) {
  console.warn('VITE_API_URL aponta para localhost em producao. Defina a URL publica da API no Vercel.')
}

const resolvedBaseURL = (envBaseURL || fallbackBaseURL).replace(/\/+$/g, '') + '/'
const api = axios.create({
  baseURL: resolvedBaseURL
})

api.interceptors.request.use(cfg => {
  if (cfg.url && !/^https?:\/\//i.test(cfg.url)) {
    cfg.url = String(cfg.url).replace(/^\/+/, '')
  }
  const t = localStorage.getItem('pdv_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('pdv_token')
      window.location.href = isDesktopFileProtocol ? '#/login' : '/login'
    }
    return Promise.reject(err)
  }
)

export default api
