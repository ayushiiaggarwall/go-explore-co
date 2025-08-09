import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SkyscannerFlight {
  price: number;
  currency: string;
  airline: string;
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
    const apifyToken = Deno.env.get('APIFY_API_TOKEN');
    if (!apifyToken) {
      console.error('❌ APIFY_API_TOKEN not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'API token not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { from, to, departDate, returnDate, passengers } = await req.json();
    
    console.log('🚀 Flight Search: Starting search', { from, to, departDate, passengers });

    // Primary: Use Skyscanner scraper for reliable data
    let actorResponse;
    let actorType = 'skyscanner';
    
    console.log('🚀 Using Skyscanner scraper...');
    actorResponse = await fetch(`https://api.apify.com/v2/acts/jupri~skyscanner-flight/runs?token=${apifyToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: from,
        destination: to,
        departureDate: departDate,
        returnDate: returnDate || undefined,
        adults: passengers || 1,
        children: 0,
        infants: 0,
        currency: 'USD',
        locale: 'en-US'
      })
    });

    if (!actorResponse.ok) {
      console.error('❌ Failed to start Apify actor:', actorResponse.status);
      throw new Error('Failed to start flight search');
    }

    const actorData = await actorResponse.json();
    const runId = actorData.data.id;
    
    console.log('⏳ Actor started, waiting for completion...');

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

    console.log(`✅ Flight search completed using ${actorType}, processing results...`);

    // Transform results for Skyscanner actor format
    let flights: SkyscannerFlight[] = [];

    // Handle Skyscanner response format
    flights = results
      .filter((result: any) => result && result.price && result.price.amount)
      .slice(0, 20)
      .map((flight: any) => {
        // Extract departure and arrival times
        const departureTime = flight.legs?.[0]?.departure ? 
          new Date(flight.legs[0].departure).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
          }) : '00:00';
        
        const arrivalTime = flight.legs?.[0]?.arrival ? 
          new Date(flight.legs[0].arrival).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
          }) : '00:00';

        return {
          price: Math.round(flight.price.amount || 0),
          currency: flight.price.currency || 'USD',
          airline: flight.legs?.[0]?.carriers?.marketing?.[0]?.name || 'Unknown Airline',
          departure: {
            time: departureTime,
            date: departDate,
            airport: flight.legs?.[0]?.origin?.id || from,
            city: flight.legs?.[0]?.origin?.name?.split(' ')[0] || from
          },
          arrival: {
            time: arrivalTime,
            date: departDate,
            airport: flight.legs?.[0]?.destination?.id || to,
            city: flight.legs?.[0]?.destination?.name?.split(' ')[0] || to
          },
          duration: flight.legs?.[0]?.durationInMinutes ? 
            `${Math.floor(flight.legs[0].durationInMinutes / 60)}h ${flight.legs[0].durationInMinutes % 60}m` : 'N/A',
          stops: flight.legs?.[0]?.stopCount || 0,
          bookingUrl: flight.deeplink || `https://www.skyscanner.com/`
        };
      });

    console.log(`✨ Returning ${flights.length} flight results`);

    return new Response(
      JSON.stringify({ 
        flights, 
        source: actorType,
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
        flights: [] // Return empty array as fallback
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});