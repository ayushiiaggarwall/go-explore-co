import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildCartoonPrompt({
  personaSeed,
  destinationCity,
  destinationRegionOrCountry,
  interests,
  styleNotes = ""
}: {
  personaSeed: string;
  destinationCity: string;
  destinationRegionOrCountry: string;
  interests: string[];
  styleNotes?: string;
}) {
  const interestsCsv = interests.filter(Boolean).join(", ");
  return `
Create a stylized, human-in-cartoon-form travel portrait using the attached reference image for facial likeness.

Persona:
- Core idea: ${personaSeed}
- Destination: ${destinationCity}, ${destinationRegionOrCountry}
- Top interests: ${interestsCsv}
- Optional notes: ${styleNotes}

Art Direction:
- Style: clean, semi-realistic cartoon (cel-shaded), soft gradients, light outlines; NOT photorealistic
- Pose & crop: centered, 3/4 view, head-and-shoulders to mid-torso, friendly expression
- Wardrobe/props: infer tasteful items that reflect interests & destination (non-branded)
- Background: incorporate specific iconic landmarks, architecture, or natural features from ${destinationCity}, ${destinationRegionOrCountry} that relate to the interests: ${interestsCsv}. Make the background prominent but not overwhelming.
- Color & lighting: vibrant but natural; gentle golden-hour vibe that complements the destination

Requirements:
- CRITICAL: Preserve the person's exact gender presentation, facial structure, and skin tone from the reference
- Maintain the same gender identity and physical characteristics as shown in the reference image
- Keep content PG-13, respectful, and culturally sensitive
- No text, watermarks, or brand logos
- Single subject only; no extra people
- Output: 1024×1024 PNG

If the reference image is low quality or occluded, approximate respectfully while keeping the same overall vibe and attributes.
`.trim();
}

async function analyzeReferenceImage(imageBase64: string): Promise<string> {
  console.log('🔍 Analyzing reference image with GPT-4o...');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe the general appearance of this person for creating a cartoon portrait: gender presentation, general build, hair style/color, and any distinctive visual characteristics. Keep it brief and artistic.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      max_tokens: 150
    })
  });

  if (response.ok) {
    const result = await response.json();
    const description = result.choices[0].message.content;
    console.log('📝 Image analysis result:', description);
    
    // Check if the analysis was successful (not a refusal)
    if (description && !description.toLowerCase().includes("i can't") && !description.toLowerCase().includes("i'm sorry")) {
      return description;
    }
  }
  
  console.log('⚠️ Image analysis failed or was refused, using fallback');
  return 'person maintaining their original gender presentation and distinctive features';
}

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

    const { 
      personaSeed, 
      destinationCity, 
      destinationRegionOrCountry, 
      interests, 
      styleNotes, 
      referenceImage 
    } = await req.json();

    if (!personaSeed || !destinationCity || !destinationRegionOrCountry) {
      return new Response(JSON.stringify({ error: 'Persona seed, destination city, and region/country are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build the cartoon prompt using the template
    const prompt = buildCartoonPrompt({
      personaSeed,
      destinationCity,
      destinationRegionOrCountry,
      interests: interests || [],
      styleNotes
    });

    // If reference image is provided, analyze it first
    let enhancedPrompt = prompt;
    if (referenceImage) {
      console.log('📷 Reference image provided, analyzing first...');
      const imageDescription = await analyzeReferenceImage(referenceImage);
      enhancedPrompt = prompt.replace(
        'using the attached reference image for facial likeness',
        `based on this person: ${imageDescription}`
      );
    }

    console.log('🎨 Generating cartoon portrait with OpenAI:', enhancedPrompt.substring(0, 100) + '...');

    // Use OpenAI's gpt-image-1 model for cartoon-style portraits
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid'
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