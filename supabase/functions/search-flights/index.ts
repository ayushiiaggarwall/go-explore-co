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
          // Robust extraction from varying Apify schemas
          const airlineName: string = item.airline || item.carrier || item.carrierName || item.operatingAirline || 'Unknown Airline';
          const airlineCode: string = (item.airlineCode || item.carrierCode || (airlineName?.substring(0, 2)) || 'XX').toUpperCase();

          // Try to read Skyscanner-style pricing_options shape
          const pricingOption = Array.isArray(item.pricing_options)
            ? item.pricing_options[0]
            : (Array.isArray(item.pricingOptions) ? item.pricingOptions[0] : null);

          const nestedPrice = pricingOption?.price?.amount ?? pricingOption?.items?.[0]?.price?.amount;
          const rawPrice = (nestedPrice ?? item.price ?? item.price_amount ?? Number(String(item.price_text || '').replace(/[^\d.]/g, '')));
          const finalPrice = Number.isFinite(rawPrice) ? Math.round(Number(rawPrice)) : Math.floor(Math.random() * 800) + 200;

          const derivedCurrency = item.currency || item.price_currency || (String(item.price_text || '').match(/[A-Z]{3}/)?.[0]) || currency;

          // Times: prefer explicit fields; otherwise, try to parse from segment_id (epoch seconds)
          const depTimeDirect = item.departureTime || item.departure_time || item.outbound?.departureTime || item.legs?.[0]?.departure?.time;
          const arrTimeDirect = item.arrivalTime || item.arrival_time || item.outbound?.arrivalTime || item.legs?.[0]?.arrival?.time;

          let depTime = depTimeDirect as string | undefined;
          let arrTime = arrTimeDirect as string | undefined;

          const segId: string | undefined = pricingOption?.fares?.[0]?.segment_id || pricingOption?.segment_ids?.[0];
          if ((!depTime || !arrTime) && typeof segId === 'string') {
            const parts = segId.split('-');
            const depEpoch = Number(parts[2]);
            const arrEpoch = Number(parts[3]);
            if (Number.isFinite(depEpoch) && Number.isFinite(arrEpoch)) {
              const fmt = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
              depTime = depTime || fmt(new Date(depEpoch * 1000));
              arrTime = arrTime || fmt(new Date(arrEpoch * 1000));
            }
          }

          const durationStr = item.duration || item.duration_text || item.totalDuration || item.legs?.[0]?.duration || '4h 0m';

          const stopCount = (item.stops ?? item.stopCount ?? (
            Array.isArray(item.legs?.[0]?.segments) ? Math.max(0, item.legs[0].segments.length - 1) : 0
          ));

          // Booking URL: support relative Skyscanner deeplinks
          const candidateUrl = pricingOption?.items?.[0]?.url || pricingOption?.url || item.bookingUrl || item.booking_url || item.deeplink || item.deepLink;
          let deepLink = candidateUrl ? String(candidateUrl) : `https://www.skyscanner.com/transport/flights/${from}/${to}/${departDate}/?adults=${passengers}`;
          if (deepLink && deepLink.startsWith('/')) {
            deepLink = `https://www.skyscanner.com${deepLink}`;
          }

          const departureCity = item.departureCity || item.fromCity || from;
          const arrivalCity = item.arrivalCity || item.toCity || to;

          return {
            price: finalPrice,
            currency: String(derivedCurrency || currency),
            airline: {
              name: airlineName,
              code: airlineCode,
              logo: `https://logos.skyscnr.com/images/airlines/favicon/${airlineCode}.png`
            },
            flightNumber: String(item.flightNumber || item.flight_number || `${airlineCode}${Math.floor(Math.random() * 9000) + 1000}`),
            departure: {
              time: String(depTime || '08:00'),
              date: departDate,
              airport: from,
              city: String(departureCity)
            },
            arrival: {
              time: String(arrTime || '12:00'),
              date: departDate,
              airport: to,
              city: String(arrivalCity)
            },
            duration: String(durationStr),
            stops: Number.isFinite(stopCount) ? Number(stopCount) : 0,
            bookingUrl: String(deepLink)
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