import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ai-interview-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ai-interview-token');
      localStorage.removeItem('ai-interview-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

// Interview
export const interviewAPI = {
  start: (data) => API.post('/interview/start', data),
  submitAnswer: (data) => API.post('/interview/answer', data),
  complete: (data) => API.post('/interview/complete', data),
  getHistory: () => API.get('/interview/history'),
  getById: (id) => API.get(`/interview/${id}`),
};

// Report
export const reportAPI = {
  getAll: () => API.get('/report'),
  getById: (id) => API.get(`/report/${id}`),
};

export default API;
