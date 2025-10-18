import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// 환경 변수 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const REFRESH_ENDPOINT = '/auth/refresh';

// axios 인스턴스 생성
export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 관리 유틸리티
export const tokenManager = {
  getAccessToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  },
  
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  
  getRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  },
  
  clearTokens: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  
  redirectToLogin: () => {
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname;
    const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
    console.log(`[HTTP_CLIENT] Redirecting to login from ${currentPath}`);
    console.log(`  TARGET_URL: ${loginUrl}`);
    window.location.href = loginUrl;
  },
};

// 요청 인터셉터: Authorization 헤더 추가
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 시 refresh 시도
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log(`[HTTP_CLIENT] 401 Unauthorized error occurred`);
      console.log(`  REQUEST_URL: ${originalRequest.url}`);
      console.log(`  HAS_ACCESS_TOKEN: ${!!tokenManager.getAccessToken()}`);
      console.log(`  HAS_REFRESH_TOKEN: ${!!tokenManager.getRefreshToken()}`);
      
      if (isRefreshing) {
        console.log(`[HTTP_CLIENT] Already refreshing, adding to queue`);
        // 이미 refresh 중이면 큐에 넣고 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          const token = tokenManager.getAccessToken();
          if (originalRequest.headers && token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return http(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenManager.getRefreshToken();
      
      if (!refreshToken) {
        console.log(`[HTTP_CLIENT] No refresh token available, but not redirecting (AuthGuard will handle)`);
        processQueue(error, null);
        // tokenManager.redirectToLogin(); // AuthGuard가 처리하도록 비활성화
        return Promise.reject(error);
      }

      try {
        console.log(`[HTTP_CLIENT] Attempting to refresh token`);
        const response = await axios.post(`${API_BASE_URL}${REFRESH_ENDPOINT}`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        console.log(`[HTTP_CLIENT] Token refresh successful`);
        tokenManager.setTokens(accessToken, newRefreshToken);
        
        processQueue(null, accessToken);
        
        // 원래 요청 재시도
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        console.log(`[HTTP_CLIENT] Retrying original request: ${originalRequest.url}`);
        return http(originalRequest);
      } catch (refreshError) {
        console.log(`[HTTP_CLIENT] Token refresh failed, clearing tokens (AuthGuard will handle redirect)`);
        console.error(`[HTTP_CLIENT] Refresh error:`, refreshError);
        processQueue(refreshError as AxiosError, null);
        tokenManager.clearTokens();
        // tokenManager.redirectToLogin(); // AuthGuard가 처리하도록 비활성화
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default http;
