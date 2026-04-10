import axios from 'axios';

/**
 * API Service - Our Backend Connection
 * It's much cleaner to create a single 'instance' of Axios 
 * instead of importing axios in every component.
 */

const API = axios.create({
    // Replace this with your actual server URL 
    // Usually 'http://127.0.0.1:5000/api'
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000',
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor: Adds AUTH TOKEN to every request automatically
// If the user is logged in, their JWT token will be sent with every call!
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;
