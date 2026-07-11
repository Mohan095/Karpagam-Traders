import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization token if it exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch authentication issues
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('admin_token');
      // Only redirect if we are not already on the login page
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Submit Contact Form
  submitContactForm: async (data) => {
    const response = await apiClient.post('/contact', data);
    return response.data;
  },

  // Admin Login
  login: async (username, password) => {
    const response = await apiClient.post('/login', { username, password });
    return response.data;
  },

  // Fetch Message inquiries
  getMessages: async () => {
    const response = await apiClient.get('/messages');
    return response.data;
  },

  // Fetch Overview Stats
  getStats: async () => {
    const response = await apiClient.get('/stats');
    return response.data;
  },
};

export default apiService;
