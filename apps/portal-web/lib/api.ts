import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_PORTAL_API_URL || 'http://localhost:4100'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터 - 토큰 자동 추가 (경로별 구분)
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const adminToken = localStorage.getItem('portal_admin_token') || undefined
    const participantToken = localStorage.getItem('portal_token') || undefined

    const url = config.url || ''
    const isAdmin = url.startsWith('/admin')
    const isPortal = url.startsWith('/portal')

    const chosen = isAdmin ? adminToken : isPortal ? participantToken : (participantToken || adminToken)
    if (chosen) {
      config.headers.Authorization = `Bearer ${chosen}`
    }
  }
  return config
})

// 응답 인터셉터 - 401 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // 인증 실패 시 저장된 토큰 제거 후 루트로 이동
        localStorage.removeItem('portal_token')
        localStorage.removeItem('portal_admin_token')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient




