interface ApifyTripAdvisorInput {
  query: string;
  maxItemsPerQuery?: number;
  includeTags?: boolean;
  includeNearbyResults?: boolean;
  includeAttractions?: boolean;
  includeRestaurants?: boolean;
  includeHotels?: boolean;
  includeVacationRentals?: boolean;
  includePriceOffers?: boolean;
  includeAiReviewsSummary?: boolean;
  language?: string;
  currency?: string;
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

interface ApifyRunResponse {
  data: {
    id: string;
    actId: string;
    userId: string;
    startedAt: string;
    finishedAt?: string;
    status: string;
    statusMessage?: string;
    isStatusMessageTerminal: boolean;
    metamorph: number;
    container: any;
    buildId: string;
    buildNumber: string;
    defaultKeyValueStoreId: string;
    defaultDatasetId: string;
    defaultRequestQueueId: string;
    options: any;
    usage: any;
    usageTotalUsd?: number;
    usageUsd: any;
  };
}

class TripAdvisorApiService {
  private apiToken: string;
  private baseUrl = 'https://api.apify.com/v2/acts/dbEyMBriog95Fv8CW';

  constructor() {
    this.apiToken = import.meta.env.VITE_APIFY_API_TOKEN || '';
    if (!this.apiToken) {
      console.warn('TripAdvisor API token not found. Please set VITE_APIFY_API_TOKEN in your .env file');
    }
  }

  async searchHotels(query: string, maxItems: number = 10): Promise<TripAdvisorHotel[]> {
    console.log('🚀 TripAdvisor API: Starting search for', query);
    
    if (!this.apiToken) {
      console.error('❌ API token not configured');
      throw new Error('API token not configured');
    }

    try {
      console.log('📝 Preparing API request...');
      // Start the actor run
      const runResponse = await this.startActorRun({
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
      });

      console.log('🏃 Actor run started:', runResponse.data.id);
      
      // Wait for the run to complete and get results
      const results = await this.waitForResults(runResponse.data.id);
      console.log('📊 Raw results count:', results.length);
      
      const formatted = this.formatResults(results);
      console.log('✨ Formatted hotels count:', formatted.length);
      
      return formatted;
    } catch (error) {
      console.error('❌ TripAdvisor API Error:', error);
      throw error;
    }
  }

  private async startActorRun(input: ApifyTripAdvisorInput): Promise<ApifyRunResponse> {
    const response = await fetch(`${this.baseUrl}/runs?token=${this.apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Failed to start actor run: ${response.statusText}`);
    }

    return response.json();
  }

  private async waitForResults(runId: string, maxWaitTime: number = 60000): Promise<any[]> {
    const startTime = Date.now();
    const pollInterval = 3000; // Check every 3 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check run status
        const statusResponse = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}?token=${this.apiToken}`
        );
        
        if (!statusResponse.ok) {
          throw new Error(`Failed to get run status: ${statusResponse.statusText}`);
        }

        const runData = await statusResponse.json();
        
        if (runData.data.status === 'SUCCEEDED') {
          // Get the results from the dataset
          const resultsResponse = await fetch(
            `https://api.apify.com/v2/datasets/${runData.data.defaultDatasetId}/items?token=${this.apiToken}`
          );
          
          if (!resultsResponse.ok) {
            throw new Error(`Failed to get results: ${resultsResponse.statusText}`);
          }

          return resultsResponse.json();
        } else if (runData.data.status === 'FAILED' || runData.data.status === 'ABORTED') {
          throw new Error(`Actor run failed with status: ${runData.data.status}`);
        }

        // Still running, wait and try again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling for results:', error);
        throw error;
      }
    }

    throw new Error('Timeout waiting for results');
  }

  private formatResults(results: any[]): TripAdvisorHotel[] {
    console.log('🔍 Examining raw results:', results.slice(0, 2)); // Log first 2 items to see structure
    
    // First, let's see what types we're getting
    const types = [...new Set(results.map(item => item.type))];
    console.log('📋 Available types in results:', types);
    
    // More lenient filtering - include hotels and anything that looks like accommodation
    const filtered = results.filter(item => {
      const isHotel = item.type === 'hotel' || 
                     item.type === 'Hotel' || 
                     !item.type ||
                     (item.subcategory && item.subcategory.includes('hotel')) ||
                     (item.category && item.category.toLowerCase().includes('hotel')) ||
                     (item.name && (item.priceRange || item.priceFrom || item.price));
      
      if (!isHotel) {
        console.log('❌ Filtered out:', item.name, 'Type:', item.type);
      }
      return isHotel;
    });
    
    console.log('✅ After filtering:', filtered.length, 'items');
    
    return filtered.map(item => ({
      name: item.name || 'Unknown Hotel',
      rating: item.rating || item.averageRating || 0,
      numberOfReviews: item.numberOfReviews || item.reviewCount || 0,
      priceFrom: item.priceFrom || item.price || item.priceRange?.min || 100,
      location: item.location || item.address || '',
      image: item.image || 
             item.photo ||
             item.photos?.[0]?.photoSizeDynamic?.urlTemplate?.replace('{width}', '400').replace('{height}', '300') ||
             item.photos?.[0]?.urlTemplate?.replace('{width}', '400').replace('{height}', '300') ||
             'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800',
      amenities: item.amenities || item.features || ['Free WiFi'],
      url: item.url || item.websiteUrl || ''
    }));
  }
}

export const tripAdvisorApi = new TripAdvisorApiService();
export type { TripAdvisorHotel };