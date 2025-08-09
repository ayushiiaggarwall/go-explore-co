import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useSmoothNavigation = () => {
  const navigate = useNavigate();

  const smoothNavigate = useCallback((path: string, options?: { replace?: boolean }) => {
    // Add dramatic zoom-out transition effect
    document.body.style.opacity = '0.6';
    document.body.style.transform = 'scale(0.7)';
    document.body.style.filter = 'blur(2px)';
    document.body.style.transition = 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), filter 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      navigate(path, options);
      window.scrollTo(0, 0);
      
      // Start with dramatically zoomed-in state for the new page
      document.body.style.opacity = '0.7';
      document.body.style.transform = 'scale(1.3)';
      document.body.style.filter = 'blur(1.5px)';
      
      // Animate to normal state with dramatic zoom-in effect
      setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.transform = 'scale(1)';
        document.body.style.filter = 'blur(0)';
        document.body.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      }, 100);
    }, 700);
  }, [navigate]);

  return { smoothNavigate, navigate };
};