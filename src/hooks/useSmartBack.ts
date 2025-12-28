import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useEffect } from 'react';

const NAV_HISTORY_KEY = 'app_nav_history';

export const useSmartBack = (fallbackRoute: string = '/feed') => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Track navigation within the app
  useEffect(() => {
    const history: string[] = JSON.parse(sessionStorage.getItem(NAV_HISTORY_KEY) || '[]');
    // Avoid duplicates for the current path
    if (history[history.length - 1] !== location.pathname) {
      history.push(location.pathname);
      sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(history));
    }
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
