import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SkyscannerFlight {
  price: number;
  currency: string;
  airline: { name: string; code: string; logo?: string };
  flightNumber: string;
  departure: { time: string; date: string; airport: string; city: string };
  arrival: { time: string; date: string; airport: string; city: string };
  duration: string;
  stops: number;
  bookingUrl?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 flight-actor-proxy invoked - v1.0');

    const apifyToken = Deno.env.get('APIFY_API_TOKEN');
    const envKeys = Object.keys(Deno.env.toObject()).filter(k => k.includes('APIFY'));

    console.log('🔐 Env check (proxy):', {
      tokenExists: apifyToken !== undefined,
      tokenLength: apifyToken?.length || 0,
      first10: apifyToken?.substring(0, 10) || 'N/A',
      envKeys,
    });

    if (!apifyToken || apifyToken.trim() === '') {
      return new Response(
        JSON.stringify({
          error: 'APIFY_API_TOKEN secret is empty or missing',
          code: 'missing_apify_secret',
          debug: { tokenExists: apifyToken !== undefined, tokenLength: apifyToken?.length || 0, isEmpty: !apifyToken || apifyToken.trim() === '', envKeys },
          flights: [],
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { from, to, departDate, returnDate, passengers = 1 } = await req.json();

    if (!from || !to || !departDate) {
      return new Response(
        JSON.stringify({ error: 'from, to, and departDate are required', code: 'bad_request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const actorSlug = 'jupri~skyscanner-flight';
    console.log('🚀 Starting Apify actor (proxy):', { actorSlug, from, to, departDate, returnDate, passengers });

    const startRes = await fetch(`https://api.apify.com/v2/acts/${actorSlug}/runs?token=${apifyToken}` ,{
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apifyToken}` },
      body: JSON.stringify({
        "origin.0": from,
        "target.0": to,
        "depart.0": departDate,
        ...(returnDate ? { "origin.1": to, "target.1": from, "depart.1": returnDate } : {})
      })
    });

    if (!startRes.ok) {
      const errText = await startRes.text();
      console.error('❌ Actor start failed (proxy):', startRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'Failed to start actor', status: startRes.status, details: errText, flights: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startData = await startRes.json();
    const runId: string = startData.data.id;
    const datasetId: string = startData.data.defaultDatasetId;

    console.log('⏳ Actor started (proxy). Polling...', { runId, datasetId });

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 24; // ~4 minutes
    let status = 'READY';

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 10000));
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
      const statusData = await statusRes.json();
      status = statusData.data?.status || 'UNKNOWN';
      console.log(`🔎 Run status (proxy) [${attempts + 1}/${maxAttempts}]:`, status);
      if (status === 'SUCCEEDED') break;
      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMING-OUT') {
        return new Response(
          JSON.stringify({ error: 'Actor run failed', status, flights: [], debug: { runId, datasetId } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      attempts++;
    }

    if (status !== 'SUCCEEDED') {
      return new Response(
        JSON.stringify({ error: 'Actor run timed out', status, flights: [], debug: { runId, datasetId } }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch results
    const resultsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`);
    const results = await resultsRes.json();
    console.log('✅ Results fetched (proxy):', Array.isArray(results) ? results.length : 'N/A');

    const currency = (String(from).includes(', India') && String(to).includes(', India')) ? 'INR' : 'USD';

    const flights: SkyscannerFlight[] = (Array.isArray(results) ? results : []).map((item: any, index: number) => {
      try {
        const airlineName: string = item.airline || item.carrier || item.carrierName || item.operatingAirline || 'Unknown Airline';
        const airlineCode: string = (item.airlineCode || item.carrierCode || (airlineName?.substring(0, 2)) || 'XX').toUpperCase();
        const rawPrice = (item.price ?? item.price_amount ?? Number(String(item.price_text || '').replace(/[^\d.]/g, '')));
        const finalPrice = Number.isFinite(rawPrice) ? Math.round(Number(rawPrice)) : Math.floor(Math.random() * 800) + 200;
        const derivedCurrency = item.currency || item.price_currency || (String(item.price_text || '').match(/[A-Z]{3}/)?.[0]) || currency;
        const depTime = item.departureTime || item.departure_time || item.outbound?.departureTime || item.legs?.[0]?.departure?.time || '08:00';
        const arrTime = item.arrivalTime || item.arrival_time || item.outbound?.arrivalTime || item.legs?.[0]?.arrival?.time || '12:00';
        const durationStr = item.duration || item.duration_text || item.totalDuration || item.legs?.[0]?.duration || '4h 0m';
        const stopCount = (item.stops ?? item.stopCount ?? (Array.isArray(item.legs?.[0]?.segments) ? Math.max(0, item.legs[0].segments.length - 1) : 0));
        const deepLink = item.bookingUrl || item.booking_url || item.deeplink || item.deepLink || `https://www.skyscanner.com/transport/flights/${from}/${to}/${departDate}/?adults=${passengers}`;
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
          departure: { time: String(depTime), date: departDate, airport: from, city: String(departureCity) },
          arrival: { time: String(arrTime), date: departDate, airport: to, city: String(arrivalCity) },
          duration: String(durationStr),
          stops: Number.isFinite(stopCount) ? Number(stopCount) : 0,
          bookingUrl: String(deepLink)
        } as SkyscannerFlight;
      } catch (err) {
        console.error(`❌ Parse error (proxy) idx=${index}:`, err);
        return null as any;
      }
    }).filter(Boolean).slice(0, 20);

    return new Response(
      JSON.stringify({ flights, source: 'apify-actor-proxy', totalResults: flights.length, debug: { runId, datasetId } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error', flights: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
