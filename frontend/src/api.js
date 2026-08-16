import axios from 'axios';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

const API_BASE_URL = isLocalhost 
  ? 'http://127.0.0.1:8000/api'
  : 'https://karpagam-trader-s.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
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
