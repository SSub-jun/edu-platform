import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || true; // 임시로 mock 모드 활성화

// Axios 인스턴스 생성
export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 관리
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  
  // localStorage에 refresh token 저장
  if (typeof window !== 'undefined') {
    localStorage.setItem('refresh-token', refresh);
  }
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => {
  if (refreshToken) return refreshToken;
  
  // localStorage에서 복구
  if (typeof window !== 'undefined') {
    refreshToken = localStorage.getItem('refresh-token');
  }
  return refreshToken;
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('refresh-token');
  }
};

// Request 인터셉터: Access Token 자동 추가
httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response 인터셉터: 401 시 토큰 갱신 시도
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refresh = getRefreshToken();
      if (refresh) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refresh,
          });
          
          const { accessToken: newAccess, refreshToken: newRefresh } = response.data;
          setTokens(newAccess, newRefresh);
          
          // 원본 요청에 새 토큰 적용 후 재시도
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return httpClient(originalRequest);
        } catch (refreshError) {
          // Refresh 실패 시 로그인 페이지로 리다이렉트
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // Refresh Token이 없으면 로그인 페이지로 리다이렉트
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default httpClient;
