import axios from 'axios';

/**
 * AXIOS INTERCEPTOR: The "Traffic Police" for your web requests.
 * 
 * Interceptors allow you to run code BEFORE a request leaves (to add a token)
 * and BEFORE a response reaches your code (to handle errors globally).
 */

const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:5000' : 'https://resumematchai-m9tq.onrender.com';
};

const instance = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json'
    }
});

// 1. REQUEST Interceptor: Automatically injects JWT TOKEN
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        // Every single outgoing request now has the user's "Identity Card"
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 2. RESPONSE Interceptor: Automatically handles AUTH ERRORS
instance.interceptors.response.use((response) => {
    return response;
}, (error) => {
    // If the backend returns 401 (Unathorized), it means the token expired or is fake.
    if (error.response && error.response.status === 401) {
        console.error("Session Expired. Logging out...");
        localStorage.removeItem('token');
        // Redirect to Login if they aren't authorized!
        window.location.href = '/login';
    }
    return Promise.reject(error);
});

export default instance;
