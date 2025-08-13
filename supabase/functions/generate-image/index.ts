import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { prompt, referenceImage } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🎨 Generating cartoon portrait with OpenAI:', prompt.substring(0, 100) + '...');

    // Use OpenAI's gpt-image-1 model for cartoon-style portraits
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'high'
      })
    });

    console.log('📡 OpenAI API response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('📊 OpenAI response data:', JSON.stringify(result, null, 2));
      
      if (result.data && result.data[0]) {
        // OpenAI returns either url or b64_json depending on response_format
        const imageData = result.data[0];
        let imageUrl;
        
        if (imageData.url) {
          imageUrl = imageData.url;
          console.log('🔗 Got image URL from OpenAI');
        } else if (imageData.b64_json) {
          imageUrl = `data:image/png;base64,${imageData.b64_json}`;
          console.log('📄 Got base64 image from OpenAI');
        }
        
        if (imageUrl) {
          console.log('✅ Successfully generated cartoon portrait with OpenAI');
          
          return new Response(JSON.stringify({ imageUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          console.log('❌ No image data found in OpenAI response');
        }
      } else {
        console.log('❌ No data array found in OpenAI response');
      }
    }
    
    const errorText = await response.text();
    console.log('⚠️ OpenAI API response:', response.status, errorText);
    
    // If OpenAI fails, return a more specific error
    return new Response(JSON.stringify({ 
      error: 'Failed to generate image with OpenAI',
      details: errorText
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error generating image:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate image' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});