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

    // Fallback: Create a human-like portrait placeholder
    const placeholderSvg = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bg" cx="50%" cy="30%" r="70%">
            <stop offset="0%" style="stop-color:#6c5ce7;stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:#a29bfe;stop-opacity:1" />
          </radialGradient>
          <linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffeaa7;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#fdcb6e;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="hair" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#636e72;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2d3436;stop-opacity:1" />
          </linearGradient>
          <radialGradient id="light" cx="20%" cy="20%" r="60%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
          </radialGradient>
        </defs>
        
        <!-- Background with city skyline hint -->
        <rect width="1024" height="1024" fill="url(#bg)"/>
        
        <!-- Distant city buildings -->
        <rect x="50" y="700" width="80" height="180" fill="#2d3436" opacity="0.3"/>
        <rect x="150" y="650" width="60" height="230" fill="#2d3436" opacity="0.25"/>
        <rect x="800" y="680" width="90" height="200" fill="#2d3436" opacity="0.3"/>
        <rect x="900" y="720" width="70" height="160" fill="#2d3436" opacity="0.25"/>
        
        <!-- Golden hour lighting -->
        <circle cx="150" cy="150" r="60" fill="#fdcb6e" opacity="0.8"/>
        <rect width="1024" height="1024" fill="url(#light)"/>
        
        <!-- Human figure - shoulders and torso -->
        <ellipse cx="512" cy="850" rx="280" ry="120" fill="#34495e" opacity="0.8"/>
        
        <!-- Neck -->
        <rect x="482" y="620" width="60" height="80" fill="url(#skin)" rx="30"/>
        
        <!-- Head shape -->
        <ellipse cx="512" cy="450" rx="120" ry="140" fill="url(#skin)"/>
        
        <!-- Hair -->
        <ellipse cx="512" cy="380" rx="130" ry="100" fill="url(#hair)"/>
        <path d="M 390 420 Q 512 350 634 420 Q 620 480 512 500 Q 404 480 390 420" fill="url(#hair)"/>
        
        <!-- Facial features -->
        <!-- Eyes -->
        <ellipse cx="480" cy="430" rx="12" ry="8" fill="#2d3436"/>
        <ellipse cx="544" cy="430" rx="12" ry="8" fill="#2d3436"/>
        <circle cx="484" cy="428" r="3" fill="#ffffff" opacity="0.8"/>
        <circle cx="548" cy="428" r="3" fill="#ffffff" opacity="0.8"/>
        
        <!-- Nose -->
        <path d="M 512 450 L 508 470 L 516 470 Z" fill="#e17055" opacity="0.6"/>
        
        <!-- Mouth -->
        <ellipse cx="512" cy="490" rx="18" ry="6" fill="#e84393" opacity="0.8"/>
        
        <!-- Clothing suggestion -->
        <rect x="420" y="650" width="184" height="200" fill="#0984e3" opacity="0.7" rx="15"/>
        <circle cx="512" cy="680" r="25" fill="#00b894" opacity="0.6"/>
        
        <!-- Travel accessories -->
        <rect x="350" y="750" width="40" height="60" fill="#8e44ad" opacity="0.5" rx="5"/>
        <rect x="634" y="740" width="35" height="80" fill="#f39c12" opacity="0.6" rx="5"/>
        
        <!-- Artistic elements -->
        <circle cx="200" cy="300" r="15" fill="#e84393" opacity="0.4"/>
        <circle cx="800" cy="250" r="20" fill="#00b894" opacity="0.3"/>
        <circle cx="750" cy="400" r="12" fill="#fdcb6e" opacity="0.5"/>
        
        <!-- Main text -->
        <text x="512" y="950" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" opacity="0.9">
          AI Portrait Generation Ready
        </text>
        
        <!-- Subtitle -->
        <text x="512" y="985" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#ddd6fe" opacity="0.8">
          Connect Gemini API to generate personalized portraits
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