import { supabase } from '../integrations/supabase/client';

export const useParallelUniverseAuth = () => {
  const generateAuthToken = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-auth-token');
      
      if (error) {
        console.error('Error generating auth token:', error);
        return null;
      }
      
      return data.token;
    } catch (error) {
      console.error('Error generating auth token:', error);
      return null;
    }
  };

  const navigateToParallelUniverse = async (): Promise<void> => {
    const token = await generateAuthToken();
    
    if (token) {
      // Pass the token as a URL parameter
      const url = `https://elegant-halva-e06184.netlify.app/?auth_token=${token}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback to regular navigation without auth
      window.open('https://elegant-halva-e06184.netlify.app/', '_blank', 'noopener,noreferrer');
    }
  };

  return { navigateToParallelUniverse };
};