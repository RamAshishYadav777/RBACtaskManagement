import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    withCredentials: true, // send httpOnly cookies on every request
    headers: {
        'x-secret-key': '0a0bef92a00c630d10944b65843c7543abe68241058244357124b2e6bdb5ed27'
    }
});

// silent token refresh — if access token cookie expires, get a new one automatically
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest.url?.includes('/auth/login')
        ) {
            originalRequest._retry = true;

            try {
                // refresh token cookie is sent automatically (withCredentials)
                // server will set a new accessToken cookie in the response
                await api.post('/auth/refresh');

                // retry original request — new cookie is now in the browser
                return api(originalRequest);
            } catch (refreshError) {
                // refresh failed — session is dead, redirect to login
                localStorage.removeItem('user');
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
