import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true, // Enable cookies for httpOnly refresh token and CSRF
});

// In-memory access token (not stored in localStorage for security)
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
    accessToken = token;
}

export function getAccessToken(): string | null {
    return accessToken;
}

// Helper to read CSRF token from cookie
function getCsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/csrf_token=([^;]+)/);
    return match ? match[1] : null;
}

// Fetch CSRF token from server
export async function fetchCsrfToken(): Promise<string | null> {
    try {
        const res = await axios.get(`${API_BASE}/csrf-token`, { withCredentials: true });
        return res.data.data?.csrfToken || null;
    } catch {
        return null;
    }
}

// Attach JWT access token and CSRF token to every request
api.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // Add CSRF token for state-changing requests
    const method = config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const csrfToken = getCsrfTokenFromCookie();
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }
    }
    
    return config;
});

// Track if we're currently refreshing to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
}

// Handle 401 -> try refresh, then retry or redirect to login
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Don't intercept refresh/login/register requests
        if (
            error.response?.status !== 401 ||
            originalRequest._retry ||
            originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/register') ||
            originalRequest.url?.includes('/auth/refresh')
        ) {
            // If it's a 401 on a non-auth request and we've exhausted retries, redirect
            if (error.response?.status === 401 && originalRequest._retry && typeof window !== 'undefined') {
                accessToken = null;
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            }).catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            // Refresh token is sent automatically via httpOnly cookie
            const res = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
            const { accessToken: newAccessToken } = res.data.data;

            accessToken = newAccessToken;

            processQueue(null, newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            accessToken = null;
            if (typeof window !== 'undefined') {
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.error || error.response?.data?.message || error.message;
    }
    if (error instanceof Error) return error.message;
    return 'Une erreur est survenue';
}

export default api;
