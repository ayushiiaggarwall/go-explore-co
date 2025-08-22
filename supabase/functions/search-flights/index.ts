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

function generateMockFlights(from: string, to: string, departDate: string, passengers: number): SkyscannerFlight[] {
  const airlines = [
    { name: 'IndiGo', code: '6E' },
    { name: 'Air India', code: 'AI' },
    { name: 'SpiceJet', code: 'SG' },
    { name: 'Vistara', code: 'UK' },
    { name: 'AirAsia India', code: 'I5' },
    { name: 'GoAir', code: 'G8' }
  ];
  
  const flights: SkyscannerFlight[] = [];
  
  for (let i = 0; i < 8; i++) {
    const airline = airlines[i % airlines.length];
    const departureHour = 6 + (i * 2);
    const price = 4500 + (i * 500) + Math.floor(Math.random() * 1000);
    const stops = i < 3 ? 0 : Math.floor(Math.random() * 2);
    
    flights.push({
      price,
      currency: 'INR',
      airline: {
        name: airline.name,
        code: airline.code,
        logo: `https://logos.skyscnr.com/images/airlines/favicon/${airline.code}.png`
      },
      flightNumber: `${airline.code}${1000 + i}`,
      departure: {
        time: `${departureHour.toString().padStart(2, '0')}:${(i * 5).toString().padStart(2, '0')}`,
        date: departDate,
        airport: 'MAA',
        city: 'Chennai'
      },
      arrival: {
        time: `${(departureHour + 2).toString().padStart(2, '0')}:${(i * 5).toString().padStart(2, '0')}`,
        date: departDate,
        airport: 'BOM',
        city: 'Mumbai'
      },
      duration: stops === 0 ? '2h 5m' : '3h 45m',
      stops,
      bookingUrl: `https://www.skyscanner.com/transport/flights/MAA/BOM/${departDate}/?adults=${passengers}`
    });
  }
  
  return flights.sort((a, b) => a.price - b.price);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 search-flights invoked - version 2.0');
    const apifyToken = Deno.env.get('APIFY_API_TOKEN');
    console.log('🔐 Environment variables check:', {
      'APIFY_API_TOKEN': Boolean(Deno.env.get('APIFY_API_TOKEN')),
      'APIFY_TOKEN': Boolean(Deno.env.get('APIFY_TOKEN')),
      'All env keys': Object.keys(Deno.env.toObject()).filter(k => k.includes('APIFY'))
    });
    
    // TEMPORARY: Skip APIFY API and return mock data for testing
    console.log('⚠️ TEMPORARY: Bypassing APIFY API to test application flow');
    
    const { from, to, departDate, returnDate, passengers } = await req.json();
    
    // Generate realistic mock flights
    const mockFlights = generateMockFlights(from, to, departDate, passengers || 1);
    
    console.log(`✨ Returning ${mockFlights.length} mock flight results`);

    return new Response(
      JSON.stringify({ 
        flights: mockFlights, 
        source: 'mock-data-bypass',
        totalResults: mockFlights.length 
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