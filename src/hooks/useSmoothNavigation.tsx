import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useSmoothNavigation = () => {
  const navigate = useNavigate();

  const smoothNavigate = useCallback((path: string, options?: { replace?: boolean; state?: any }) => {
    // Zoom out to a tiny dot
    document.body.style.opacity = '0.3';
    document.body.style.transform = 'scale(0.05)';
    document.body.style.filter = 'blur(3px)';
    document.body.style.transition = 'opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    setTimeout(() => {
      navigate(path, options);
      window.scrollTo(0, 0);
      
      // Start the new page as a tiny dot
      document.body.style.opacity = '0.4';
      document.body.style.transform = 'scale(0.05)';
      document.body.style.filter = 'blur(3px)';
      
      // Zoom in from dot to full page
      setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.transform = 'scale(1)';
        document.body.style.filter = 'blur(0)';
        document.body.style.transition = 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }, 75);
    }, 400);
  }, [navigate]);

  return { smoothNavigate, navigate };
};