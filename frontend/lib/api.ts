import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error handling here
    const message = error.response?.data?.message || 'An network error occurred';
    console.error('API Error:', message);
    return Promise.reject({ ...error, message });
  }
);

export default api;
