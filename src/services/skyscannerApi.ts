import { geminiApi } from './geminiApi';

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

class SkyscannerApiService {
  private apiToken: string;

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
    returnDate?: string
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
      
      const mockFlights = this.generateRealisticFlights(fromCode, toCode, departDate);
      
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
    departDate: string
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

}

export const skyscannerApi = new SkyscannerApiService();
export type { SkyscannerFlight };