import axios from 'axios';

const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if (process.env.REACT_APP_API_URL) {
    console.log('Using API URL from environment variable:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Get current hostname and port
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  if (hostname.match(/^192\.168\.\d+\.\d+$/)) {
    return `${protocol}//${hostname}:3001/api`;
  }
  
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('API Request Error:', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Provider APIs
export const createProvider = (data) => api.post('/providers', data);
export const getProviders = () => api.get('/providers');
export const getProvider = (id) => api.get(`/providers/${id}`);

// Availability APIs
export const submitAvailability = (data) => api.post('/availability', data);
export const getAvailability = (providerId) => api.get(`/availability/provider/${providerId}`);

// Appointment APIs
export const getAvailableSlots = (providerId, date) => 
  api.get('/appointments/available', { params: { provider_id: providerId, date } });
export const bookAppointment = (data) => api.post('/appointments', data);
export const getAppointments = (providerId) => api.get(`/appointments/provider/${providerId}`);

export default api;

