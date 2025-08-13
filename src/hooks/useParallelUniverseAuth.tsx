import { useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export function useParallelUniverseAuth() {
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  const redirectToParallelUniverse = async () => {
    setIsGeneratingToken(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-auth-token');
      
      if (error) {
        console.error('Error generating auth token:', error);
        // Redirect without token if generation fails
        window.open('https://jovial-longma-141474.netlify.app', '_blank');
        return;
      }

      if (data?.token) {
        // Redirect with authentication token
        const redirectUrl = `https://jovial-longma-141474.netlify.app?auth_token=${data.token}`;
        window.open(redirectUrl, '_blank');
      } else {
        // Fallback to redirect without token
        window.open('https://jovial-longma-141474.netlify.app', '_blank');
      }
    } catch (error) {
      console.error('Error during parallel universe auth:', error);
      // Fallback to redirect without token
      window.open('https://jovial-longma-141474.netlify.app', '_blank');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  return {
    redirectToParallelUniverse,
    isGeneratingToken
  };
}