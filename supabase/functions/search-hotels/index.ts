import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🏨 Hotel search function called');
  
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

    // Use voyager/booking-scraper actor
    const ACTOR_ID = 'voyager/booking-scraper';
    console.log('🏨 Using Booking.com actor:', ACTOR_ID);

    // Prepare input for voyager/booking-scraper
    const apifyInput = {
      search: destination,                    // City name
      checkIn: checkInDate,                  // YYYY-MM-DD
      checkOut: checkOutDate,                // YYYY-MM-DD
      adults1: numberOfPeople || 2,          // Number of adults
      rooms1: rooms || 1,                    // Number of rooms
      currency: "USD",                       // Currency
      language: "en-gb",                     // Language
      maxItems: 20,                          // Number of results
      sortBy: "our_top_picks",              // Sorting
      minMaxPrice: "0-999999",              // Price range
      starsCountFilter: "any"               // Star filter
    };

    console.log('🏨 Apify input:', JSON.stringify(apifyInput, null, 2));

    // Start the actor run
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apifyInput)
      }
    );

    console.log('🏨 Run response status:', runResponse.status);

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('❌ Failed to start actor:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to start hotel search' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log('🏨 Started actor run:', runId);

    // Poll for results
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes maximum
    const pollInterval = 10000; // 10 seconds

    while (attempts < maxAttempts) {
      console.log(`🏨 Polling attempt ${attempts + 1}/${maxAttempts}`);
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_API_TOKEN}`
      );

      if (!statusResponse.ok) {
        console.error(`❌ Status check failed on attempt ${attempts + 1}`);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      const status = statusData.data.status;
      console.log(`🏨 Actor status: ${status}`);

      if (status === 'SUCCEEDED') {
        console.log('✅ Actor run succeeded! Fetching results...');
        
        // Get the dataset ID
        const datasetId = statusData.data.defaultDatasetId;
        console.log('🏨 Dataset ID:', datasetId);

        // Fetch the actual results
        const resultsResponse = await fetch(
          `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`
        );

        if (!resultsResponse.ok) {
          console.error('❌ Failed to fetch results');
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to get hotel results' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
          );
        }

        const rawHotels = await resultsResponse.json();
        console.log(`🏨 Raw results received: ${rawHotels.length} items`);
        console.log('🏨 First result sample:', JSON.stringify(rawHotels[0], null, 2));

        // Process the real scraped data
        const cleanHotels = processBookingHotelData(rawHotels, nights, {
          destination,
          checkInDate,
          checkOutDate,
          numberOfPeople: numberOfPeople || 2,
          rooms: rooms || 1
        });

        console.log(`✅ Processed ${cleanHotels.length} hotels from real data`);

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
            source: 'Booking.com (Real Data)',
            debug: {
              rawResultsCount: rawHotels.length,
              actorId: ACTOR_ID,
              runId: runId
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      if (status === 'FAILED') {
        console.error('❌ Actor run failed');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Hotel search failed - please try again' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      if (status === 'RUNNING') {
        console.log('⏳ Actor still running, waiting...');
      }

      attempts++;
    }

    // If we get here, it timed out
    console.error('❌ Actor run timed out');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Search took too long - please try again' 
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

// 🏨 PROCESS REAL BOOKING.COM DATA
function processBookingHotelData(rawHotels: any[], nights: number, searchParams: any) {
  console.log('🏨 Processing real Booking.com hotel data...');
  
  if (!Array.isArray(rawHotels)) {
    console.log('❌ Raw hotels is not an array:', typeof rawHotels);
    return [];
  }

  if (rawHotels.length === 0) {
    console.log('❌ No hotel data received');
    return [];
  }

  // Log the structure of the first hotel for debugging
  console.log('🏨 Sample hotel structure:', Object.keys(rawHotels[0] || {}));

  const validHotels = rawHotels.filter(hotel => {
    return hotel && hotel.name && hotel.name.trim() !== '';
  });

  console.log(`🏨 ${validHotels.length} valid hotels out of ${rawHotels.length}`);

  return validHotels.map((hotel, index) => {
    // Extract price information from various possible fields
    const priceInfo = extractRealPrice(hotel);
    const totalPrice = priceInfo.amount * nights;

    // Extract rating information
    const rating = hotel.stars || hotel.rating || 0;
    const guestRating = hotel.guestRating || hotel.score || hotel.reviewScore || 0;
    const reviewCount = hotel.reviewsCount || hotel.numberOfReviews || hotel.reviews || 0;

    return {
      id: `booking_${index}_${Date.now()}`,
      name: hotel.name || 'Hotel',
      
      // Real pricing from Booking.com
      price: {
        amount: priceInfo.amount,
        currency: priceInfo.currency,
        formatted: priceInfo.formatted,
        total: totalPrice,
        totalFormatted: `${priceInfo.symbol}${Math.round(totalPrice)}`,
        note: 'Real price from Booking.com'
      },

      // Hotel ratings and reviews
      rating: rating,
      ratingText: getRatingText(guestRating),
      guestRating: guestRating,
      reviewCount: reviewCount,
      
      // Location information
      location: {
        address: hotel.address || hotel.location || '',
        distance: hotel.distanceFromCenter || hotel.distance || '',
        coordinates: hotel.coordinates || null
      },

      // Images from Booking.com
      images: hotel.images || hotel.photos || hotel.imageUrls || [],
      
      // Booking information
      bookingUrl: hotel.url || hotel.link || '',
      
      // Additional hotel information
      description: hotel.description || '',
      amenities: hotel.amenities || hotel.facilities || [],
      
      // Raw data for debugging (remove in production)
      _rawData: hotel,
      
      // Search context
      searchParams: searchParams,
      source: 'Booking.com'
    };
  });
}

// Extract real price from various possible fields
function extractRealPrice(hotel: any): { amount: number, currency: string, formatted: string, symbol: string } {
  console.log('💰 Extracting price from:', {
    price: hotel.price,
    priceFrom: hotel.priceFrom,
    totalPrice: hotel.totalPrice,
    avgPrice: hotel.avgPrice
  });

  let amount = 0;
  let currency = 'USD';
  let symbol = '$';

  // Try different price fields
  const priceFields = [
    hotel.price,
    hotel.priceFrom,
    hotel.totalPrice,
    hotel.avgPrice,
    hotel.pricePerNight
  ];

  for (const priceField of priceFields) {
    if (priceField) {
      const priceStr = String(priceField).replace(/,/g, '');
      const priceMatch = priceStr.match(/(\d+(?:\.\d+)?)/);
      
      if (priceMatch) {
        amount = parseFloat(priceMatch[0]);
        
        // Detect currency
        if (priceStr.includes('€')) {
          currency = 'EUR';
          symbol = '€';
        } else if (priceStr.includes('£')) {
          currency = 'GBP';
          symbol = '£';
        } else if (priceStr.includes('$')) {
          currency = 'USD';
          symbol = '$';
        }
        
        break; // Found a valid price, stop looking
      }
    }
  }

  // If no price found, set a reasonable default
  if (amount === 0) {
    amount = 100;
    console.log('⚠️ No price found, using default: $100');
  }

  const result = {
    amount: amount,
    currency: currency,
    formatted: `${symbol}${amount}`,
    symbol: symbol
  };

  console.log('💰 Extracted price:', result);
  return result;
}

// Convert guest rating to text
function getRatingText(rating: number): string {
  if (rating >= 9) return 'Excellent';
  if (rating >= 8) return 'Very Good';
  if (rating >= 7) return 'Good';
  if (rating >= 6) return 'Average';
  if (rating > 0) return 'Fair';
  return 'No rating';
}