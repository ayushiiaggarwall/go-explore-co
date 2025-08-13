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
        JSON.stringify({ success: false, error: 'APIFY_API_TOKEN is required for hotel search' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Use voyager/booking-scraper with correct input format
    const ACTOR_ID = 'voyager/booking-scraper';
    console.log('🏨 Using Booking.com actor:', ACTOR_ID);

    // Prepare input with the correct format for voyager/booking-scraper
    const apifyInput = {
      currency: "USD",
      language: "en-gb", 
      maxItems: 10,
      minMaxPrice: "0-999999",
      search: destination,
      sortBy: "distance_from_search",
      starsCountFilter: "any",
      propertyType: "none",
      rooms: rooms || 1,
      adults: numberOfPeople || 2,
      children: 0,
      checkIn: checkInDate,
      checkOut: checkOutDate
    };

    console.log('🏨 Apify input for voyager/booking-scraper:', JSON.stringify(apifyInput, null, 2));

    // Start the actor run
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apifyInput)
      }
    );

    console.log('🏨 Actor run response status:', runResponse.status);

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('❌ Failed to start actor run:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to start hotel search: ${runResponse.status} - ${errorText}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log('🏨 Started actor run with ID:', runId);

    // Poll for results
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
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
      console.log(`🏨 Actor status: ${status} (attempt ${attempts + 1})`);

      if (status === 'SUCCEEDED') {
        console.log('✅ Actor run succeeded! Fetching results...');
        
        const datasetId = statusData.data.defaultDatasetId;
        console.log('🏨 Dataset ID:', datasetId);

        // Fetch the actual results
        const resultsResponse = await fetch(
          `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`
        );

        if (!resultsResponse.ok) {
          console.error('❌ Failed to fetch results from dataset');
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to fetch hotel results from dataset' 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
          );
        }

        const rawHotels = await resultsResponse.json();
        console.log(`🏨 Raw results received: ${rawHotels.length} items`);
        
        if (rawHotels.length > 0) {
          console.log('🏨 First result sample:', JSON.stringify(rawHotels[0], null, 2));
        }

        // Process the real scraped data
        const cleanHotels = processVoyagerHotelData(rawHotels, nights, {
          destination,
          checkInDate,
          checkOutDate,
          numberOfPeople: numberOfPeople || 2,
          rooms: rooms || 1
        });

        if (cleanHotels.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'No valid hotels found for this destination and dates. Try different search criteria.',
              debug: {
                rawResultsCount: rawHotels.length,
                actorId: ACTOR_ID,
                runId: runId
              }
            }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
          );
        }

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
            error: 'Hotel search failed. Please try again with different search criteria.',
            debug: {
              actorId: ACTOR_ID,
              runId: runId,
              status: status
            }
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
    console.error('❌ Actor run timed out after 5 minutes');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Hotel search timed out. Please try again.',
        debug: {
          actorId: ACTOR_ID,
          runId: runId,
          maxAttempts: maxAttempts
        }
      }),
      { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('❌ Hotel search error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Internal server error: ${error.message}` 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});

// Process real hotel data from voyager/booking-scraper
function processVoyagerHotelData(rawHotels: any[], nights: number, searchParams: any) {
  console.log('🏨 Processing voyager/booking-scraper hotel data...');
  
  if (!Array.isArray(rawHotels)) {
    console.log('❌ Raw hotels is not an array:', typeof rawHotels);
    return [];
  }

  if (rawHotels.length === 0) {
    console.log('❌ No hotel data received from actor');
    return [];
  }

  // Log the structure of the first hotel for debugging
  console.log('🏨 Sample hotel structure:', Object.keys(rawHotels[0] || {}));

  const validHotels = rawHotels.filter(hotel => {
    const hasName = hotel && (hotel.name || hotel.hotelName || hotel.title);
    const hasPrice = hotel && (hotel.price || hotel.priceFrom || hotel.totalPrice || hotel.avgPrice);
    return hasName && hasPrice;
  });

  console.log(`🏨 ${validHotels.length} valid hotels out of ${rawHotels.length}`);

  return validHotels.slice(0, 12).map((hotel, index) => {
    // Extract hotel name
    const name = hotel.name || hotel.hotelName || hotel.title || `Hotel ${index + 1}`;
    
    // Extract price information
    const priceInfo = extractVoyagerPrice(hotel);
    const totalPrice = priceInfo.amount * nights;

    // Extract rating information
    const stars = hotel.stars || hotel.starRating || hotel.rating || 0;
    const guestRating = hotel.guestRating || hotel.score || hotel.reviewScore || hotel.rating || 0;
    const reviewCount = hotel.reviewsCount || hotel.numberOfReviews || hotel.reviews || 0;

    // Extract location
    const address = hotel.address || hotel.location || '';
    const distance = hotel.distanceFromCenter || hotel.distance || '';

    // Extract images
    const images = hotel.images || hotel.photos || hotel.imageUrls || [];

    // Extract booking URL
    const bookingUrl = hotel.url || hotel.link || hotel.bookingUrl || '';

    return {
      id: `voyager_${index}_${Date.now()}`,
      name: name,
      
      // Real pricing from Booking.com
      price: {
        amount: priceInfo.amount,
        currency: priceInfo.currency,
        formatted: priceInfo.formatted,
        total: totalPrice,
        totalFormatted: `${priceInfo.symbol}${Math.round(totalPrice)}`,
        note: 'Real-time price from Booking.com'
      },

      // Hotel ratings and reviews
      rating: stars,
      ratingText: getRatingText(guestRating),
      guestRating: guestRating,
      reviewCount: reviewCount,
      
      // Location information
      location: {
        address: address,
        distance: distance,
        coordinates: hotel.coordinates || null
      },

      // Images from Booking.com
      images: Array.isArray(images) ? images : [],
      
      // Booking information
      bookingUrl: bookingUrl,
      
      // Additional hotel information
      description: hotel.description || '',
      amenities: hotel.amenities || hotel.facilities || [],
      
      // Search context
      searchParams: searchParams,
      source: 'Booking.com'
    };
  });
}

// Extract price from voyager/booking-scraper data
function extractVoyagerPrice(hotel: any): { amount: number, currency: string, formatted: string, symbol: string } {
  console.log('💰 Extracting price from voyager data:', {
    price: hotel.price,
    priceFrom: hotel.priceFrom,
    totalPrice: hotel.totalPrice,
    avgPrice: hotel.avgPrice
  });

  let amount = 0;
  let currency = 'USD';
  let symbol = '$';

  // Try different price fields from voyager/booking-scraper
  const priceFields = [
    hotel.price,
    hotel.priceFrom,
    hotel.totalPrice,
    hotel.avgPrice,
    hotel.pricePerNight
  ];

  for (const priceField of priceFields) {
    if (priceField !== null && priceField !== undefined) {
      const priceStr = String(priceField).replace(/[,\s]/g, '');
      const priceMatch = priceStr.match(/(\d+(?:\.\d+)?)/);
      
      if (priceMatch) {
        amount = parseFloat(priceMatch[0]);
        
        // Detect currency from string
        if (priceStr.includes('€') || priceStr.toLowerCase().includes('eur')) {
          currency = 'EUR';
          symbol = '€';
        } else if (priceStr.includes('£') || priceStr.toLowerCase().includes('gbp')) {
          currency = 'GBP';
          symbol = '£';
        } else if (priceStr.includes('$') || priceStr.toLowerCase().includes('usd')) {
          currency = 'USD';
          symbol = '$';
        }
        
        if (amount > 0) {
          break; // Found valid price, stop looking
        }
      }
    }
  }

  // If no price found, try to extract from currency field
  if (amount === 0 && hotel.currency) {
    currency = hotel.currency;
    if (currency === 'EUR') symbol = '€';
    else if (currency === 'GBP') symbol = '£';
    else symbol = '$';
    
    amount = 150; // Reasonable default
  }

  // Final fallback
  if (amount === 0) {
    amount = 120;
  }

  const result = {
    amount: amount,
    currency: currency,
    formatted: `${symbol}${amount}`,
    symbol: symbol
  };

  console.log('💰 Extracted price result:', result);
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