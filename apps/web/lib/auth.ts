import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// 토큰 저장소 (메모리 기반)
class TokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    
    console.log(`[TOKEN_STORAGE] Setting tokens`);
    console.log(`  ACCESS_TOKEN_LENGTH: ${access.length}`);
    console.log(`  REFRESH_TOKEN_LENGTH: ${refresh.length}`);
    
    // 토큰을 모든 저장소에 동기화
    if (typeof window !== 'undefined') {
      // 1. localStorage (http 클라이언트용)
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      // 2. 쿠키 (미들웨어용) - 더 간단하고 확실한 방식
      // 기존 쿠키들 정리
      document.cookie = 'accessToken=; Path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'refreshToken=; Path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      
      // ap-auth 쿠키만 설정
      document.cookie = `ap-auth=${access}; Path=/; Max-Age=3600; SameSite=Lax; Secure=false`;
      
      console.log(`[TOKEN_STORAGE] Tokens synchronized to all storages`);
      console.log(`  LOCALSTORAGE: accessToken, refreshToken set`);
      console.log(`  COOKIE: ap-auth set`);
      console.log(`  COOKIE_VALUE_LENGTH: ${access.length}`);
      console.log(`  CURRENT_COOKIES: ${document.cookie}`);
    }
  }

  getAccessToken(): string | null {
    // 메모리에 없으면 쿠키에서 복구(ap-auth)
    if (!this.accessToken && typeof document !== 'undefined') {
      const cookie = document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('ap-auth='));
      if (cookie) {
        const parts = cookie.split('=');
        this.accessToken = parts[1] || '';
        console.log(`[TOKEN_STORAGE] Recovered token from cookie`);
      }
    }
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return this.refreshToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    
    console.log(`[TOKEN_STORAGE] Clearing all tokens`);
    
    if (typeof window !== 'undefined') {
      // 모든 저장소에서 토큰 제거
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // 쿠키 제거 - 더 확실하게
      document.cookie = 'ap-auth=; Path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'accessToken=; Path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'refreshToken=; Path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      
      console.log(`[TOKEN_STORAGE] All tokens cleared from all storages`);
    }
  }

  isAuthenticated(): boolean {
    const hasMemoryToken = !!this.accessToken;
    let hasCookieToken = false;
    
    if (typeof document !== 'undefined') {
      // 쿠키 기반 미들웨어와 동일 키 사용
      hasCookieToken = document.cookie.includes('ap-auth=');
    }
    
    const isAuth = hasMemoryToken || hasCookieToken;
    
    console.log(`[TOKEN_STORAGE] Authentication check`);
    console.log(`  MEMORY_TOKEN: ${hasMemoryToken}`);
    console.log(`  COOKIE_TOKEN: ${hasCookieToken}`);
    console.log(`  IS_AUTHENTICATED: ${isAuth}`);
    
    return isAuth;
  }
}

// Auth 클라이언트
class AuthClient {
  private api: AxiosInstance;
  private tokenStorage: TokenStorage;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.tokenStorage = new TokenStorage();
    
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request 인터셉터: Access 토큰 자동 추가
    this.api.interceptors.request.use(
      (config) => {
        const token = this.tokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response 인터셉터: 401 에러 처리 및 토큰 갱신
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        console.log('[AUTH_CLIENT] Response error intercepted:', {
          status: error.response?.status,
          url: originalRequest?.url,
          hasRetry: originalRequest?._retry,
          isRefreshing: this.isRefreshing
        });

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // 이미 갱신 중이면 큐에 추가
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.api(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.tokenStorage.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await axios.post(
              `${this.api.defaults.baseURL}/auth/refresh`,
              { refreshToken }
            );

            const { accessToken, refreshToken: newRefreshToken } = response.data;
            this.tokenStorage.setTokens(accessToken, newRefreshToken);

            // 실패한 요청들을 재시도
            this.failedQueue.forEach(({ resolve }) => {
              resolve();
            });
            this.failedQueue = [];

            return this.api(originalRequest);
          } catch (refreshError) {
            // 토큰 갱신 실패 시 로그아웃 처리
            this.failedQueue.forEach(({ reject }) => {
              reject(refreshError);
            });
            this.failedQueue = [];

            console.log(`[AUTH_CLIENT] Token refresh failed, initiating logout`);
            this.logout();
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(username: string, password: string) {
    try {
      console.log(`[AUTH_CLIENT] Login attempt for user: ${username}`);
      
      const response = await this.api.post('/auth/login', {
        username,
        password,
      });

      console.log(`[AUTH_CLIENT] Login response received:`, {
        status: response.status,
        hasAccessToken: !!response.data.accessToken,
        hasRefreshToken: !!response.data.refreshToken,
        hasUser: !!response.data.user,
        userRole: response.data.user?.role
      });

      const { accessToken, refreshToken, user } = response.data;
      this.tokenStorage.setTokens(accessToken, refreshToken);

      console.log(`[AUTH_CLIENT] Login successful for user: ${user.username} (${user.role})`);
      
      return { success: true, user };
    } catch (error) {
      const errorMsg = this.getErrorMessage(error);
      console.error(`[AUTH_CLIENT] Login failed:`, errorMsg);
      console.error(`[AUTH_CLIENT] Error details:`, error);
      
      return { success: false, error: errorMsg };
    }
  }

  async logout() {
    try {
      console.log(`[AUTH_CLIENT] Logout initiated`);
      const token = this.tokenStorage.getAccessToken();
      if (token) {
        console.log(`[AUTH_CLIENT] Sending logout request to server`);
        await this.api.post('/auth/logout');
      } else {
        console.log(`[AUTH_CLIENT] No token found, skipping server logout`);
      }
    } catch (error) {
      console.error('[AUTH_CLIENT] Logout error:', error);
    } finally {
      console.log(`[AUTH_CLIENT] Clearing tokens and redirecting to login`);
      this.tokenStorage.clearTokens();
      
      // 로그인 페이지로 리다이렉트 (로그아웃 시에는 redirect 파라미터 없이)
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        console.log(`[AUTH_CLIENT] Redirecting from ${currentPath} to /login (no redirect param)`);
        window.location.href = '/login';
      }
    }
  }

  async refresh() {
    try {
      const refreshToken = this.tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.api.post('/auth/refresh', {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      this.tokenStorage.setTokens(accessToken, newRefreshToken);

      return { success: true };
    } catch (error) {
      this.logout();
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  isAuthenticated(): boolean {
    return this.tokenStorage.isAuthenticated();
  }

  getApi(): AxiosInstance {
    return this.api;
  }

  private getErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return '알 수 없는 오류가 발생했습니다.';
  }
}

// 싱글톤 인스턴스
export const authClient = new AuthClient();

// 타입 정의
export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    phone: string;
    role: 'admin' | 'instructor' | 'student';
    companyId?: string;
  };
  error?: string;
}

export interface RefreshResponse {
  success: boolean;
  error?: string;
}
