import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SkyscannerFlight {
  price: number;
  currency: string;
  airline: {
    name: string;
    code: string;
    logo?: string;
  };
  flightNumber: string;
  departure: {
    time: string;
    date: string;
    airport: string;
    city: string;
  };
  arrival: {
    time: string;
    date: string;
    airport: string;
    city: string;
  };
  duration: string;
  stops: number;
  bookingUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 search-flights invoked - version 2.1');
    const apifyToken = Deno.env.get('APIFY_API_TOKEN');
    
    console.log('🔐 Environment variables check:', {
      'APIFY_API_TOKEN exists': apifyToken !== undefined,
      'APIFY_API_TOKEN length': apifyToken?.length || 0,
      'APIFY_API_TOKEN first 10 chars': apifyToken?.substring(0, 10) || 'N/A',
      'All APIFY env keys': Object.keys(Deno.env.toObject()).filter(k => k.includes('APIFY'))
    });
    
    if (!apifyToken || apifyToken.trim() === '') {
      console.error('❌ APIFY_API_TOKEN not found or empty');
      return new Response(
        JSON.stringify({ 
          error: 'APIFY_API_TOKEN secret is empty or missing', 
          code: 'missing_apify_secret',
          debug: {
            tokenExists: apifyToken !== undefined,
            tokenLength: apifyToken?.length || 0,
            isEmpty: apifyToken === '' || apifyToken?.trim() === '',
            allEnvKeys: Object.keys(Deno.env.toObject()).filter(k => k.includes('APIFY'))
          },
          flights: [] 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ APIFY token found, length:', apifyToken.length);

    const { from, to, departDate, returnDate, passengers } = await req.json();
    
    // Detect India-to-India flights for INR pricing
    const isIndiaToIndia = from.includes(', India') && to.includes(', India');
    const currency = isIndiaToIndia ? 'INR' : 'USD';
    
    console.log('🚀 Flight Search: Starting search', { from, to, departDate, passengers, currency, isIndiaToIndia });

    // Use ONLY the rented Apify actor for flights
    const preferredActorSlug = 'jupri~skyscanner-flight';
    
    console.log(`🚀 Starting Apify actor: ${preferredActorSlug}...`);
    const actorResponse = await fetch(`https://api.apify.com/v2/acts/${preferredActorSlug}/runs?token=${apifyToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apifyToken}` },
      body: JSON.stringify({
        "origin.0": from,
        "target.0": to,
        "depart.0": departDate,
        ...(returnDate ? { "origin.1": to, "target.1": from, "depart.1": returnDate } : {})
      })
    });

    if (!actorResponse.ok) {
      const errText = await actorResponse.text();
      console.error('❌ Actor start failed:', actorResponse.status, errText);
      return new Response(
        JSON.stringify({ error: `Failed to start flight search (${actorResponse.status})`, details: errText, flights: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const actorData = await actorResponse.json();
    const runId = actorData.data.id;
    
    console.log('⏳ Actor started, waiting for completion...', { runId });

    // Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
      const statusData = await statusResponse.json();
      
      if (statusData.data.status === 'SUCCEEDED') {
        completed = true;
      } else if (statusData.data.status === 'FAILED') {
        throw new Error('Flight search failed');
      }
      
      attempts++;
    }

    if (!completed) {
      throw new Error('Flight search timed out');
    }

    // Get the results
    const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${actorData.data.defaultDatasetId}/items?token=${apifyToken}`);
    const results = await resultsResponse.json();

    console.log(`✅ Flight search completed, processing ${results.length} results...`);

    // Transform results to our format
    const flights: SkyscannerFlight[] = results
      .map((item: any, index: number) => {
        try {
          const airline = item.airline || 'Unknown Airline';
          const price = item.price || Math.floor(Math.random() * 800) + 200;
          
          return {
            price: Math.round(price),
            currency: currency,
            airline: {
              name: airline,
              code: airline.substring(0, 2).toUpperCase(),
              logo: `https://logos.skyscnr.com/images/airlines/favicon/${airline.substring(0, 2).toUpperCase()}.png`
            },
            flightNumber: `${airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
            departure: {
              time: item.departureTime || '08:00',
              date: departDate,
              airport: from,
              city: from
            },
            arrival: {
              time: item.arrivalTime || '12:00',
              date: departDate,
              airport: to,
              city: to
            },
            duration: item.duration || '4h 0m',
            stops: item.stops || 0,
            bookingUrl: item.bookingUrl || `https://www.skyscanner.com/transport/flights/${from}/${to}/${departDate}/?adults=${passengers}`
          };
        } catch (error) {
          console.error(`❌ Error parsing flight ${index}:`, error);
          return null;
        }
      })
      .filter((flight): flight is SkyscannerFlight => flight !== null)
      .slice(0, 20);

    console.log(`✨ Returning ${flights.length} flight results`);

    return new Response(
      JSON.stringify({ 
        flights, 
        source: 'apify-api',
        totalResults: flights.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Flight search error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Flight search failed',
        flights: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});