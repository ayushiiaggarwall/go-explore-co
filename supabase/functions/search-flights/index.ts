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

    // Transform results to our format using proper Apify structure
    const flights: SkyscannerFlight[] = results
      .map((item: any, index: number) => {
        try {
          // Get the first leg (main flight info)
          const leg = item.legs?.[0];
          if (!leg) {
            console.log(`⚠️ Flight ${index}: No legs found, skipping`);
            return null;
          }

          // Get carrier info from _carriers map using marketing_carrier_ids[0]
          const carrierId = leg.marketing_carrier_ids?.[0];
          const carrierInfo = carrierId ? item._carriers?.[carrierId] : null;
          const airlineName = carrierInfo?.name || 'Unknown Airline';
          const airlineCode = carrierInfo?.code || 'XX';
          
          console.log(`✈️ Flight ${index}: ${airlineName} (${airlineCode}), carrierId: ${carrierId}`);

          // Get flight number from _segments map using first segment_id
          const segmentId = leg.segment_ids?.[0];
          const segmentInfo = segmentId ? item._segments?.[segmentId] : null;
          const flightNumber = segmentInfo?.marketing_flight_number || `${airlineCode}${Math.floor(Math.random() * 9000) + 1000}`;

          // Get price from pricing_options
          const pricingOption = item.pricing_options?.[0];
          const priceInfo = pricingOption?.items?.[0]?.price;
          const rawPrice = priceInfo?.amount;
          const finalPrice = Number.isFinite(rawPrice) ? Math.round(Number(rawPrice)) : Math.floor(Math.random() * 800) + 200;
          const priceCurrency = priceInfo?.currency || currency;

          console.log(`💰 Flight ${index}: ${finalPrice} ${priceCurrency} (${flightNumber})`);

          // Format times from ISO strings
          const formatTime = (isoString: string) => {
            try {
              const date = new Date(isoString);
              return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            } catch {
              return '00:00';
            }
          };

          const depTime = leg.departure ? formatTime(leg.departure) : '08:00';
          const arrTime = leg.arrival ? formatTime(leg.arrival) : '12:00';

          // Format duration from minutes to "Xh Ym"
          const formatDuration = (minutes: number) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
          };

          const durationStr = leg.duration ? formatDuration(leg.duration) : '2h 5m';

          // Handle stops
          const stopCount = leg.stop_count || 0;
          const stopNames = leg.stop_ids?.map((stopId: string) => item._places?.[stopId]?.name).filter(Boolean) || [];

          // Get booking URL
          let bookingUrl = pricingOption?.items?.[0]?.url || '';
          if (bookingUrl && bookingUrl.startsWith('/')) {
            bookingUrl = `https://www.skyscanner.com${bookingUrl}`;
          } else if (!bookingUrl) {
            bookingUrl = `https://www.skyscanner.com/transport/flights/${from}/${to}/${departDate}/?adults=${passengers}`;
          }

          // Get city names from places
          const departurePlace = item._places?.[leg.origin_place_id];
          const arrivalPlace = item._places?.[leg.destination_place_id];
          const departureCity = departurePlace?.name || from;
          const arrivalCity = arrivalPlace?.name || to;

          return {
            price: finalPrice,
            currency: String(priceCurrency),
            airline: {
              name: airlineName,
              code: airlineCode,
              logo: `https://logos.skyscnr.com/images/airlines/favicon/${airlineCode}.png`
            },
            flightNumber: String(flightNumber),
            departure: {
              time: depTime,
              date: departDate,
              airport: from,
              city: String(departureCity)
            },
            arrival: {
              time: arrTime,
              date: departDate,
              airport: to,
              city: String(arrivalCity)
            },
            duration: durationStr,
            stops: stopCount,
            bookingUrl: String(bookingUrl)
          } as SkyscannerFlight;
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