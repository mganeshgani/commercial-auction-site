import { useCallback } from 'react';

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

// Track which routes have been preloaded
const preloadedRoutes = new Set<string>();

export const useRoutePreload = () => {
  const preloadRoute = useCallback((path: string) => {
    // Don't preload if already preloaded
    if (preloadedRoutes.has(path)) {
      return;
    }

    const loader = routeComponentMap[path];
    if (loader) {
      // Preload the component
      loader().then(() => {
        preloadedRoutes.add(path);
      }).catch(() => {
        // Silently fail - component will load normally on navigation
      });
    }
  }, []);

  return { preloadRoute };
};
