import { geminiApi } from './geminiApi';

interface SkyscannerInput {
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
  currency?: string;
  market?: string;
  locale?: string;
}

interface SkyscannerFlight {
  price: number;
  currency: string;
  airline: string;
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

class SkyscannerApiService {
  private apiToken: string;
  private baseUrl = 'https://api.apify.com/v2/acts/dtrungtin~skyscanner-search';

  constructor() {
    this.apiToken = import.meta.env.VITE_APIFY_API_TOKEN || '';
    if (!this.apiToken) {
      console.warn('Skyscanner API token not found. Please set VITE_APIFY_API_TOKEN in your .env file');
    }
  }

  async searchFlights(
    from: string, 
    to: string, 
    departDate: string, 
    returnDate?: string,
    adults: number = 1
  ): Promise<SkyscannerFlight[]> {
    console.log('✈️ Flight Search: Generating realistic flight data', { from, to, departDate, returnDate });
    
    // Since Skyscanner APIs require payment, let's generate realistic flight data
    // This provides a working demo while you decide on a paid API solution
    
    try {
      // Use Gemini API to convert city names to airport codes
      console.log('🤖 Converting cities to airport codes with Gemini...');
      
      const [fromCode, toCode] = await Promise.all([
        geminiApi.convertCityToAirportCode(from),
        geminiApi.convertCityToAirportCode(to)
      ]);
      
      console.log(`🌍 Searching flights from ${fromCode} (${from}) to ${toCode} (${to})`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockFlights = this.generateRealisticFlights(fromCode, toCode, departDate, returnDate, adults);
      
      console.log(`✨ Generated ${mockFlights.length} realistic flight options`);
      return mockFlights;
      
    } catch (error) {
      console.error('❌ Flight Search Error:', error);
      throw error;
    }
  }

  private generateRealisticFlights(
    fromCode: string, 
    toCode: string, 
    departDate: string, 
    returnDate?: string, 
    adults: number = 1
  ): SkyscannerFlight[] {
    const airlines = ['American Airlines', 'Delta', 'United', 'JetBlue', 'Air France', 'Lufthansa', 'British Airways', 'Emirates'];
    const flights: SkyscannerFlight[] = [];
    
    // Generate 8-12 realistic flight options
    const numFlights = Math.floor(Math.random() * 5) + 8;
    
    for (let i = 0; i < numFlights; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const isDirectFlight = Math.random() > 0.6;
      const stops = isDirectFlight ? 0 : Math.floor(Math.random() * 2) + 1;
      
      // Calculate base price based on route distance (rough estimate)
      const routeMultiplier = this.getRouteMultiplier(fromCode, toCode);
      const basePrice = 200 + (routeMultiplier * 100) + (stops * 50);
      const priceVariation = Math.random() * 400; // Add price variation
      const finalPrice = Math.round(basePrice + priceVariation);
      
      // Generate departure time
      const departureHour = Math.floor(Math.random() * 24);
      const departureMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
      const departureTime = `${departureHour.toString().padStart(2, '0')}:${departureMinute.toString().padStart(2, '0')}`;
      
      // Calculate flight duration based on route
      const baseDuration = this.getFlightDuration(fromCode, toCode);
      const additionalTime = stops * 90; // 1.5 hours per stop
      const totalMinutes = baseDuration + additionalTime + (Math.random() * 60); // Add some variation
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);
      const duration = `${hours}h ${minutes}m`;
      
      // Calculate arrival time
      const arrivalTime = this.calculateArrivalTime(departureTime, totalMinutes);
      
      flights.push({
        price: finalPrice,
        currency: 'USD',
        airline,
        departure: {
          time: departureTime,
          date: departDate,
          airport: fromCode,
          city: this.getAirportCity(fromCode)
        },
        arrival: {
          time: arrivalTime,
          date: departDate, // Simplified - assuming same day arrival
          airport: toCode,
          city: this.getAirportCity(toCode)
        },
        duration,
        stops,
        bookingUrl: `https://www.skyscanner.com/transport/flights/${fromCode}/${toCode}/${departDate.replace(/-/g, '')}/`
      });
    }
    
    // Sort by price
    return flights.sort((a, b) => a.price - b.price);
  }

  private getRouteMultiplier(from: string, to: string): number {
    // Simple distance multiplier based on common routes
    const longHaulRoutes = ['JFK-CDG', 'JFK-NRT', 'LAX-NRT', 'JFK-LHR', 'LAX-CDG'];
    const mediumRoutes = ['JFK-MIA', 'LAX-ORD', 'JFK-ORD'];
    
    const route = `${from}-${to}`;
    const reverseRoute = `${to}-${from}`;
    
    if (longHaulRoutes.includes(route) || longHaulRoutes.includes(reverseRoute)) {
      return 3; // International long-haul
    } else if (mediumRoutes.includes(route) || mediumRoutes.includes(reverseRoute)) {
      return 1.5; // Domestic medium-haul
    } else {
      return 2; // Default
    }
  }

  private getFlightDuration(from: string, to: string): number {
    // Return duration in minutes
    const durations: { [key: string]: number } = {
      'JFK-CDG': 460, 'CDG-JFK': 480,
      'JFK-LHR': 420, 'LHR-JFK': 450,
      'JFK-NRT': 840, 'NRT-JFK': 780,
      'LAX-CDG': 720, 'CDG-LAX': 660,
      'JFK-MIA': 180, 'MIA-JFK': 180,
      'JFK-ORD': 150, 'ORD-JFK': 150
    };
    
    const route = `${from}-${to}`;
    return durations[route] || 300; // Default 5 hours
  }

  private calculateArrivalTime(departureTime: string, durationMinutes: number): string {
    const [hours, minutes] = departureTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const arrivalHours = Math.floor(totalMinutes / 60) % 24;
    const arrivalMinutes = totalMinutes % 60;
    return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;
  }

  private getAirportCity(code: string): string {
    const cities: { [key: string]: string } = {
      'JFK': 'New York',
      'CDG': 'Paris',
      'LHR': 'London',
      'NRT': 'Tokyo',
      'LAX': 'Los Angeles',
      'ORD': 'Chicago',
      'MIA': 'Miami',
      'YYZ': 'Toronto',
      'BKK': 'Bangkok',
      'DXB': 'Dubai'
    };
    return cities[code] || 'Unknown';
  }

  private normalizeAirportCode(location: string): string {
    // This API uses airport codes again
    const locationUpper = location.toUpperCase();
    
    // Common city to airport code mappings
    const cityToAirport: { [key: string]: string } = {
      'NEW YORK': 'JFK',
      'NEW YORK, USA': 'JFK',
      'PARIS': 'CDG',
      'PARIS, FRANCE': 'CDG',
      'LONDON': 'LHR',
      'LONDON, UK': 'LHR',
      'TOKYO': 'NRT',
      'TOKYO, JAPAN': 'NRT',
      'LOS ANGELES': 'LAX',
      'LOS ANGELES, USA': 'LAX',
      'CHICAGO': 'ORD',
      'CHICAGO, USA': 'ORD',
      'MIAMI': 'MIA',
      'MIAMI, USA': 'MIA',
      'TORONTO': 'YYZ',
      'TORONTO, CANADA': 'YYZ',
      'BANGKOK': 'BKK',
      'BANGKOK, THAILAND': 'BKK',
      'DUBAI': 'DXB',
      'DUBAI, UAE': 'DXB'
    };

    // Check if it's already an airport code (3 letters)
    if (/^[A-Z]{3}$/.test(locationUpper)) {
      return locationUpper;
    }

    // Try to find a mapping
    for (const [city, code] of Object.entries(cityToAirport)) {
      if (locationUpper.includes(city)) {
        console.log(`🌍 Converted "${location}" to airport code: ${code}`);
        return code;
      }
    }

    // If no mapping found, use JFK as default
    console.warn(`⚠️ Could not map "${location}" to airport code, using default JFK`);
    return 'JFK';
  }

  private normalizeCityName(location: string): string {
    // This API uses city names, not airport codes
    const locationFormatted = location.trim();
    
    // Common mappings to clean city names
    const cityMappings: { [key: string]: string } = {
      'NEW YORK, USA': 'New York',
      'NEW YORK': 'New York',
      'PARIS, FRANCE': 'Paris',
      'PARIS': 'Paris',
      'LONDON, UK': 'London',
      'LONDON': 'London',
      'TOKYO, JAPAN': 'Tokyo',
      'TOKYO': 'Tokyo',
      'LOS ANGELES, USA': 'Los Angeles',
      'LOS ANGELES': 'Los Angeles',
      'CHICAGO, USA': 'Chicago',
      'CHICAGO': 'Chicago',
      'MIAMI, USA': 'Miami',
      'MIAMI': 'Miami',
      'TORONTO, CANADA': 'Toronto',
      'TORONTO': 'Toronto',
      'BANGKOK, THAILAND': 'Bangkok',
      'BANGKOK': 'Bangkok',
      'DUBAI, UAE': 'Dubai',
      'DUBAI': 'Dubai'
    };

    const locationUpper = locationFormatted.toUpperCase();
    
    // Try to find a mapping
    for (const [pattern, cleanName] of Object.entries(cityMappings)) {
      if (locationUpper.includes(pattern)) {
        console.log(`🌍 Converted "${location}" to city: ${cleanName}`);
        return cleanName;
      }
    }

    // If no mapping found, return the first part before comma or the whole string
    const cityName = locationFormatted.split(',')[0].trim();
    console.log(`🌍 Using city name: ${cityName}`);
    return cityName;
  }

  private async startActorRun(input: SkyscannerInput): Promise<ApifyRunResponse> {
    console.log('📤 Sending Skyscanner API request:', {
      url: `${this.baseUrl}/runs?token=${this.apiToken.substring(0, 10)}...`,
      input
    });

    const response = await fetch(`${this.baseUrl}/runs?token=${this.apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    console.log('📥 Skyscanner API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Skyscanner API Error Response:', errorText);
      throw new Error(`Failed to start Skyscanner actor run: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Skyscanner API response:', result);
    return result;
  }

  private async waitForResults(runId: string, maxWaitTime: number = 90000): Promise<any[]> {
    const startTime = Date.now();
    const pollInterval = 5000; // Check every 5 seconds (flights take longer than hotels)

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
        console.log('⏳ Skyscanner run status:', runData.data.status);
        
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
          throw new Error(`Skyscanner actor run failed with status: ${runData.data.status}`);
        }

        // Still running, wait and try again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling for flight results:', error);
        throw error;
      }
    }

    throw new Error('Timeout waiting for flight results');
  }

  private formatResults(results: any[]): SkyscannerFlight[] {
    console.log('🔍 Examining raw flight results:', results.slice(0, 2));
    
    return results
      .filter(item => item && (item.price || item.totalPrice))
      .map(item => ({
        price: item.price || item.totalPrice || 0,
        currency: item.currency || 'USD',
        airline: item.airline || item.carrier || item.operatingCarrier || 'Unknown Airline',
        departure: {
          time: item.departureTime || item.departure?.time || '12:00',
          date: item.departureDate || item.departure?.date || '',
          airport: item.departureAirport || item.departure?.airport || item.from || '',
          city: item.departureCity || item.departure?.city || ''
        },
        arrival: {
          time: item.arrivalTime || item.arrival?.time || '15:00',
          date: item.arrivalDate || item.arrival?.date || '',
          airport: item.arrivalAirport || item.arrival?.airport || item.to || '',
          city: item.arrivalCity || item.arrival?.city || ''
        },
        duration: item.duration || item.flightDuration || '3h 00m',
        stops: item.stops || item.stopCount || 0,
        bookingUrl: item.bookingUrl || item.deepLink || ''
      }));
  }
}

export const skyscannerApi = new SkyscannerApiService();
export type { SkyscannerFlight };