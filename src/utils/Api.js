// ============================================
// src/utils/Api.js
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://vlts-server.nutanteksolutions.cloud';

// ── Storage Keys ──────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_EMAIL:    'userEmail',
};

// ── Endpoints ─────────────────────────────────────────────────────────────────
export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/client-auth/login',

  // Vehicles
  VEHICLES:      '/api/vehicle',
  VEHICLE_BY_ID: (id) => `/api/vehicle/${id}`,

  // Alert endpoints
  ALERTS:              '/api/alert',
  ALERTS_BY_VEHICLE:   (vehicleId) => `/api/alert/${vehicleId}`,         // GET  all alerts for vehicle
  ALERT_CREATE:        (vehicleId) => `/api/alert/${vehicleId}`,         // POST create alert
  ALERT_UPDATE:        (alertId)   => `/api/alert/${alertId}`,           // PUT  update alert
  ALERT_HISTORY:       (vehicleId) => `/api/alert/history/${vehicleId}`, // GET  alert history
};

// ── Token Helpers ─────────────────────────────────────────────────────────────
export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
};

export const saveTokens = async ({ accessToken, refreshToken, email }) => {
  try {
    if (accessToken)  await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN,  accessToken);
    if (refreshToken) await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    if (email)        await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL,    email);
    console.log('✅ Tokens saved to AsyncStorage');
  } catch (error) {
    console.error('❌ Error saving tokens:', error);
    throw error;
  }
};

export const clearTokens = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_EMAIL,
    ]);
    console.log('✅ Tokens cleared');
  } catch (error) {
    console.error('❌ Error clearing tokens:', error);
    throw error;
  }
};

export const isAuthenticated = async () => {
  const token = await getAccessToken();
  return !!token;
};

// ── Auth Headers ──────────────────────────────────────────────────────────────
const getAuthHeaders = async () => {
  try {
    const accessToken = await getAccessToken();
    console.log('🔑 Token present:', !!accessToken);
    if (!accessToken) {
      console.error('❌ No access token found in AsyncStorage!');
    }
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
  } catch (error) {
    console.error('❌ Error getting auth headers:', error);
    return { 'Content-Type': 'application/json' };
  }
};

// ── HTML guard ────────────────────────────────────────────────────────────────
const guardHTML = (text, endpoint) => {
  if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
    throw new Error(`Endpoint not found (server returned HTML): ${endpoint}`);
  }
};

// ── Parse error message from server response ──────────────────────────────────
const parseErrorMessage = (responseText, statusCode) => {
  try {
    const json = JSON.parse(responseText);
    return json.message || json.error || json.msg || `HTTP ${statusCode}`;
  } catch {
    const snippet = responseText.substring(0, 200).replace(/\n/g, ' ');
    return `HTTP ${statusCode}: ${snippet}`;
  }
};

// ============================================
// GET
// ============================================
export const apiGet = async (endpoint) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('📡 GET', url);
    const headers = await getAuthHeaders();
    const response = await fetch(url, { method: 'GET', headers });
    console.log('📥 GET Status:', response.status);
    const responseText = await response.text();
    guardHTML(responseText, endpoint);
    if (!response.ok) {
      throw new Error(parseErrorMessage(responseText, response.status));
    }
    const data = JSON.parse(responseText);
    console.log('✅ GET received:', Array.isArray(data) ? `${data.length} items` : '1 item');
    return data;
  } catch (error) {
    console.error('❌ GET Error:', error.message);
    throw error;
  }
};

// ============================================
// POST  (useAuth=false skips Bearer — used for login)
// ============================================
export const apiPost = async (endpoint, data, useAuth = true) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('📤 POST', url);
    console.log('📦 POST body:', JSON.stringify(data));

    const headers = useAuth
      ? await getAuthHeaders()
      : { 'Content-Type': 'application/json' };

    console.log('🔑 POST headers Authorization present:', !!headers['Authorization']);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    console.log('📥 POST Status:', response.status);
    const responseText = await response.text();
    console.log('📥 POST Response (first 300):', responseText.substring(0, 300));

    guardHTML(responseText, endpoint);

    if (!responseText.trim()) {
      if (response.ok) return { success: true };
      throw new Error(`HTTP ${response.status}: Empty response`);
    }

    if (!response.ok) {
      throw new Error(parseErrorMessage(responseText, response.status));
    }

    const responseData = JSON.parse(responseText);
    console.log('✅ POST success');
    return responseData;
  } catch (error) {
    console.error('❌ POST Error:', error.message);
    throw error;
  }
};

// ============================================
// PUT
// ============================================
export const apiPut = async (endpoint, body) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('📡 PUT', url);
    console.log('📦 PUT body:', JSON.stringify(body));

    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    console.log('📥 PUT Status:', response.status);
    const responseText = await response.text();
    console.log('📥 PUT Response (first 300):', responseText.substring(0, 300));

    guardHTML(responseText, endpoint);

    if (!response.ok) {
      throw new Error(parseErrorMessage(responseText, response.status));
    }

    const data = responseText ? JSON.parse(responseText) : { success: true };
    console.log('✅ PUT success');
    return data;
  } catch (error) {
    console.error('❌ PUT Error:', error.message);
    throw error;
  }
};

// ============================================
// DELETE
// ============================================
export const apiDelete = async (endpoint) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('📡 DELETE', url);
    const headers = await getAuthHeaders();
    const response = await fetch(url, { method: 'DELETE', headers });
    console.log('📥 DELETE Status:', response.status);
    const responseText = await response.text();
    guardHTML(responseText, endpoint);
    if (!response.ok) {
      throw new Error(parseErrorMessage(responseText, response.status));
    }
    console.log('✅ DELETE success');
    return true;
  } catch (error) {
    console.error('❌ DELETE Error:', error.message);
    throw error;
  }
};

// ============================================
// Logout
// ============================================
export const logout = async () => {
  await clearTokens();
};

export default API_BASE_URL;