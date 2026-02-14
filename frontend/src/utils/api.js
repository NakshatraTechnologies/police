// Centralized API configuration
// In production (built frontend served by backend), API calls go to the same origin
// In development, point to the local backend server
const API_BASE = import.meta.env.PROD
    ? ''  // Same origin in production
    : 'http://localhost:5001';

export default API_BASE;
