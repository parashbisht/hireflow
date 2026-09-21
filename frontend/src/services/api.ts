import axios from 'axios';

// All backend requests go through this one Axios instance.
// Centralizing it here means we only configure the base URL,
// headers, and (later) auth token attachment in one place.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
