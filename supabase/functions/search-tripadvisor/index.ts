import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TripAdvisorHotel {
  id: string;
  name: string;
  rating?: number;
  numberOfReviews?: number;
  priceFrom?: number;
  location?: string;
  image?: string;
  amenities?: string[];
  url?: string;
  description?: string;
  address?: string;
  distance?: string;
}

serve(async (req) => {
  console.log(`🔍 TripAdvisor API called: ${req.method} ${req.url}`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔐 Checking API token...')
    // Get the API token from Supabase secrets
    const apifyToken = Deno.env.get('APIFY_API_TOKEN')
    if (!apifyToken) {
      console.error('❌ APIFY_API_TOKEN not found in secrets')
      return new Response(
        JSON.stringify({ error: 'API token not configured', hotels: [] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200  // Return 200 with error message instead of 500
        }
      )
    }
    console.log('✅ API token found')

    // Parse request body - accept hotel search parameters
    console.log('📝 Parsing request body...')
    const { destination, checkInDate, checkOutDate, numberOfPeople, rooms, maxItems = 10 } = await req.json()
    console.log('📍 Search parameters:', { destination, checkInDate, checkOutDate, numberOfPeople, rooms, maxItems })
    
    if (!destination) {
      return new Response(
        JSON.stringify({ error: 'Destination parameter is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log('🚀 TripAdvisor API: Starting search for hotels in', destination)

    // Prepare the actor input for maxcopell/tripadvisor
    const actorInput = {
      searchQuery: `hotels in ${destination}`,
      locationFullName: destination,
      language: 'en',
      currency: 'USD',
      checkIn: checkInDate || '',
      checkOut: checkOutDate || '',
      adults: numberOfPeople || 2,
      children: 0,
      rooms: rooms || 1,
      locationId: '',
      categories: ['hotels'],
      offset: 0,
      limit: maxItems,
      sort: 'popularity'
    }

    console.log('🏨 Actor input for maxcopell/tripadvisor:', JSON.stringify(actorInput, null, 2))

    // Start the actor run using maxcopell/tripadvisor
    const runResponse = await fetch(`https://api.apify.com/v2/acts/maxcopell~tripadvisor/runs?token=${apifyToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(actorInput),
    })

    if (!runResponse.ok) {
      console.error('❌ Failed to start actor run:', runResponse.status)
      throw new Error(`Failed to start actor run: ${runResponse.status}`)
    }

    const runData = await runResponse.json()
    console.log('🏃 Actor run started:', runData.data.id)

    // Poll for results with longer timeout for TripAdvisor
    let attempts = 0
    const maxAttempts = 60 // 60 seconds max wait time
    let runStatus = 'RUNNING'

    while (runStatus === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/maxcopell~tripadvisor/runs/${runData.data.id}?token=${apifyToken}`, {
        method: 'GET'
      })

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        runStatus = statusData.data.status
        console.log(`📊 Run status: ${runStatus} (attempt ${attempts + 1})`)
      }
      
      attempts++
    }

    if (runStatus !== 'SUCCEEDED') {
      console.error('❌ Actor run did not complete successfully:', runStatus)
      return new Response(
        JSON.stringify({ 
          error: `TripAdvisor search ${runStatus.toLowerCase()}`,
          hotels: [] 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200  // Return 200 with empty results instead of error
        }
      )
    }

    // Get the results from dataset
    const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${runData.data.defaultDatasetId}/items?token=${apifyToken}`, {
      method: 'GET'
    })

    if (!resultsResponse.ok) {
      console.error('❌ Failed to fetch results:', resultsResponse.status)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch TripAdvisor results',
          hotels: [] 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    const results = await resultsResponse.json()
    console.log('✅ Retrieved TripAdvisor results:', results.length, 'items')
    
    if (results.length > 0) {
      console.log('🏨 Sample result structure:', Object.keys(results[0]))
    }

    // Process maxcopell/tripadvisor results
    const processedHotels: TripAdvisorHotel[] = results
      .filter((item: any) => item && (item.name || item.title))
      .map((item: any, index: number) => ({
        id: `tripadvisor_${index}_${Date.now()}`,
        name: item.name || item.title || 'Hotel',
        rating: item.rating || item.bubbleRating || 0,
        numberOfReviews: item.reviewCount || item.numReviews || item.numberOfReviews || 0,
        priceFrom: item.priceFrom || item.price || undefined,
        location: item.locationString || item.location || item.address || '',
        image: item.photo?.images?.large?.url || item.image || item.imageUrl || '',
        amenities: item.amenities || item.features || [],
        url: item.webUrl || item.url || `https://www.tripadvisor.com`,
        description: item.description || '',
        address: item.address || item.locationString || '',
        distance: item.distance || ''
      }))
      .slice(0, maxItems)

    console.log('🏨 Processed TripAdvisor hotels:', processedHotels.length)

    return new Response(
      JSON.stringify({ 
        success: true,
        hotels: processedHotels,
        totalResults: processedHotels.length,
        source: 'TripAdvisor',
        searchParams: {
          destination,
          checkInDate,
          checkOutDate,
          numberOfPeople,
          rooms
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ TripAdvisor API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to search hotels',
        hotels: [] 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})