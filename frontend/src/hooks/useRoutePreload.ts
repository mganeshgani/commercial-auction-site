import { useCallback } from 'react';
import { playerService, teamService, resultsService, adminService } from '../services/api';

// Route component mapping for prefetching
const routeComponentMap: Record<string, () => Promise<any>> = {
  '/auction': () => import('../pages/AuctionPage'),
  '/teams': () => import('../pages/TeamsPage'),
  '/players': () => import('../pages/PlayersPage'),
  '/unsold': () => import('../pages/UnsoldPage'),
  '/results': () => import('../pages/ResultsPage'),
  '/form-builder': () => import('../pages/FormBuilderPage'),
  '/settings': () => import('../pages/SettingsPage'),
  '/admin': () => import('../pages/AdminDashboard'),
  '/admin/auctioneers': () => import('../pages/AuctioneersPage'),
};

// Data prefetch mapping — warm the cache before navigation
const routeDataPrefetchMap: Record<string, () => void> = {
  '/auction': () => { teamService.getAllTeams(); playerService.getAllPlayers(); },
  '/teams': () => { teamService.getAllTeams(); },
  '/players': () => { playerService.getAllPlayers(); },
  '/unsold': () => { playerService.getUnsoldPlayers(); teamService.getAllTeams(); },
  '/results': () => { resultsService.getResultsData(); },
  '/admin': () => { adminService.getStats(); adminService.getAuctioneers(); },
  '/admin/auctioneers': () => { adminService.getAuctioneers(); },
};

// Track which routes have been preloaded
const preloadedRoutes = new Set<string>();

export const useRoutePreload = () => {
  const preloadRoute = useCallback((path: string) => {
    // Prefetch data on every hover (cache will deduplicate if fresh)
    const dataLoader = routeDataPrefetchMap[path];
    if (dataLoader) dataLoader();

    // Don't re-preload JS bundle if already done
    if (preloadedRoutes.has(path)) return;

    const loader = routeComponentMap[path];
    if (loader) {
      loader().then(() => {
        preloadedRoutes.add(path);
      }).catch(() => {});
    }
  }, []);

  return { preloadRoute };
};
