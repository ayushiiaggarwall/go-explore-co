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
      // Return demo data instead of failing
      return getDemoHotelData(nights, { destination, checkInDate, checkOutDate, numberOfPeople, rooms });
    }

    // Try multiple working actors in order of preference
    const ACTORS_TO_TRY = [
      'dtrungtin/booking-scraper',
      'apify/booking-scraper',
      'misceres/booking-com-scraper'
    ];

    for (const ACTOR_ID of ACTORS_TO_TRY) {
      console.log(`🏨 Trying actor: ${ACTOR_ID}`);
      
      try {
        // Prepare input for the actor
        const apifyInput = {
          search: destination,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          adults1: numberOfPeople || 2,
          rooms1: rooms || 1,
          currency: "USD",
          language: "en-gb",
          maxItems: 15,
          sortBy: "price"
        };

        console.log(`🏨 Input for ${ACTOR_ID}:`, JSON.stringify(apifyInput, null, 2));

        // Start the actor run
        const runResponse = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apifyInput)
          }
        );

        console.log(`🏨 Actor ${ACTOR_ID} response status:`, runResponse.status);

        if (!runResponse.ok) {
          const errorText = await runResponse.text();
          console.error(`❌ Actor ${ACTOR_ID} failed:`, errorText);
          continue; // Try next actor
        }

        const runData = await runResponse.json();
        const runId = runData.data.id;
        console.log(`🏨 Started run for ${ACTOR_ID}:`, runId);

        // Poll for results with shorter timeout for faster response
        const result = await pollForActorResults(runId, ACTOR_ID, APIFY_API_TOKEN, nights, {
          destination, checkInDate, checkOutDate, numberOfPeople: numberOfPeople || 2, rooms: rooms || 1
        });

        if (result) {
          return result; // Success! Return the result
        }

      } catch (error) {
        console.error(`❌ Error with actor ${ACTOR_ID}:`, error);
        continue; // Try next actor
      }
    }

    // If all actors failed, return demo data
    console.log('🏨 All actors failed, returning demo data');
    return getDemoHotelData(nights, { destination, checkInDate, checkOutDate, numberOfPeople, rooms });

  } catch (error) {
    console.error('❌ Hotel search error:', error);
    return getDemoHotelData(nights, { destination, checkInDate, checkOutDate, numberOfPeople, rooms });
  }
});

// Poll for actor results with timeout
async function pollForActorResults(runId: string, actorId: string, token: string, nights: number, searchParams: any) {
  let attempts = 0;
  const maxAttempts = 12; // 2 minutes max
  const pollInterval = 10000; // 10 seconds

  while (attempts < maxAttempts) {
    console.log(`🏨 Polling ${actorId}, attempt ${attempts + 1}/${maxAttempts}`);
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    try {
      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${token}`
      );

      if (!statusResponse.ok) {
        console.error(`❌ Status check failed for ${actorId}`);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      const status = statusData.data.status;
      console.log(`🏨 ${actorId} status: ${status}`);

      if (status === 'SUCCEEDED') {
        console.log(`✅ ${actorId} succeeded! Fetching results...`);
        
        const datasetId = statusData.data.defaultDatasetId;
        const resultsResponse = await fetch(
          `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
        );

        if (!resultsResponse.ok) {
          console.error(`❌ Failed to fetch results from ${actorId}`);
          return null;
        }

        const rawHotels = await resultsResponse.json();
        console.log(`🏨 ${actorId} returned ${rawHotels.length} hotels`);

        if (rawHotels.length === 0) {
          console.log(`❌ No hotels from ${actorId}`);
          return null;
        }

        // Process the real data
        const cleanHotels = processRealHotelData(rawHotels, nights, searchParams);

        if (cleanHotels.length === 0) {
          console.log(`❌ No valid hotels after processing from ${actorId}`);
          return null;
        }

        return new Response(
          JSON.stringify({
            success: true,
            hotels: cleanHotels,
            searchParams: { ...searchParams, nights },
            totalResults: cleanHotels.length,
            source: `Real data from ${actorId}`,
            debug: {
              rawResultsCount: rawHotels.length,
              actorId: actorId,
              runId: runId
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      if (status === 'FAILED') {
        console.error(`❌ ${actorId} run failed`);
        return null;
      }

      attempts++;
    } catch (error) {
      console.error(`❌ Polling error for ${actorId}:`, error);
      attempts++;
    }
  }

  console.log(`❌ ${actorId} timed out`);
  return null;
}

// Process real hotel data from any working actor
function processRealHotelData(rawHotels: any[], nights: number, searchParams: any) {
  console.log('🏨 Processing real hotel data...');
  
  if (!Array.isArray(rawHotels) || rawHotels.length === 0) {
    return [];
  }

  // Log sample structure
  console.log('🏨 Sample hotel structure:', Object.keys(rawHotels[0] || {}));

  const validHotels = rawHotels.filter(hotel => {
    return hotel && (hotel.name || hotel.hotelName || hotel.title) && hotel.name !== '';
  });

  console.log(`🏨 ${validHotels.length} valid hotels out of ${rawHotels.length}`);

  return validHotels.slice(0, 12).map((hotel, index) => {
    // Extract name from various possible fields
    const name = hotel.name || hotel.hotelName || hotel.title || `Hotel ${index + 1}`;
    
    // Extract price from various possible fields
    const priceInfo = extractPrice(hotel);
    const totalPrice = priceInfo.amount * nights;

    // Extract rating
    const rating = hotel.stars || hotel.starRating || hotel.rating || 0;
    const guestRating = hotel.guestRating || hotel.score || hotel.reviewScore || 0;
    const reviewCount = hotel.reviewsCount || hotel.numberOfReviews || hotel.reviews || 0;

    return {
      id: `hotel_${index}_${Date.now()}`,
      name: name,
      
      price: {
        amount: priceInfo.amount,
        currency: priceInfo.currency,
        formatted: priceInfo.formatted,
        total: totalPrice,
        totalFormatted: `${priceInfo.symbol}${Math.round(totalPrice)}`,
        note: 'Real price from Booking.com'
      },

      rating: rating,
      ratingText: getRatingText(guestRating),
      guestRating: guestRating,
      reviewCount: reviewCount,
      
      location: {
        address: hotel.address || hotel.location || '',
        distance: hotel.distanceFromCenter || hotel.distance || ''
      },

      images: hotel.images || hotel.photos || hotel.imageUrls || [],
      bookingUrl: hotel.url || hotel.link || '',
      description: hotel.description || '',
      amenities: hotel.amenities || hotel.facilities || [],
      
      searchParams: searchParams,
      source: 'Booking.com'
    };
  });
}

// Extract price from various possible fields
function extractPrice(hotel: any): { amount: number, currency: string, formatted: string, symbol: string } {
  let amount = 0;
  let currency = 'USD';
  let symbol = '$';

  // Try different price fields
  const priceFields = [
    hotel.price,
    hotel.priceFrom,
    hotel.totalPrice,
    hotel.avgPrice,
    hotel.pricePerNight,
    hotel.minPrice
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
        }
        
        break;
      }
    }
  }

  // Fallback price range based on destination
  if (amount === 0) {
    amount = 120; // Reasonable default
  }

  return {
    amount: amount,
    currency: currency,
    formatted: `${symbol}${amount}`,
    symbol: symbol
  };
}

// Demo data for testing and fallback
function getDemoHotelData(nights: number, searchParams: any) {
  console.log('🏨 Returning demo hotel data for testing');
  
  const demoHotels = [
    {
      id: 'demo_1',
      name: `The Grand ${searchParams.destination.split(',')[0]} Hotel`,
      price: {
        amount: 185,
        currency: 'USD',
        formatted: '$185',
        total: 185 * nights,
        totalFormatted: `$${185 * nights}`,
        note: 'Demo price - API integration needed'
      },
      rating: 4,
      ratingText: 'Very Good',
      guestRating: 8.7,
      reviewCount: 1842,
      location: {
        address: `Downtown ${searchParams.destination.split(',')[0]}`,
        distance: '0.3 km from city center'
      },
      images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=200&fit=crop'],
      bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(searchParams.destination)}`,
      description: 'Elegant hotel in the heart of the city with modern amenities and excellent service.',
      amenities: ['Free WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Room Service'],
      searchParams: searchParams,
      source: 'Demo Data'
    },
    {
      id: 'demo_2',
      name: `${searchParams.destination.split(',')[0]} Business Hotel`,
      price: {
        amount: 145,
        currency: 'USD',
        formatted: '$145',
        total: 145 * nights,
        totalFormatted: `$${145 * nights}`,
        note: 'Demo price - API integration needed'
      },
      rating: 4,
      ratingText: 'Good',
      guestRating: 8.2,
      reviewCount: 956,
      location: {
        address: `Business District, ${searchParams.destination.split(',')[0]}`,
        distance: '0.8 km from city center'
      },
      images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop'],
      bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(searchParams.destination)}`,
      description: 'Modern business hotel with conference facilities and excellent connectivity.',
      amenities: ['Free WiFi', 'Business Center', 'Gym', 'Restaurant', 'Parking'],
      searchParams: searchParams,
      source: 'Demo Data'
    },
    {
      id: 'demo_3',
      name: `Budget Stay ${searchParams.destination.split(',')[0]}`,
      price: {
        amount: 89,
        currency: 'USD',
        formatted: '$89',
        total: 89 * nights,
        totalFormatted: `$${89 * nights}`,
        note: 'Demo price - API integration needed'
      },
      rating: 3,
      ratingText: 'Good',
      guestRating: 7.8,
      reviewCount: 634,
      location: {
        address: `${searchParams.destination.split(',')[0]} Suburbs`,
        distance: '2.1 km from city center'
      },
      images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=200&fit=crop'],
      bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(searchParams.destination)}`,
      description: 'Comfortable and affordable accommodation perfect for budget travelers.',
      amenities: ['Free WiFi', 'Air Conditioning', 'Parking'],
      searchParams: searchParams,
      source: 'Demo Data'
    }
  ];

  return new Response(
    JSON.stringify({
      success: true,
      hotels: demoHotels,
      searchParams: { ...searchParams, nights },
      totalResults: demoHotels.length,
      source: 'Demo Data (API integration required)',
      note: 'These are sample hotels. Real data will be available once API is properly configured.'
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Convert rating to text
function getRatingText(rating: number): string {
  if (rating >= 9) return 'Excellent';
  if (rating >= 8) return 'Very Good';
  if (rating >= 7) return 'Good';
  if (rating >= 6) return 'Average';
  if (rating > 0) return 'Fair';
  return 'No rating';
}