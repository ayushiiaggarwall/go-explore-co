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

class TripAdvisorApiService {
  private baseUrl = 'https://ioifldpjlfotqvtaidem.supabase.co/functions/v1/search-tripadvisor';

  async searchHotels(query: string, maxItems: number = 10): Promise<TripAdvisorHotel[]> {
    console.log('🚀 TripAdvisor API: Starting search for', query);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          maxItems
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ TripAdvisor API error:', response.status, errorData);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('❌ TripAdvisor API returned error:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ TripAdvisor API success:', data.hotels?.length || 0, 'hotels found');
      return data.hotels || [];

    } catch (error) {
      console.error('❌ TripAdvisor API service error:', error);
      throw error;
    }
  }
}

export const tripAdvisorApi = new TripAdvisorApiService();
export type { TripAdvisorHotel };