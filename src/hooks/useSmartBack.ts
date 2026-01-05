import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useEffect } from 'react';

const NAV_HISTORY_KEY = 'app_nav_history';
const MAIN_ROUTES = ['/feed', '/trip', '/profile'];

export const useSmartBack = (fallbackRoute: string = '/feed') => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Track navigation within the app
  useEffect(() => {
    const history: string[] = JSON.parse(sessionStorage.getItem(NAV_HISTORY_KEY) || '[]');
    const currentPath = location.pathname;
    
    // If we're on a main route, trim history to prevent stale entries
    if (MAIN_ROUTES.includes(currentPath)) {
      const existingIndex = history.lastIndexOf(currentPath);
      if (existingIndex >= 0) {
        // Trim everything after it (we're "returning" to this page)
        history.length = existingIndex + 1;
      } else {
        history.push(currentPath);
      }
    } else {
      // For non-main routes, just add to history if different
      if (history[history.length - 1] !== currentPath) {
        history.push(currentPath);
      }
    }
    
    // Keep only last 50 entries
    while (history.length > 50) {
      history.shift();
    }
    
    sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(history));
  }, [location.pathname]);
  
  const goBack = useCallback(() => {
    const history: string[] = JSON.parse(sessionStorage.getItem(NAV_HISTORY_KEY) || '[]');
    
    // If we have at least 2 entries, we can go back within our app
    if (history.length > 1) {
      // Remove current page
      history.pop();
      const previousPath = history[history.length - 1];
      sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(history));
      navigate(previousPath, { replace: true });
    } else {
      // No app history, go to fallback
      navigate(fallbackRoute, { replace: true });
    }
  }, [navigate, fallbackRoute]);
  
  return goBack;
};
