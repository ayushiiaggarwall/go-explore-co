import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useSmoothNavigation = () => {
  const navigate = useNavigate();

  const smoothNavigate = useCallback((path: string, options?: { replace?: boolean }) => {
    // Add transition effect
    document.body.style.opacity = '0.85';
    document.body.style.transform = 'scale(0.98)';
    document.body.style.filter = 'blur(0.5px)';
    document.body.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      navigate(path, options);
      window.scrollTo(0, 0);
      
      // Reset styles after navigation
      setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.transform = 'scale(1)';
        document.body.style.filter = 'blur(0)';
      }, 50);
    }, 500);
  }, [navigate]);

  return { smoothNavigate, navigate };
};