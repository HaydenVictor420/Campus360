/**
 * Robust API Client with Token Lifecycle Management and Auto-Refresh
 */
class ApiClient {
  constructor() {
    this.baseUrl = window.location.origin;
    this.accessToken = localStorage.getItem('campus360_access_token');
    this.refreshToken = localStorage.getItem('campus360_refresh_token');
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    if (accessToken) {
      localStorage.setItem('campus360_access_token', accessToken);
    } else {
      localStorage.removeItem('campus360_access_token');
    }

    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('campus360_refresh_token', refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('campus360_access_token');
    localStorage.removeItem('campus360_refresh_token');
    localStorage.removeItem('campus360_user');
  }

  getUser() {
    try {
      const u = localStorage.getItem('campus360_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }

  setUser(user) {
    if (user) {
      localStorage.setItem('campus360_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('campus360_user');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-Id': 'req-' + Math.random().toString(36).substring(2, 10),
      ...(options.headers || {})
    };

    if (this.accessToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      // Auto-refresh token if 401 Unauthorized
      if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
        const refreshed = await this.refreshSession();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryRes = await fetch(url, { ...options, headers });
          return await retryRes.json();
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  async login(identifier, password) {
    const res = await this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });

    if (res.success && res.data) {
      this.setTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
      this.setUser(res.data.user);
    }
    return res;
  }

  async register(payload) {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async forgotPassword(email) {
    return this.request('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  }

  async refreshSession() {
    if (!this.refreshToken) return false;
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }
      this.clearTokens();
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  async getProfile() {
    return this.request('/api/v1/auth/me');
  }

  async getUsers() {
    return this.request('/api/v1/auth/users');
  }

  async logout() {
    try {
      if (this.refreshToken) {
        await this.request('/api/v1/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken })
        });
      }
    } finally {
      this.clearTokens();
    }
  }
}

window.api = new ApiClient();
