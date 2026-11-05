let inMemoryAccessToken = null;
let isRefreshing = false;
let failedQueue = [];
let onSessionExpiredCallback = null;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => {
  return inMemoryAccessToken;
};

export const setOnSessionExpired = (cb) => {
  onSessionExpiredCallback = cb;
};

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const getCurrentLang = () => {
  try {
    return localStorage.getItem('loomus_lang') || 'en';
  } catch (e) {
    return 'en';
  }
};

export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('/') ? `/api${endpoint}` : `/api/${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': getCurrentLang(),
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    ...(options.headers || {})
  };

  if (inMemoryAccessToken) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include',
    cache: 'no-store'
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            fetchOptions.headers['Authorization'] = `Bearer ${newToken}`;
            return fetch(url, fetchOptions).then((res) => handleResponse(res));
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Language': getCurrentLang(),
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.data?.accessToken) {
          const newToken = refreshData.data.accessToken;
          setAccessToken(newToken);
          processQueue(null, newToken);
          isRefreshing = false;

          fetchOptions.headers['Authorization'] = `Bearer ${newToken}`;
          const retryRes = await fetch(url, fetchOptions);
          return handleResponse(retryRes);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        setAccessToken(null);
        if (onSessionExpiredCallback) {
          onSessionExpiredCallback();
        }
        throw new Error('Session expired');
      }
    }

    return handleResponse(response);
  } catch (err) {
    throw err;
  }
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.message || response.statusText || 'Request failed';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    error.errorCode = data?.errorCode;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => apiClient(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => apiClient(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => apiClient(endpoint, { method: 'PUT', body, ...options }),
  patch: (endpoint, body, options) => apiClient(endpoint, { method: 'PATCH', body, ...options }),
  delete: (endpoint, body, options) => apiClient(endpoint, { method: 'DELETE', body, ...options })
};
