/**
 * Unified API Client for NetAssist Frontend
 * Connects React UI to FastAPI Backend
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = sessionStorage.getItem('netassist_token');
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, config);
    if (res.status === 401 && endpoint !== '/auth/login') {
      sessionStorage.removeItem('netassist_token');
      sessionStorage.removeItem('netassist_user');
      window.location.assign('/login');
    }
    if (!res.ok) {
      let errMsg = `Request failed with status ${res.status}`;
      try {
        const errJson = await res.json();
        errMsg = errJson.detail || errJson.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return await res.json();
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // 1. Dashboard
  getDashboard: () => request('/dashboard'),

  // 2. Network Diagnostics (CN)
  getNetworkStatus: () => request('/network/status'),
  getIpDetails: () => request('/network/ip'),
  ping: (target, count = 4) =>
    request('/network/ping', {
      method: 'POST',
      body: JSON.stringify({ target, count: parseInt(count, 10) }),
    }),
  dns: (hostname) =>
    request('/network/dns', {
      method: 'POST',
      body: JSON.stringify({ hostname }),
    }),
  traceroute: (target, maxHops = 15) =>
    request('/network/traceroute', {
      method: 'POST',
      body: JSON.stringify({ target, max_hops: parseInt(maxHops, 10) }),
    }),

  // 3. Automated Troubleshooting
  runDiagnosis: () =>
    request('/diagnosis/run', {
      method: 'POST',
    }),

  // 4. FLAT Automata & Regex
  recognizeAutomata: (inputString) =>
    request('/automata/recognize', {
      method: 'POST',
      body: JSON.stringify({ input_string: inputString }),
    }),
  getTransitions: () => request('/automata/transitions'),
  getAutomataLogs: (limit = 20) => request(`/automata/logs?limit=${limit}`),
  validateRegex: (inputValue, validationType = 'ipv4') =>
    request('/automata/regex-validate', {
      method: 'POST',
      body: JSON.stringify({ input_value: inputValue, validation_type: validationType }),
    }),

  // 5. Diagnostic History
  getHistory: (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);
    if (params.test_type && params.test_type !== 'ALL') query.append('test_type', params.test_type);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return request(`/history${qs ? `?${qs}` : ''}`);
  },
  getHistoryById: (id) => request(`/history/${id}`),
  deleteHistoryItem: (id) =>
    request(`/history/${id}`, {
      method: 'DELETE',
    }),
  clearAllHistory: () =>
    request('/history', {
      method: 'DELETE',
    }),

  // 6. Reports & Downloads
  getReport: (id) => request(`/reports/${id}`),
  getPdfDownloadUrl: (id) => `${API_BASE}/reports/${id}/pdf`,
  getCsvExportUrl: () => `${API_BASE}/reports/export/csv`,

  // 7. Auth
  login: async (username, password) => {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    sessionStorage.setItem('netassist_token', result.token);
    return result;
  },
  downloadFile: async (endpoint) => {
    const token = sessionStorage.getItem('netassist_token');
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.status === 401) {
      sessionStorage.removeItem('netassist_token');
      sessionStorage.removeItem('netassist_user');
      window.location.assign('/login');
      throw new Error('Your session expired. Please sign in again.');
    }
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const fileName = response.headers
      .get('content-disposition')
      ?.match(/filename="?([^";]+)"?/i)?.[1] || 'netassist-export';
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  },
};

export default api;
