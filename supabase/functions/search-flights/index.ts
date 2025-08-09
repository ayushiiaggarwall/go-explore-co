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

    // Start the Apify actor for Skyscanner scraping
    const actorResponse = await fetch(`https://api.apify.com/v2/acts/dtrungtin~skyscanner-scraper/runs?token=${apifyToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromEntityId: from,
        toEntityId: to,
        departDate: departDate,
        returnDate: returnDate || undefined,
        adults: passengers || 1,
        children: 0,
        infants: 0,
        cabinClass: 'economy',
        currency: 'USD',
        locale: 'en-US',
        market: 'US'
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

    console.log('✅ Flight search completed, processing results...');

    // Transform results to our format
    const flights: SkyscannerFlight[] = results
      .filter((result: any) => result.itineraries && result.itineraries.length > 0)
      .flatMap((result: any) => 
        result.itineraries.slice(0, 10).map((itinerary: any) => {
          const leg = itinerary.legs[0]; // Take first leg for outbound
          const segments = leg.segments || [];
          const firstSegment = segments[0] || {};
          const lastSegment = segments[segments.length - 1] || {};

          return {
            price: Math.round(itinerary.price?.amount || 0),
            currency: itinerary.price?.unit || 'USD',
            airline: firstSegment.marketingCarrier?.name || 'Unknown Airline',
            departure: {
              time: firstSegment.departure?.split('T')[1]?.substring(0, 5) || '00:00',
              date: firstSegment.departure?.split('T')[0] || departDate,
              airport: firstSegment.origin?.displayCode || from,
              city: firstSegment.origin?.name || from
            },
            arrival: {
              time: lastSegment.arrival?.split('T')[1]?.substring(0, 5) || '00:00',
              date: lastSegment.arrival?.split('T')[0] || departDate,
              airport: lastSegment.destination?.displayCode || to,
              city: lastSegment.destination?.name || to
            },
            duration: leg.durationInMinutes ? `${Math.floor(leg.durationInMinutes / 60)}h ${leg.durationInMinutes % 60}m` : 'N/A',
            stops: leg.stopCount || 0,
            bookingUrl: itinerary.deeplink || `https://www.skyscanner.com/transport/flights/${from}/${to}/${departDate.replace(/-/g, '')}/`
          };
        })
      )
      .slice(0, 15); // Limit to 15 results

    console.log(`✨ Returning ${flights.length} flight results`);

    return new Response(
      JSON.stringify({ flights }),
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