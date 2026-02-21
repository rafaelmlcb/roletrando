import axios from 'axios';
import Logger from './logger';

const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        try {
            const url = new URL(import.meta.env.VITE_API_URL);
            return `${url.origin}/api/data`;
        } catch (e) {
            return import.meta.env.VITE_API_URL.replace('/game', '') + '/data';
        }
    }
    const host = window.location.hostname;
    return `http://${host}:8080/api/data`;
}

export const dataApi = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json'
    }
});

dataApi.interceptors.response.use(
    response => response,
    error => {
        Logger.error('API', 'Request failed', error);
        return Promise.reject(error);
    }
);
