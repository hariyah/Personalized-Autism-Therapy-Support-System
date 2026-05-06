import axios from 'axios';

const AUTH_TOKEN_KEY = 'auth_token';

const therapyBase = (import.meta.env?.VITE_THERAPY_API_URL || 'http://localhost:7005').trim().replace(/\/+$/, '');

const therapyApi = axios.create({
    baseURL: therapyBase,
});

// Ensure every request uses the current token (handles late login or multiple tabs)
therapyApi.interceptors.request.use((config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export function syncTherapyToken() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
        therapyApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete therapyApi.defaults.headers.common['Authorization'];
    }
}

export default therapyApi;
