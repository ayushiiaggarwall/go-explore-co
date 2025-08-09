import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🏨 Booking.com hotel search function called');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const body = await req.json();
    console.log('🏨 Request body:', body);

    const { destination, checkInDate, checkOutDate, numberOfPeople, rooms } = body;

    // Validate required fields
    if (!destination || !checkInDate || !checkOutDate) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: destination, checkInDate, checkOutDate' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    if (checkIn >= checkOut) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Check-out date must be after check-in date' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`🏨 Searching for ${nights} nights`);

    // Get API token
    const APIFY_API_TOKEN = Deno.env.get('APIFY_API_TOKEN');
    if (!APIFY_API_TOKEN) {
      console.error('❌ APIFY_API_TOKEN not found');
      return new Response(
        JSON.stringify({ success: false, error: 'API configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // 🏨 Use Simple Booking Scraper - Free and reliable
    const ACTOR_ID = 'dtrungtin/simple-booking-scraper';
    console.log('🏨 Using Booking.com actor:', ACTOR_ID);

    // Prepare Booking.com input
    const apifyInput = {
      search: destination,           // City name like "New York", "London"
      checkIn: checkInDate,         // YYYY-MM-DD format
      checkOut: checkOutDate,       // YYYY-MM-DD format
      adults1: numberOfPeople || 2, // Number of adults
      currency: "USD",              // Currency
      language: "en-gb",            // Language
      maxPages: 2,                  // Limit pages for cost control
      sortBy: "distance_from_search" // Sort by distance
    };

    console.log('🏨 Booking.com input:', apifyInput);

    // Start Booking.com actor run
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apifyInput)
      }
    );

    if (!runResponse.ok) {
      console.error('❌ Booking.com API failed:', runResponse.status);
      const errorText = await runResponse.text();
      console.error('❌ Error details:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to start hotel search - please try again' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log('🏨 Started Booking.com run:', runId);

    // Poll for results with timeout
    let attempts = 0;
    const maxAttempts = 20; // 3+ minutes timeout

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second wait

      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_API_TOKEN}`
      );

      if (!statusResponse.ok) {
        console.log(`❌ Status check failed, attempt ${attempts + 1}`);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`🏨 Status: ${statusData.data.status} (attempt ${attempts + 1})`);

      if (statusData.data.status === 'SUCCEEDED') {
        console.log('✅ Booking.com search succeeded');
        
        const resultsResponse = await fetch(
          `https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items?token=${APIFY_API_TOKEN}`
        );

        if (!resultsResponse.ok) {
          console.error('❌ Failed to get results');
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to get hotel results' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
          );
        }

        const rawHotels = await resultsResponse.json();
        console.log(`🏨 Found ${rawHotels.length} hotels from Booking.com`);

        // Clean Booking.com hotel data
        const cleanHotels = cleanBookingHotelData(rawHotels, nights, {
          destination,
          checkInDate,
          checkOutDate,
          numberOfPeople: numberOfPeople || 2,
          rooms: rooms || 1
        });

        console.log(`🏨 Cleaned to ${cleanHotels.length} valid hotels`);

        return new Response(
          JSON.stringify({
            success: true,
            hotels: cleanHotels,
            searchParams: {
              destination,
              checkInDate,
              checkOutDate,
              numberOfPeople: numberOfPeople || 2,
              rooms: rooms || 1,
              nights
            },
            totalResults: cleanHotels.length,
            source: 'Booking.com'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      if (statusData.data.status === 'FAILED') {
        console.error('❌ Booking.com search failed');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Hotel search failed - please try a different destination' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      attempts++;
    }

    console.error('❌ Hotel search timeout');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Search timeout - please try again or use a more specific city name' 
      }),
      { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('❌ Hotel search error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});

// 🏨 BOOKING.COM DATA CLEANING
function cleanBookingHotelData(rawHotels: any[], nights: number, searchParams: any) {
  console.log('🏨 Cleaning Booking.com hotel data...');
  
  if (!Array.isArray(rawHotels)) {
    console.log('❌ Invalid hotel data format');
    return [];
  }

  const validHotels = rawHotels.filter(hotel => {
    return hotel && hotel.name && (hotel.price || hotel.rooms);
  });

  console.log(`🏨 ${validHotels.length} valid hotels out of ${rawHotels.length}`);

  return validHotels.map((hotel, index) => {
    // Extract price from first available room or hotel price
    const priceInfo = extractBookingPrice(hotel);
    const totalPrice = priceInfo.amount * nights;

    return {
      id: `booking_${index}_${hotel.name?.replace(/\s+/g, '_').toLowerCase()}`,
      name: hotel.name || 'Hotel',
      
      // Real pricing from Booking.com - SAME STRUCTURE AS BEFORE
      price: {
        amount: priceInfo.amount,
        currency: priceInfo.currency,
        formatted: priceInfo.formatted,
        total: totalPrice,
        totalFormatted: `${priceInfo.currency === 'USD' ? '$' : ''}${Math.round(totalPrice)}`,
        priceRange: priceInfo.formatted // Keep existing field for compatibility
      },

      // Hotel details - SAME STRUCTURE AS BEFORE
      rating: hotel.rated || hotel.rating || 0,
      ratingText: getRatingText(hotel.rated || hotel.rating || 0),
      reviewCount: 0, // Booking.com doesn't provide review count in this format
      
      // Location - SAME STRUCTURE AS BEFORE
      location: {
        address: hotel.address || '',
        neighborhood: '',
        distanceFromCenter: ''
      },

      // Images and amenities - SAME STRUCTURE AS BEFORE
      images: hotel.images || hotel.photos || [],
      amenities: [], // Booking.com data doesn't include amenities in this format
      
      // Booking URL - SAME STRUCTURE AS BEFORE (renamed for compatibility)
      tripAdvisorUrl: hotel.url || '', // Keep same field name for frontend compatibility
      
      // Hotel description - SAME STRUCTURE AS BEFORE
      description: hotel.description || '',
      hotelClass: hotel.stars || 0,
      
      // Search context - SAME STRUCTURE AS BEFORE
      searchParams: searchParams,
      
      // Additional Booking.com specific data
      bookingUrl: hotel.url || '',
      rooms: hotel.rooms || [],
      source: 'Booking.com'
    };
  });
}

function extractBookingPrice(hotel: any): { amount: number, currency: string, formatted: string } {
  // Try to get price from rooms first
  if (hotel.rooms && hotel.rooms.length > 0) {
    const room = hotel.rooms[0];
    if (room.price && room.currency) {
      const amount = parseFloat(room.price) || 0;
      const currency = room.currency.trim() || 'USD';
      return {
        amount: amount,
        currency: currency,
        formatted: `${currency === 'USD' ? '$' : currency}${amount}`
      };
    }
  }

  // Fallback to hotel price
  if (hotel.price) {
    const priceMatch = String(hotel.price).match(/(\d+(?:\.\d+)?)/);
    const amount = priceMatch ? parseFloat(priceMatch[0]) : 0;
    return {
      amount: amount,
      currency: 'USD',
      formatted: `$${amount}`
    };
  }

  // Default fallback
  return {
    amount: 0,
    currency: 'USD',
    formatted: 'Price on request'
  };
}

function getRatingText(rating: number): string {
  if (rating >= 9) return 'Excellent';
  if (rating >= 8) return 'Very Good';
  if (rating >= 7) return 'Good';
  if (rating >= 6) return 'Average';
  if (rating > 0) return 'Fair';
  return 'No rating';
}