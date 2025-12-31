const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'auctioneer';
  isActive?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
}

class AuthService {
  // Register new user
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token in localStorage
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  }

  // Login user
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in localStorage
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      localStorage.removeItem('token');
    } catch (error) {
      // Always clear token even if request fails
      localStorage.removeItem('token');
    }
  }

  // Get current user
  async getMe(): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        return {
          success: false,
          error: 'No token found',
        };
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user');
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch user',
      };
    }
  }

  // Update user details
  async updateDetails(name: string, email: string): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/auth/updatedetails`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Update failed');
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Update failed',
      };
    }
  }

  // Update password
  async updatePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/auth/updatepassword`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password update failed');
      }

      // Update token
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Password update failed',
      };
    }
  }

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

const authServiceInstance = new AuthService();
export default authServiceInstance;
