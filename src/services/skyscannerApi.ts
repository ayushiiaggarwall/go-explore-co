import { geminiApi } from './geminiApi';

export interface SkyscannerFlight {
  price: number;
  currency: string;
  airline: {
    name: string;
    code: string;
    logo?: string;
  };
  flightNumber: string;
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

export interface FlightApiResponse {
  flights: SkyscannerFlight[];
  source: string;
  totalResults: number;
}

class SkyscannerApiService {
  private baseUrl = 'https://ioifldpjlfotqvtaidem.supabase.co/functions/v1/search-flights';

  async searchFlights(
    from: string, 
    to: string, 
    departDate: string, 
    returnDate?: string
  ): Promise<FlightApiResponse> {
    console.log('✈️ Flight Search: Starting real-time search', { from, to, departDate, returnDate });
    
    try {
      // Use Gemini API to convert city names to airport codes for the API
      console.log('🤖 Converting cities to airport codes with Gemini...');
      
      const [fromCode, toCode] = await Promise.all([
        geminiApi.convertCityToAirportCode(from),
        geminiApi.convertCityToAirportCode(to)
      ]);
      
      console.log(`🌍 Searching real flights from ${fromCode} (${from}) to ${toCode} (${to})`);
      
      // Call the Google Flights API via our edge function
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
        },
        body: JSON.stringify({
          from: fromCode,
          to: toCode,
          departDate,
          returnDate,
          passengers: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Flight API error:', response.status, errorData);
        
        // Fallback to mock data if API fails
        console.log('🔄 Falling back to mock data...');
        return {
          flights: this.generateRealisticFlights(fromCode, toCode, departDate),
          source: 'mock-data',
          totalResults: 10
        };
      }

      const data = await response.json();
      
      if (data.error || !data.flights || data.flights.length === 0) {
        console.error('❌ Flight API returned error or no results:', data.error);
        
        // Fallback to mock data
        console.log('🔄 Falling back to mock data...');
        return {
          flights: this.generateRealisticFlights(fromCode, toCode, departDate),
          source: 'mock-data',
          totalResults: 10
        };
      }

      console.log('✅ Real flight search success:', data.flights?.length || 0, 'flights found');
      return data; // Return the full response object which includes flights, source, totalResults
      
    } catch (error) {
      console.error('❌ Flight Search Error:', error);
      
      // Fallback to mock data on any error
      console.log('🔄 Falling back to mock data due to error...');
      try {
        const [fromCode, toCode] = await Promise.all([
          geminiApi.convertCityToAirportCode(from),
          geminiApi.convertCityToAirportCode(to)
        ]);
        return {
          flights: this.generateRealisticFlights(fromCode, toCode, departDate),
          source: 'mock-data',
          totalResults: 10
        };
      } catch (fallbackError) {
        console.error('❌ Even fallback failed:', fallbackError);
        throw error;
      }
    }
  }

  private generateRealisticFlights(
    fromCode: string, 
    toCode: string, 
    departDate: string
  ): SkyscannerFlight[] {
    const airlines = [
      { name: 'American Airlines', code: 'AA' },
      { name: 'Delta Air Lines', code: 'DL' },
      { name: 'United Airlines', code: 'UA' },
      { name: 'JetBlue Airways', code: 'B6' },
      { name: 'Air France', code: 'AF' },
      { name: 'Lufthansa', code: 'LH' },
      { name: 'British Airways', code: 'BA' },
      { name: 'Emirates', code: 'EK' }
    ];
    const flights: SkyscannerFlight[] = [];
    
    // Generate 8-12 realistic flight options
    const numFlights = Math.floor(Math.random() * 5) + 8;
    
    for (let i = 0; i < numFlights; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const isDirectFlight = Math.random() > 0.6;
      const stops = isDirectFlight ? 0 : Math.floor(Math.random() * 2) + 1;
      const flightNum = Math.floor(Math.random() * 9000) + 1000;
      
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
        airline: {
          name: airline.name,
          code: airline.code,
          logo: `https://logos.skyscnr.com/images/airlines/favicon/${airline.code}.png`
        },
        flightNumber: `${airline.code}${flightNum}`,
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
        bookingUrl: `https://www.skyscanner.com/transport/flights/${fromCode}/${toCode}/${departDate.replace(/-/g, '')}/?adults=1&cabinclass=economy&rtn=0`
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

}

export const skyscannerApi = new SkyscannerApiService();