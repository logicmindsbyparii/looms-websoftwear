import { apiClient } from './client.js';

// --- Authenticated Dispatch APIs (Admin, Supervisor, Driver) ---

export async function fetchDispatches(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const queryString = query.toString();
  return apiClient(`/dispatches${queryString ? `?${queryString}` : ''}`);
}

export async function fetchDispatchDetails(dispatchId) {
  return apiClient(`/dispatches/${dispatchId}`);
}

export async function createFactoryDispatch(data) {
  return apiClient('/dispatches', {
    method: 'POST',
    body: data
  });
}

export async function updateDriverTransit(dispatchId, payload) {
  return apiClient(`/dispatches/${dispatchId}/transit`, {
    method: 'PATCH',
    body: payload
  });
}

export async function resolveDeliveryDispute(dispatchId, payload) {
  return apiClient(`/dispatches/${dispatchId}/resolve-dispute`, {
    method: 'POST',
    body: payload
  });
}

// --- Public Delivery Verification APIs (No auth required) ---

export async function fetchPublicDelivery(token) {
  const res = await fetch(`/api/public/delivery/${token}`, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch delivery details');
  }
  return data.data;
}

export async function requestDeliveryOTP(token) {
  const res = await fetch(`/api/public/delivery/${token}/request-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to send verification OTP');
  }
  return data.data;
}

export async function confirmPartyDelivery(token, payload) {
  const res = await fetch(`/api/public/delivery/${token}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'Delivery verification failed');
    error.errorCode = data.errorCode;
    throw error;
  }
  return data.data;
}

