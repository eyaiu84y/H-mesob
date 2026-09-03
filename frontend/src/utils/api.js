/**
 * Centralized API Client for Hawassa MESOB
 * Handles all HTTP requests to the backend API with JWT authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get stored JWT token from localStorage
 */
function getToken() {
  try {
    const token = localStorage.getItem('mesob_token');
    return token;
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
}

/**
 * Save JWT token to localStorage
 */
export function saveToken(token) {
  try {
    localStorage.setItem('mesob_token', token);
  } catch (error) {
    console.error('Failed to save token:', error);
  }
}

/**
 * Remove JWT token from localStorage
 */
export function removeToken() {
  try {
    localStorage.removeItem('mesob_token');
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
}

/**
 * Make HTTP request to backend API
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers,
  };
  
  try {
    const response = await fetch(url, config);
    
    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }
    
    // Handle non-2xx responses
    if (!response.ok) {
      // If 401 Unauthorized, remove invalid token
      if (response.status === 401) {
        removeToken();
        // Could also trigger logout here if needed
      }
      
      // Return error data
      return {
        success: false,
        message: data.message || `HTTP ${response.status}: ${response.statusText}`,
        ...data,
      };
    }
    
    return data;
    
  } catch (error) {
    console.error('API request error:', error);
    
    // Network or parsing error
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.',
      error: error.message,
    };
  }
}

/**
 * GET request
 */
export async function get(endpoint) {
  return apiRequest(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function post(endpoint, body) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request
 */
export async function patch(endpoint, body) {
  return apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request
 */
export async function del(endpoint) {
  return apiRequest(endpoint, { method: 'DELETE' });
}

/**
 * API client object with all methods
 */
const api = {
  get,
  post,
  patch,
  delete: del,
  saveToken,
  removeToken,
};

export default api;
