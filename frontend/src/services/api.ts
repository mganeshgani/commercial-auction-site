import axios, { AxiosError } from 'axios';
import { Player, Team } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Reduced to 15 seconds for faster failure detection
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Stale-While-Revalidate cache with request deduplication
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds fresh (sockets handle real-time)
const REALTIME_CACHE_TTL = 15000; // 15 seconds for player data
const pendingRequests = new Map<string, Promise<any>>();

// Invalidation timestamp — entries older than this are stale (but still usable)
let cacheInvalidatedAt = 0;

const getCached = (key: string, customTTL?: number) => {
  const entry = cache.get(key);
  if (!entry) return null;
  const ttl = customTTL || (key.includes('players') ? REALTIME_CACHE_TTL : CACHE_TTL);
  // If entry was set before last invalidation, treat as expired
  const effectiveTs = entry.timestamp < cacheInvalidatedAt ? 0 : entry.timestamp;
  if (Date.now() - effectiveTs < ttl) {
    return entry.data;
  }
  return null;
};

// Returns ANY cached data regardless of freshness — for instant page display
export const getStaleCached = (key: string): any | null => {
  const entry = cache.get(key);
  return entry?.data ?? null;
};

const setCache = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Deduplicate concurrent requests
const deduplicateRequest = async <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
  const pending = pendingRequests.get(key);
  if (pending) return pending;

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });
  pendingRequests.set(key, promise);
  return promise;
};

export const clearCache = () => {
  // Mark stale but keep data in map for instant SWR display
  cacheInvalidatedAt = Date.now();
};

// Force clear specific cache key
export const clearCacheKey = (key: string) => {
  cache.delete(key);
};

export const playerService = {
  uploadPlayers: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/players/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getRandomPlayer: async () => {
    const response = await api.get<Player>('/players/random');
    return response.data;
  },

  assignPlayer: async (playerId: string, teamId: string, amount: number) => {
    const response = await api.post(`/players/${playerId}/assign`, { teamId, amount });
    return response.data;
  },

  markUnsold: async (playerId: string) => {
    const response = await api.post(`/players/${playerId}/unsold`);
    return response.data;
  },

  getUnsoldPlayers: async (useCache = true) => {
    const cacheKey = 'players:unsold';
    if (useCache) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }
    return deduplicateRequest(cacheKey, async () => {
      const response = await api.get<Player[]>('/players/unsold');
      setCache(cacheKey, response.data);
      return response.data;
    });
  },

  getAllPlayers: async (useCache = true) => {
    const cacheKey = 'players:all';
    if (useCache) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }
    return deduplicateRequest(cacheKey, async () => {
      const response = await api.get<Player[]>('/players');
      setCache(cacheKey, response.data);
      return response.data;
    });
  },

  updatePlayer: async (playerId: string, data: Partial<Player>) => {
    clearCache(); // Invalidate cache on update
    const response = await api.patch<Player>(`/players/${playerId}`, data);
    return response.data;
  },
};

export const teamService = {
  createTeam: async (data: Partial<Team>) => {
    clearCache(); // Invalidate cache
    const response = await api.post<Team>('/teams', data);
    return response.data;
  },

  updateTeam: async (teamId: string, data: Partial<Team>) => {
    clearCache(); // Invalidate cache
    const response = await api.put<Team>(`/teams/${teamId}`, data);
    return response.data;
  },

  patchTeam: async (teamId: string, data: any) => {
    clearCache(); // Invalidate cache
    const response = await api.patch(`/teams/${teamId}`, data);
    return response.data;
  },

  deleteTeam: async (teamId: string) => {
    clearCache(); // Invalidate cache
    const response = await api.delete(`/teams/${teamId}`);
    return response.data;
  },

  getAllTeams: async (useCache = true) => {
    const cacheKey = 'teams:all';
    if (useCache) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }
    return deduplicateRequest(cacheKey, async () => {
      const response = await api.get<Team[]>('/teams');
      setCache(cacheKey, response.data);
      return response.data;
    });
  },

  getTeamById: async (teamId: string, useCache = true) => {
    const cacheKey = `team:${teamId}`;
    if (useCache) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }
    const response = await api.get<Team>(`/teams/${teamId}`);
    setCache(cacheKey, response.data);
    return response.data;
  },

  getFinalResults: async () => {
    const response = await api.get('/teams/results/final');
    return response.data;
  },
};

// Results service for optimized data fetching
export const resultsService = {
  getResultsData: async (useCache = true) => {
    const cacheKey = 'results:data';
    if (useCache) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }
    return deduplicateRequest(cacheKey, async () => {
      const [teams, players] = await Promise.all([
        teamService.getAllTeams(useCache),
        playerService.getAllPlayers(useCache)
      ]);
      const data = { teams, players };
      setCache(cacheKey, data);
      return data;
    });
  },
};

// Admin service with caching
export const adminService = {
  getStats: async (useCache = true) => {
    const cacheKey = 'admin:stats';
    if (useCache) {
      const cached = getCached(cacheKey, 60000);
      if (cached) return cached;
    }
    return deduplicateRequest(cacheKey, async () => {
      const response = await api.get('/admin/stats');
      setCache(cacheKey, response.data.data);
      return response.data.data;
    });
  },

  getAuctioneers: async (useCache = true) => {
    const cacheKey = 'admin:auctioneers';
    if (useCache) {
      const cached = getCached(cacheKey, 60000);
      if (cached) return cached;
    }
    return deduplicateRequest(cacheKey, async () => {
      const response = await api.get('/admin/auctioneers');
      setCache(cacheKey, response.data.data);
      return response.data.data;
    });
  },
};