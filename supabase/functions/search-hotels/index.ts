import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TripAdvisorHotel {
  name: string;
  rating?: number;
  numberOfReviews?: number;
  price?: string;
  priceRange?: string;
  address?: string;
  location?: string;
  images?: string[];
  photos?: string[];
  amenities?: string[];
  features?: string[];
  url?: string;
  link?: string;
  id?: string;
  description?: string;
  hotelClass?: number;
  stars?: number;
  ranking?: string;
  awards?: any[];
  neighborhood?: string;
  distanceFromCenter?: string;
}

interface CleanHotel {
  id: string;
  name: string;
  price: {
    amount: number;
    currency: string;
    formatted: string;
    total: number;
    totalFormatted: string;
    priceRange: string;
  };
  rating: number;
  ratingText: string;
  reviewCount: number;
  location: {
    address: string;
    neighborhood: string;
    distanceFromCenter: string;
  };
  images: string[];
  amenities: string[];
  tripAdvisorUrl: string;
  rankingPosition: string;
  awards: any[];
  description: string;
  hotelClass: number;
  searchParams: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🏨 HOTEL search function called - NOT flight search');

    // Check request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { 
      destination, 
      checkInDate, 
      checkOutDate, 
      numberOfPeople, 
      rooms 
    } = body;

    console.log('🏨 Hotel search request body:', { destination, checkInDate, checkOutDate, numberOfPeople, rooms });

    // Validate required fields
    if (!destination || !checkInDate || !checkOutDate) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: destination, checkInDate, checkOutDate'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    if (checkIn >= checkOut) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Check-out date must be after check-in date'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate number of nights
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`🏨 Searching for ${nights} nights`);

    // 🏨 IMPORTANT: Use correct TripAdvisor actor for HOTELS
    const ACTOR_ID = 'maxcopell/tripadvisor';
    const APIFY_API_TOKEN = Deno.env.get('APIFY_API_TOKEN');
    
    console.log('🏨 Using TripAdvisor actor:', ACTOR_ID);

    if (!APIFY_API_TOKEN) {
      console.error('❌ Missing APIFY_API_TOKEN');
      return new Response(JSON.stringify({
        success: false,
        error: 'API configuration error - missing token'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apifyInput = {
      searchTerm: destination,
      contentType: "hotels",
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      maxItems: 20,
      language: "en",
      currency: "USD"
    };

    console.log('🚀 Calling TripAdvisor actor:', apifyInput);

    // Start Apify actor run
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apifyInput)
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('❌ Apify start failed:', runResponse.status, errorText);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to start hotel search'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    console.log('🏃 Actor run started:', runId);

    // Poll for results with reduced timeout
    let attempts = 0;
    const maxAttempts = 15; // 2.5 minutes timeout (reduced from 5 minutes)

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      try {
        const statusResponse = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_API_TOKEN}`
        );

        if (!statusResponse.ok) {
          console.error(`❌ Status check failed: ${statusResponse.status}`);
          attempts++;
          continue;
        }

        const statusData = await statusResponse.json();
        console.log(`📊 Run status: ${statusData.data.status} (attempt ${attempts + 1})`);

        if (statusData.data.status === 'SUCCEEDED') {
          // Fetch the results
          const resultsResponse = await fetch(
            `https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items?token=${APIFY_API_TOKEN}`
          );

          if (!resultsResponse.ok) {
            console.error('❌ Failed to fetch results');
            return new Response(JSON.stringify({
              success: false,
              error: 'Failed to get search results'
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const rawHotels = await resultsResponse.json();
          console.log(`✅ TripAdvisor API success: ${rawHotels.length} hotels found`);

          // Clean and format hotel data
          const cleanHotels = cleanTripAdvisorHotelData(rawHotels, nights, {
            destination,
            checkInDate,
            checkOutDate,
            numberOfPeople: numberOfPeople || 2,
            rooms: rooms || 1
          });

          return new Response(JSON.stringify({
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
            totalResults: cleanHotels.length
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (statusData.data.status === 'FAILED') {
          console.error('❌ Actor run failed with status:', statusData.data.status);
          return new Response(JSON.stringify({
            success: false,
            error: 'Hotel search failed - please try again'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (statusData.data.status === 'RUNNING' && attempts >= 10) {
          // If still running after 10 attempts (100 seconds), return timeout
          console.error('❌ Actor run did not complete successfully:', statusData.data.status);
          return new Response(JSON.stringify({
            success: false,
            error: 'Search timeout - please try a more specific location'
          }), {
            status: 408,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      } catch (pollError) {
        console.error('❌ Polling error:', pollError);
        attempts++;
        continue;
      }

      attempts++;
    }

    // Final timeout
    console.error('❌ Search timeout after', maxAttempts, 'attempts');
    return new Response(JSON.stringify({
      success: false,
      error: 'Search timeout - please try again with a more specific destination'
    }), {
      status: 408,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ TripAdvisor API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ✨ DATA CLEANING FUNCTION ✨
function cleanTripAdvisorHotelData(rawHotels: TripAdvisorHotel[], nights: number, searchParams: any): CleanHotel[] {
  if (!Array.isArray(rawHotels)) {
    console.log('No hotel data received');
    return [];
  }

  return rawHotels.filter(hotel => {
    // Filter out invalid hotels
    return hotel && hotel.name && (hotel.price || hotel.priceRange);
  }).map(hotel => {
    // Extract and clean price data
    const priceInfo = extractPriceInfo(hotel.price || hotel.priceRange || '');
    const totalPrice = priceInfo.amount * nights;

    // Extract rating information
    const rating = parseFloat(String(hotel.rating || 0));
    const reviewCount = parseInt(String(hotel.numberOfReviews || 0));

    return {
      id: hotel.id || `hotel_${Math.random().toString(36).substr(2, 9)}`,
      name: hotel.name || 'Unknown Hotel',
      
      // Pricing information
      price: {
        amount: priceInfo.amount,
        currency: priceInfo.currency,
        formatted: priceInfo.formatted,
        total: totalPrice,
        totalFormatted: `$${totalPrice.toFixed(0)}`,
        priceRange: hotel.priceRange || ''
      },

      // Rating and reviews
      rating: rating,
      ratingText: getRatingText(rating),
      reviewCount: reviewCount,
      
      // Location information
      location: {
        address: hotel.address || hotel.location || '',
        neighborhood: hotel.neighborhood || '',
        distanceFromCenter: hotel.distanceFromCenter || ''
      },

      // Images
      images: hotel.images || hotel.photos || [],
      
      // Amenities and features
      amenities: hotel.amenities || hotel.features || [],
      
      // TripAdvisor specific data
      tripAdvisorUrl: hotel.url || hotel.link || '',
      rankingPosition: hotel.ranking || '',
      awards: hotel.awards || [],
      
      // Additional info
      description: hotel.description || '',
      hotelClass: hotel.hotelClass || hotel.stars || 0,
      
      // Search context
      searchParams: searchParams
    };
  });
}

// Helper function to extract price information
function extractPriceInfo(priceString: string) {
  if (!priceString) {
    return { amount: 0, currency: 'USD', formatted: 'Price on request' };
  }

  // Extract numeric price from string like "$150", "£120", "€200"
  const priceMatch = priceString.match(/[\d,]+/);
  const amount = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : 0;
  
  // Detect currency symbol
  let currency = 'USD';
  let symbol = '$';
  
  if (priceString.includes('£')) {
    currency = 'GBP';
    symbol = '£';
  } else if (priceString.includes('€')) {
    currency = 'EUR';
    symbol = '€';
  } else if (priceString.includes('$')) {
    currency = 'USD';
    symbol = '$';
  }

  return {
    amount: amount,
    currency: currency,
    formatted: amount > 0 ? `${symbol}${amount}` : 'Price on request'
  };
}

// Helper function to convert rating to text
function getRatingText(rating: number): string {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  if (rating >= 3.0) return 'Average';
  if (rating >= 2.0) return 'Fair';
  return 'Poor';
}