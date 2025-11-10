import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

const nodeApi = axios.create({
    baseURL: API_CONFIG.NODE_BACKEND_BASE_URL,
    withCredentials: false,
});

nodeApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

nodeApi.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default nodeApi;

