import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useSmartBack = (fallbackRoute: string = '/feed') => {
  const navigate = useNavigate();
  
  const goBack = useCallback(() => {
    // Check if there's meaningful history to go back to
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackRoute, { replace: true });
    }
  }, [navigate, fallbackRoute]);
  
  return goBack;
};
