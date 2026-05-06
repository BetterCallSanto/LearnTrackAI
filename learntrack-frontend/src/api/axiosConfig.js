import axios from 'axios';

// Create an Axios instance with the base URL from .env
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we get a 401, the token is likely expired or invalid
      // We don't automatically logout here to avoid circular dependencies,
      // but the AuthContext/components will handle the redirection.
      console.warn("Unauthorized API call. Token may be expired.");
    }
    return Promise.reject(error);
  }
);

export default api;
