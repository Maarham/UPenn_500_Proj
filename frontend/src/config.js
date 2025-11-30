// API Configuration
// In development: uses proxy (relative paths) - no CORS needed
// In production: uses absolute Render URL - CORS enabled on backend
const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

export const API_BASE_URL = isDevelopment 
  ? ''  // Empty string = relative paths, uses proxy in package.json
  : 'https://sf-safety-portal.onrender.com';  // Render production server

console.log('API Base URL:', API_BASE_URL);

