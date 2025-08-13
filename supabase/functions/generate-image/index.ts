import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
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

    console.log('🎨 Generating image with prompt:', prompt.substring(0, 100) + '...');

    // Try to use Gemini imagen for real image generation
    try {
      const imageRequest = {
        model: "models/imagen-3.0-generate-001",
        prompt: {
          text: prompt
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_LOW_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_LOW_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_LOW_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_LOW_AND_ABOVE"
          }
        ],
        generationConfig: {
          aspectRatio: "1:1",
          negativePrompt: "blurry, low quality, distorted, explicit content"
        }
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(imageRequest)
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        if (result.candidates && result.candidates[0] && result.candidates[0].image) {
          const imageBase64 = result.candidates[0].image.base64;
          const imageUrl = `data:image/png;base64,${imageBase64}`;
          
          console.log('✅ Successfully generated image via Gemini Imagen');
          
          return new Response(JSON.stringify({ imageUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
      console.log('⚠️ Gemini Imagen API response:', response.status, await response.text());
    } catch (geminiError) {
      console.log('⚠️ Gemini Imagen failed, falling back to placeholder:', geminiError);
    }

    // Fallback: Create a more realistic-looking placeholder
    const placeholderSvg = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bg" cx="50%" cy="30%" r="70%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </radialGradient>
          <linearGradient id="light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffeaa7;stop-opacity:0.4" />
            <stop offset="100%" style="stop-color:#fab1a0;stop-opacity:0.2" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1024" height="1024" fill="url(#bg)"/>
        
        <!-- Overlay light -->
        <rect width="1024" height="1024" fill="url(#light)"/>
        
        <!-- Subject silhouette -->
        <ellipse cx="512" cy="380" rx="150" ry="200" fill="#2d3436" opacity="0.7"/>
        
        <!-- Golden hour light -->
        <circle cx="200" cy="200" r="80" fill="#fdcb6e" opacity="0.6"/>
        
        <!-- Travel elements -->
        <rect x="50" y="800" width="200" height="100" rx="10" fill="#636e72" opacity="0.4"/>
        <rect x="774" y="850" width="150" height="80" rx="8" fill="#636e72" opacity="0.3"/>
        
        <!-- Main text -->
        <text x="512" y="600" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#ffffff" opacity="0.9">
          Parallel Universe Portrait
        </text>
        
        <!-- Subtitle -->
        <text x="512" y="660" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#ddd6fe" opacity="0.8">
          Your alternate reality awaits...
        </text>
        
        <!-- Demo note -->
        <text x="512" y="950" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#a0a0a0" opacity="0.6">
          (AI image generation demo - connect Gemini API for real portraits)
        </text>
      </svg>
    `;

    const imageUrl = "data:image/svg+xml;base64," + btoa(placeholderSvg);

    console.log('📷 Returning enhanced placeholder image');

    return new Response(JSON.stringify({ imageUrl }), {
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