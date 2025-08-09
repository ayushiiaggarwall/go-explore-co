import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useSmoothNavigation = () => {
  const navigate = useNavigate();

  const smoothNavigate = useCallback((path: string, options?: { replace?: boolean }) => {
    // Add zoom-out transition effect
    document.body.style.opacity = '0.7';
    document.body.style.transform = 'scale(0.85)';
    document.body.style.filter = 'blur(1px)';
    document.body.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), filter 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      navigate(path, options);
      window.scrollTo(0, 0);
      
      // Start with zoomed-in state for the new page
      document.body.style.opacity = '0.8';
      document.body.style.transform = 'scale(1.1)';
      document.body.style.filter = 'blur(0.5px)';
      
      // Animate to normal state with zoom-in effect
      setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.transform = 'scale(1)';
        document.body.style.filter = 'blur(0)';
        document.body.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      }, 100);
    }, 600);
  }, [navigate]);

  return { smoothNavigate, navigate };
};