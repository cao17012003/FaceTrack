// API configuration
const getApiBaseUrl = () => {
  // Use environment variable if available
  if (process.env.REACT_APP_API_URL) {
    // If it's a relative URL (starts with /), use the current origin
    if (process.env.REACT_APP_API_URL.startsWith('/')) {
      return '';
    }
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback for local development
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

// Other configurations
export const APP_NAME = 'Face Checkin AI';
export const DEFAULT_LANGUAGE = 'vi';

// Authentication configuration
export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_DATA_KEY = 'user';

// Face detection configuration
export const FACE_DETECTION_INTERVAL = 100; // milliseconds
export const FACE_MATCH_THRESHOLD = 0.6; // 0.0 to 1.0

// UI configuration
export const SNACKBAR_AUTO_HIDE_DURATION = 3000; // milliseconds
export const DATE_FORMAT = 'DD/MM/YYYY';
export const TIME_FORMAT = 'HH:mm:ss'; 