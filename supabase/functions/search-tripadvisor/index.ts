import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TripAdvisorHotel {
  name: string;
  rating?: number;
  numberOfReviews?: number;
  priceFrom?: number;
  location?: string;
  image?: string;
  amenities?: string[];
  url?: string;
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

    // Parse request body
    console.log('📝 Parsing request body...')
    const { query, maxItems = 10 } = await req.json()
    console.log('📍 Search query:', query, 'maxItems:', maxItems)
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log('🚀 TripAdvisor API: Starting search for', query)

    // Prepare the actor input
    const actorInput = {
      query,
      maxItemsPerQuery: maxItems,
      includeTags: true,
      includeNearbyResults: false,
      includeAttractions: false,
      includeRestaurants: false,
      includeHotels: true,
      includeVacationRentals: false,
      includePriceOffers: false,
      includeAiReviewsSummary: false,
      language: 'en',
      currency: 'USD'
    }

    // Start the actor run
    const runResponse = await fetch('https://api.apify.com/v2/acts/dbEyMBriog95Fv8CW/runs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apifyToken}`,
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

    // Wait for the run to complete
    let attempts = 0
    const maxAttempts = 30 // 30 seconds max wait time
    let runStatus = 'RUNNING'

    while (runStatus === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/dbEyMBriog95Fv8CW/runs/${runData.data.id}`, {
        headers: {
          'Authorization': `Bearer ${apifyToken}`,
        },
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
      throw new Error(`Actor run failed with status: ${runStatus}`)
    }

    // Get the results
    const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${runData.data.defaultDatasetId}/items`, {
      headers: {
        'Authorization': `Bearer ${apifyToken}`,
      },
    })

    if (!resultsResponse.ok) {
      console.error('❌ Failed to fetch results:', resultsResponse.status)
      throw new Error(`Failed to fetch results: ${resultsResponse.status}`)
    }

    const results = await resultsResponse.json()
    console.log('✅ Retrieved results:', results.length, 'items')

    // Transform the results to match our interface
    const hotels: TripAdvisorHotel[] = results
      .filter((item: any) => item.type === 'hotel')
      .map((item: any) => ({
        name: item.name || 'Unknown Hotel',
        rating: item.rating || undefined,
        numberOfReviews: item.numberOfReviews || 0,
        priceFrom: item.priceFrom || undefined,
        location: item.location || undefined,
        image: item.image || undefined,
        amenities: item.amenities || [],
        url: item.url || undefined,
      }))
      .slice(0, maxItems)

    console.log('🏨 Processed hotels:', hotels.length)

    return new Response(
      JSON.stringify({ hotels }),
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