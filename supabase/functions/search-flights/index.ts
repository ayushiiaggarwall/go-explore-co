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

    // Primary: Use Google Flights scraper for better accuracy
    let actorResponse;
    let actorType = 'google-flights';
    
    try {
      console.log('🚀 Trying Google Flights scraper first...');
      actorResponse = await fetch(`https://api.apify.com/v2/acts/canadesk~google-flights/runs?token=${apifyToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          departure: from,
          arrival: to,
          departureDate: departDate,
          returnDate: returnDate || null,
          adults: passengers || 1,
          children: 0,
          infants: 0,
          mode: returnDate ? "roundTrip" : "oneWay"
        })
      });
    } catch (error) {
      console.log('⚠️ Google Flights failed, trying free flight scraper...');
      actorType = 'free-scraper';
      actorResponse = await fetch(`https://api.apify.com/v2/acts/jindrich.bar~free-flight-ticket-scraper/runs?token=${apifyToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromCode: from,
          toCode: to,
          fromDate: departDate,
          toDate: returnDate || null,
          adults: passengers || 1,
          directFlightsOnly: false
        })
      });
    }

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

    // Transform results based on actor type

    let flights: SkyscannerFlight[] = [];

    if (actorType === 'google-flights') {
      // Handle Google Flights response format
      flights = results
        .filter((result: any) => result && result.flights && result.flights.length > 0)
        .flatMap((result: any) => 
          result.flights.slice(0, 20).map((flight: any) => ({
            price: parseFloat(flight.price?.replace(/[^0-9.]/g, '') || '0'),
            currency: 'USD',
            airline: flight.airline || 'Unknown Airline',
            departure: {
              time: flight.departure?.time || '00:00',
              date: departDate,
              airport: flight.departure?.airport || from,
              city: flight.departure?.airport?.replace(/[,\s]+\w+$/, '') || from
            },
            arrival: {
              time: flight.arrival?.time || '00:00',
              date: departDate,
              airport: flight.arrival?.airport || to,
              city: flight.arrival?.airport?.replace(/[,\s]+\w+$/, '') || to
            },
            duration: flight.duration || 'N/A',
            stops: flight.stops || 0,
            bookingUrl: flight.bookingUrl || `https://www.google.com/flights`
          }))
        );
    } else {
      // Handle Free Flight Scraper response format
      flights = results
        .filter((result: any) => result && result.price)
        .slice(0, 20)
        .map((flight: any) => ({
          price: Math.round(flight.price || 0),
          currency: flight.currency || 'USD',
          airline: flight.airline || 'Unknown Airline',
          departure: {
            time: flight.departureTime || '00:00',
            date: departDate,
            airport: from,
            city: from.replace(/[,\s]+\w+$/, '')
          },
          arrival: {
            time: flight.arrivalTime || '00:00',
            date: departDate,
            airport: to,
            city: to.replace(/[,\s]+\w+$/, '')
          },
          duration: flight.duration || 'N/A',
          stops: flight.stops === 'Direct' ? 0 : (flight.stops?.match(/\d+/) ? parseInt(flight.stops.match(/\d+/)[0]) : 0),
          bookingUrl: flight.bookingUrl || `https://www.google.com/flights`
        }));
    }

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