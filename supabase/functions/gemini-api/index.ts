import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

serve(async (req) => {
  console.log(`🤖 Gemini API called: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔐 Checking Gemini API key...');
    console.log('🔍 All environment variables:', Object.keys(Deno.env.toObject()));
    console.log('🔍 Gemini-related env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('GEMINI')));
    
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found in secrets');
      console.error('🔍 Available env vars:', Object.keys(Deno.env.toObject()));
      return new Response(
        JSON.stringify({ 
          error: 'Gemini API key not configured',
          debug: {
            availableKeys: Object.keys(Deno.env.toObject()).filter(k => k.includes('API') || k.includes('KEY')),
            allKeys: Object.keys(Deno.env.toObject())
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    console.log('✅ Gemini API key found, length:', apiKey.length);

    // Parse request body
    console.log('📝 Parsing request body...');
    const { prompt, action } = await req.json();
    console.log('🎯 Action:', action);
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    
    console.log('🚀 Making request to Gemini API...');
    const response = await fetch(`${baseUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      console.error('❌ Gemini API response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error details:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    console.log('✅ Gemini API response received');
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('❌ No candidates in Gemini response');
      throw new Error('No response generated from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('📝 Generated text length:', generatedText.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        text: generatedText,
        action: action 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error in Gemini API function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});