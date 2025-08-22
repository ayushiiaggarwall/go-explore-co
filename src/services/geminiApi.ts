interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

class GeminiApiService {
  private supabaseUrl = 'https://ioifldpjlfotqvtaidem.supabase.co';

  constructor() {
    // No longer need API key here - handled by Supabase Edge Function
  }

  async convertCityToAirportCode(cityName: string): Promise<string> {
    try {
      console.log(`🤖 Gemini: Converting "${cityName}" to airport code`);
      
      const prompt = `Convert the city name "${cityName}" to its main international airport code (3 letters). 
      
Rules:
- Return ONLY the 3-letter airport code
- Use the main international airport for the city
- If multiple airports exist, use the busiest/main one
- Examples: New York -> JFK, Paris -> CDG, London -> LHR, Tokyo -> NRT
- If you cannot determine the airport code, return "UNK"

City: ${cityName}
Airport Code:`;

      const result = await this.makeGeminiRequest(prompt);
      const airportCode = result.trim().toUpperCase().substring(0, 3);
      
      console.log(`✅ Converted "${cityName}" to airport code: ${airportCode}`);
      return airportCode || this.fallbackCityToAirport(cityName);
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      return this.fallbackCityToAirport(cityName);
    }
  }

  async convertMultipleCitiesToAirportCodes(cities: string[]): Promise<{ [city: string]: string }> {
    console.log(`🤖 Gemini: Converting ${cities.length} cities to airport codes`);
    
    const results: { [city: string]: string } = {};
    
    // Process cities in parallel with a limit to avoid rate limiting
    const promises = cities.map(city => 
      this.convertCityToAirportCode(city)
        .then(code => ({ city, code }))
    );
    
    try {
      const resolved = await Promise.all(promises);
      resolved.forEach(({ city, code }) => {
        results[city] = code;
      });
      
      console.log('✅ Gemini: Batch conversion completed', results);
      return results;
    } catch (error) {
      console.error('❌ Gemini: Batch conversion failed', error);
      // Fallback for all cities
      cities.forEach(city => {
        results[city] = this.fallbackCityToAirport(city);
      });
      return results;
    }
  }

  async getBookMovieRecommendations(destination: string): Promise<{ books: any[], movies: any[] }> {
    try {
      console.log(`📚 Gemini: Getting recommendations for "${destination}"`);
      
      const prompt = `Recommend books and movies related to traveling to ${destination}. Include both:

1. BOOKS: Recommend 5 books (travel guides, fiction set in the location, cultural/historical books)
2. MOVIES: Recommend 5 movies (films set in the location, documentaries, travel-related)

For each recommendation, provide:
- Title
- Author/Director
- Brief description (1-2 sentences)
- Why it's relevant to visiting ${destination}

Format as JSON:
{
  "books": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "description": "Brief description",
      "relevance": "Why relevant to ${destination}"
    }
  ],
  "movies": [
    {
      "title": "Movie Title",
      "director": "Director Name", 
      "description": "Brief description",
      "relevance": "Why relevant to ${destination}"
    }
  ]
}`;

      const response = await this.makeGeminiRequest(prompt);
      
      try {
        const recommendations = JSON.parse(response);
        console.log(`✅ Gemini: Generated recommendations for ${destination}`);
        return recommendations;
      } catch (parseError) {
        console.warn('⚠️ Failed to parse Gemini recommendations, using fallback');
        return this.getFallbackRecommendations(destination);
      }
    } catch (error) {
      console.error('❌ Gemini recommendations error:', error);
      return this.getFallbackRecommendations(destination);
    }
  }

  async getVisaTips(fromCountry: string, toCountry: string, purposeOfVisit: string): Promise<string> {
    try {
      console.log(`🛂 Gemini: Getting visa tips for ${fromCountry} to ${toCountry}`);
      
      const prompt = `Provide detailed visa information and tips for travelers from ${fromCountry} going to ${toCountry} for ${purposeOfVisit}. 

Include:
1. Visa requirements (if needed)
2. Application process
3. Required documents
4. Processing time
5. Important tips and considerations
6. Embassy/consulate information if applicable

Make it practical and helpful for travelers. If no visa is required, explain that clearly.`;

      const response = await this.makeGeminiRequest(prompt);
      console.log(`✅ Gemini: Generated visa tips for ${fromCountry} to ${toCountry}`);
      return response;
    } catch (error) {
      console.error('❌ Gemini visa tips error:', error);
      return this.getFallbackVisaTips(fromCountry, toCountry, purposeOfVisit);
    }
  }

  async generateItinerary(city: string, interests: string[], startDate?: Date, endDate?: Date): Promise<ItineraryData> {
    try {
      console.log(`🗺️ Gemini: Generating itinerary for "${city}" with interests:`, interests);
      
      const dateRange = startDate && endDate 
        ? `from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
        : 'for your trip';
      
      const interestsList = interests.length > 0 
        ? interests.join(', ') 
        : 'general sightseeing, local cuisine, and cultural experiences';
      
      const prompt = `Create a comprehensive, location-specific travel itinerary for ${city}. This must be completely customized for ${city} specifically, not generic content.

IMPORTANT: All recommendations must be real, specific places in ${city}. Include actual names of:
- Specific restaurants, cafes, and bars in ${city}
- Real monuments, museums, and landmarks in ${city}
- Actual neighborhoods and districts in ${city}
- Local dishes and specialties unique to ${city}
- Real transport options available in ${city}

User interests: ${interestsList}
Trip dates: ${dateRange}

CITY-SPECIFIC REQUIREMENTS:
For ${city}, research and include:
1. Famous landmarks unique to ${city} (e.g., if Paris: Eiffel Tower, Notre Dame, Louvre)
2. Local cuisine specific to ${city}/region (e.g., if Mumbai: vada pav, bhel puri; if Paris: croissants, escargot, wine)
3. Popular neighborhoods in ${city} (e.g., if Paris: Montmartre, Le Marais; if Mumbai: Colaba, Bandra)
4. Local transport systems in ${city} (e.g., if Paris: Metro; if Mumbai: local trains)
5. Cultural practices and tips specific to ${city}

Match interests to city-specific activities:
- Museums → Include actual museum names in ${city}
- Food → Local specialties and famous restaurants in ${city}
- Beach → Specific beaches if ${city} is coastal
- Nightlife → Real bars and clubs in ${city}
- Nature → Parks and natural areas in/near ${city}
- Shopping → Famous markets and shopping areas in ${city}

Format as JSON with this exact structure:
{
  "mustDos": [
    {
      "id": "must_do_1",
      "title": "ACTUAL landmark/attraction name in ${city}",
      "description": "Why this specific place is important to ${city}",
      "category": "sightseeing",
      "estimatedTime": "2-3 hours",
      "completed": false
    }
  ],
  "foodRecommendations": [
    {
      "id": "food_1", 
      "title": "ACTUAL restaurant name or local dish from ${city}",
      "description": "What makes this food/place special in ${city}",
      "category": "restaurant",
      "cuisine": "specific cuisine type from ${city}",
      "completed": false
    }
  ],
  "dayPlans": [
    {
      "id": "day_1",
      "day": "Day 1",
      "theme": "Exploring ${city}'s [specific area]",
      "activities": [
        {
          "id": "day1_morning",
          "time": "Morning",
          "title": "Visit [specific landmark in ${city}]",
          "description": "Explore this iconic ${city} location",
          "completed": false
        }
      ]
    }
  ],
  "hotels": [
    {
      "id": "hotel_1",
      "name": "Recommended hotel type/area in ${city}",
      "category": "luxury",
      "description": "Why this area/type is good for ${city}",
      "estimatedPrice": "price range for ${city}",
      "completed": false
    }
  ],
  "transport": [
    {
      "id": "transport_1",
      "type": "ACTUAL transport system in ${city}",
      "description": "How to use ${city}'s specific transport",
      "tips": "Specific tips for getting around ${city}",
      "completed": false
    }
  ],
  "localTips": [
    {
      "id": "tip_1",
      "category": "culture",
      "tip": "Specific cultural tip for ${city}",
      "completed": false
    }
  ]
}

Make sure every recommendation is genuinely specific to ${city} and not generic travel advice.`;

      const response = await this.makeGeminiRequest(prompt);
      
      try {
        const itinerary = JSON.parse(response);
        console.log(`✅ Gemini: Generated comprehensive itinerary for ${city}`);
        return itinerary;
      } catch (parseError) {
        console.warn('⚠️ Failed to parse Gemini itinerary, using fallback');
        return this.getFallbackItinerary(city, interests);
      }
    } catch (error) {
      console.error('❌ Gemini itinerary generation error:', error);
      return this.getFallbackItinerary(city, interests);
    }
  }

  async generateFullItinerary(tripData: TripFormData): Promise<any> {
    try {
      console.log(`🚀 Webhook: Generating itinerary for trip:`, tripData);
      
      const numberOfDays = tripData.startDate && tripData.endDate
        ? Math.max(1, Math.ceil((tripData.endDate.getTime() - tripData.startDate.getTime()) / (1000*60*60*24)) + 1)
        : 7;

      const payload = {
        cityName: tripData.cities[0], // Use first city for now
        startDate: tripData.startDate?.toISOString().split('T')[0],
        endDate: tripData.endDate?.toISOString().split('T')[0],
        tripName: tripData.tripName,
        numberOfDays,
        activities: tripData.interests.filter(i => ['Beach vibes', 'Sports', 'Water activities', 'Winter sports', 'Climbing', 'Cycling', 'Camping', 'Hiking', 'Adrenaline', 'Theme parks'].includes(i)),
        foodDrinks: tripData.interests.filter(i => ['Coffee', 'International', 'Chinese', 'French', 'Indian', 'Italian', 'Japanese', 'Korean', 'Mexican', 'Thai', 'Vegan', 'Seafood', 'Sushi', 'Ice cream', 'Dining Establishments', 'Bakery', 'Bar', 'Cafe', 'Restaurants', 'Drinks'].includes(i)),
        entertainment: tripData.interests.filter(i => ['Shopping', 'Dancing', 'Cinemas', 'Adult entertainment', 'Comedy clubs'].includes(i)),
        sightseeing: tripData.interests.filter(i => ['Nature', 'Art', 'Museums', 'Historical sites', 'Bridges', 'Libraries', 'Memorials', 'Lookout points', 'Architecture', 'Ships', 'Aquariums', 'Urban architecture', 'Interesting streets'].includes(i)),
        relaxation: tripData.interests.filter(i => ['Massage', 'Wellness'].includes(i)),
        // Add all interests for more comprehensive data
        allInterests: tripData.interests
      };

      console.log('🔗 Sending data to n8n webhook:', payload);

      const response = await fetch('https://ayushiaggarwal0109.app.n8n.cloud/webhook/5a2b14ec-6a5d-436b-89fd-5675a268a6c4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Webhook error response:', errorText);
        
        // Handle specific webhook errors
        if (response.status === 404) {
          throw new Error('Webhook not found - please activate the n8n workflow and try again');
        }
        
        throw new Error(`Webhook error: ${response.status} - ${errorText}`);
      }

      const itinerary = await response.json();
      console.log(`✅ Webhook: Generated itinerary for ${tripData.tripName}`);
      console.log('📄 Full webhook response:', JSON.stringify(itinerary, null, 2));
      return itinerary;
    } catch (error) {
      console.error('❌ Webhook itinerary generation error:', error);
      throw error;
    }
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<{ convertedAmount: number, exchangeRate: number, additionalInfo: string }> {
    try {
      console.log(`💱 Gemini: Converting ${amount} ${fromCurrency} to ${toCurrency}`);
      
      const prompt = `Convert ${amount} ${fromCurrency} to ${toCurrency}. 

Provide:
1. Current approximate exchange rate
2. Converted amount
3. Brief explanation of factors affecting the exchange rate
4. Tips for currency exchange when traveling

Format as JSON:
{
  "convertedAmount": 1234.56,
  "exchangeRate": 0.85,
  "additionalInfo": "Brief explanation and travel tips"
}

Note: Use realistic approximate rates as of early 2025. Explain this is an estimate and rates change frequently.`;

      const response = await this.makeGeminiRequest(prompt);
      
      try {
        const conversion = JSON.parse(response);
        console.log(`✅ Gemini: Converted ${amount} ${fromCurrency} to ${toCurrency}`);
        return conversion;
      } catch (parseError) {
        console.warn('⚠️ Failed to parse Gemini conversion, using fallback');
        return this.getFallbackCurrencyConversion(amount, fromCurrency, toCurrency);
      }
    } catch (error) {
      console.error('❌ Gemini currency conversion error:', error);
      return this.getFallbackCurrencyConversion(amount, fromCurrency, toCurrency);
    }
  }

  private async makeGeminiRequest(prompt: string): Promise<string> {
    const response = await fetch(`${this.supabaseUrl}/functions/v1/gemini-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        action: 'generate'
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.text) {
      throw new Error(data.error || 'No response from Gemini API');
    }
    
    return data.text;
  }

  private getFallbackRecommendations(destination: string) {
    return {
      books: [
        {
          title: "Lonely Planet " + destination,
          author: "Lonely Planet",
          description: "Comprehensive travel guide with practical tips and cultural insights.",
          relevance: "Essential travel guide for exploring " + destination
        },
        {
          title: "Culture Smart! Guide",
          author: "Kuperard",
          description: "Cultural etiquette and customs guide for travelers.",
          relevance: "Helps understand local customs in " + destination
        }
      ],
      movies: [
        {
          title: "Travel Documentary",
          director: "Various",
          description: "Explore the beauty and culture of this destination.",
          relevance: "Visual introduction to " + destination
        }
      ]
    };
  }

  private getFallbackVisaTips(fromCountry: string, toCountry: string, purposeOfVisit: string): string {
    return `Visa requirements for ${fromCountry} citizens traveling to ${toCountry} for ${purposeOfVisit}:

Please check with the embassy or consulate of ${toCountry} for the most up-to-date visa requirements. Requirements can vary based on:
- Your nationality
- Purpose of visit
- Duration of stay
- Current diplomatic relations

General tips:
1. Apply well in advance
2. Ensure your passport is valid for at least 6 months
3. Prepare all required documents
4. Check for any recent changes in visa policies

For accurate information, visit the official government website of ${toCountry} or contact their embassy.`;
  }

  private getFallbackCurrencyConversion(amount: number, fromCurrency: string, toCurrency: string) {
    // Simple fallback with approximate rates
    const rates: { [key: string]: number } = {
      'USD-EUR': 0.85,
      'USD-GBP': 0.75,
      'USD-INR': 83,
      'EUR-USD': 1.18,
      'GBP-USD': 1.33,
      'INR-USD': 0.012
    };
    
    const rateKey = `${fromCurrency}-${toCurrency}`;
    const rate = rates[rateKey] || 1;
    
    return {
      convertedAmount: Math.round(amount * rate * 100) / 100,
      exchangeRate: rate,
      additionalInfo: "This is an approximate conversion. Exchange rates fluctuate constantly. For accurate rates, check with your bank or financial institution."
    };
  }

  private getFallbackItinerary(city: string, interests: string[]): ItineraryData {
    const hasMuseums = interests.some(i => i.toLowerCase().includes('museum') || i.toLowerCase().includes('art'));
    const hasFood = interests.some(i => i.toLowerCase().includes('food') || i.toLowerCase().includes('dining'));
    const hasNature = interests.some(i => i.toLowerCase().includes('nature') || i.toLowerCase().includes('beach'));
    const hasNightlife = interests.some(i => i.toLowerCase().includes('dancing') || i.toLowerCase().includes('bar'));

    return {
      mustDos: [
        {
          id: 'must_do_1',
          title: `${city} City Center`,
          description: 'Explore the heart of the city and main landmarks',
          category: 'sightseeing' as const,
          estimatedTime: '3-4 hours',
          completed: false
        },
        {
          id: 'must_do_2',
          title: 'Historic District',
          description: 'Walk through the historic areas and learn about local history',
          category: 'culture' as const,
          estimatedTime: '2-3 hours',
          completed: false
        },
        ...(hasMuseums ? [{
          id: 'must_do_museum',
          title: `${city} Art Museum`,
          description: 'Discover local and international art collections',
          category: 'culture' as const,
          estimatedTime: '2-3 hours',
          completed: false
        }] : []),
        ...(hasNature ? [{
          id: 'must_do_nature',
          title: 'Natural Attraction',
          description: 'Experience the natural beauty around the city',
          category: 'nature' as const,
          estimatedTime: '4-5 hours',
          completed: false
        }] : [])
      ],
      foodRecommendations: [
        {
          id: 'food_1',
          title: 'Local Specialty Restaurant',
          description: 'Try authentic local cuisine at a highly-rated restaurant',
          category: 'restaurant' as const,
          cuisine: 'local',
          completed: false
        },
        {
          id: 'food_2',
          title: 'Street Food Market',
          description: 'Experience local flavors at the bustling food market',
          category: 'street_food' as const,
          cuisine: 'local',
          completed: false
        },
        ...(hasFood ? [{
          id: 'food_fine',
          title: 'Fine Dining Experience',
          description: 'Upscale restaurant with innovative cuisine',
          category: 'restaurant' as const,
          cuisine: 'international',
          completed: false
        }] : []),
        ...(hasNightlife ? [{
          id: 'food_bar',
          title: 'Local Bar Scene',
          description: 'Experience the nightlife with craft cocktails',
          category: 'bar' as const,
          cuisine: 'drinks',
          completed: false
        }] : [])
      ],
      dayPlans: [
        {
          id: 'day_1',
          day: 'Day 1',
          theme: 'Arrival & City Exploration',
          activities: [
            {
              id: 'day1_morning',
              time: 'Morning',
              title: 'Arrival and Check-in',
              description: 'Arrive at hotel, get oriented with the city',
              completed: false
            },
            {
              id: 'day1_afternoon',
              time: 'Afternoon',
              title: 'City Center Walk',
              description: 'Explore the main attractions and get your bearings',
              completed: false
            },
            {
              id: 'day1_evening',
              time: 'Evening',
              title: 'Local Dinner',
              description: 'Try authentic local cuisine at a recommended restaurant',
              completed: false
            }
          ]
        },
        {
          id: 'day_2',
          day: 'Day 2',
          theme: 'Culture & History',
          activities: [
            {
              id: 'day2_morning',
              time: 'Morning',
              title: 'Historic Sites',
              description: 'Visit key historical landmarks and museums',
              completed: false
            },
            {
              id: 'day2_afternoon',
              time: 'Afternoon',
              title: 'Cultural Experience',
              description: 'Immerse in local culture and traditions',
              completed: false
            },
            {
              id: 'day2_evening',
              time: 'Evening',
              title: 'Entertainment',
              description: hasNightlife ? 'Experience local nightlife' : 'Relaxing evening stroll',
              completed: false
            }
          ]
        },
        {
          id: 'day_3',
          day: 'Day 3',
          theme: 'Nature & Relaxation',
          activities: [
            {
              id: 'day3_morning',
              time: 'Morning',
              title: 'Nature Activity',
              description: hasNature ? 'Outdoor nature experience' : 'Visit parks and gardens',
              completed: false
            },
            {
              id: 'day3_afternoon',
              time: 'Afternoon',
              title: 'Shopping & Souvenirs',
              description: 'Shop for local crafts and souvenirs',
              completed: false
            },
            {
              id: 'day3_evening',
              time: 'Evening',
              title: 'Farewell Dinner',
              description: 'Special dinner at a memorable location',
              completed: false
            }
          ]
        }
      ],
      hotels: [
        {
          id: 'hotel_1',
          title: 'Luxury City Hotel',
          name: 'Luxury City Hotel',
          category: 'luxury' as const,
          description: 'Premium accommodation in the heart of the city',
          estimatedPrice: '$200-300/night',
          completed: false
        },
        {
          id: 'hotel_2',
          title: 'Boutique Hotel',
          name: 'Boutique Hotel',
          category: 'mid-range' as const,
          description: 'Stylish hotel with local character and great service',
          estimatedPrice: '$100-150/night',
          completed: false
        },
        {
          id: 'hotel_3',
          title: 'Budget-Friendly Option',
          name: 'Budget-Friendly Option',
          category: 'budget' as const,
          description: 'Clean, comfortable accommodation for budget travelers',
          estimatedPrice: '$50-80/night',
          completed: false
        }
      ],
      transport: [
        {
          id: 'transport_1',
          title: 'Airport Transfer',
          type: 'Airport Transfer',
          description: 'Best options to get from airport to city center',
          tips: 'Book in advance for better rates, consider shared shuttles',
          completed: false
        },
        {
          id: 'transport_2',
          title: 'Local Transport',
          type: 'Local Transport',
          description: 'Public transport system and getting around the city',
          tips: 'Get a day pass for convenience and savings',
          completed: false
        },
        {
          id: 'transport_3',
          title: 'Walking & Cycling',
          type: 'Walking & Cycling',
          description: 'Walkable areas and bike rental options',
          tips: 'Many attractions are within walking distance of city center',
          completed: false
        }
      ],
      localTips: [
        {
          id: 'tip_1',
          title: 'Language Tips',
          description: 'Learn basic greetings in the local language - locals appreciate the effort',
          category: 'culture' as const,
          tip: 'Learn basic greetings in the local language - locals appreciate the effort',
          completed: false
        },
        {
          id: 'tip_2',
          title: 'Money Matters',
          description: 'Carry some cash as not all places accept cards, especially smaller vendors',
          category: 'money' as const,
          tip: 'Carry some cash as not all places accept cards, especially smaller vendors',
          completed: false
        },
        {
          id: 'tip_3',
          title: 'Safety First',
          description: 'Keep copies of important documents and store them separately from originals',
          category: 'safety' as const,
          tip: 'Keep copies of important documents and store them separately from originals',
          completed: false
        },
        {
          id: 'tip_4',
          title: 'Practical Apps',
          description: 'Download offline maps and translation apps before exploring',
          category: 'practical' as const,
          tip: 'Download offline maps and translation apps before exploring',
          completed: false
        }
      ]
    };
  }

  private fallbackCityToAirport(cityName: string): string {
    const cityUpper = cityName.toUpperCase();
    
    // Enhanced fallback mapping
    const cityToAirport: { [key: string]: string } = {
      'NEW YORK': 'JFK',
      'NEW YORK, USA': 'JFK',
      'NEW YORK CITY': 'JFK',
      'NYC': 'JFK',
      'PARIS': 'CDG',
      'PARIS, FRANCE': 'CDG',
      'LONDON': 'LHR',
      'LONDON, UK': 'LHR',
      'LONDON, ENGLAND': 'LHR',
      'TOKYO': 'NRT',
      'TOKYO, JAPAN': 'NRT',
      'LOS ANGELES': 'LAX',
      'LOS ANGELES, USA': 'LAX',
      'LA': 'LAX',
      'CHICAGO': 'ORD',
      'CHICAGO, USA': 'ORD',
      'MIAMI': 'MIA',
      'MIAMI, USA': 'MIA',
      'TORONTO': 'YYZ',
      'TORONTO, CANADA': 'YYZ',
      'BANGKOK': 'BKK',
      'BANGKOK, THAILAND': 'BKK',
      'DUBAI': 'DXB',
      'DUBAI, UAE': 'DXB',
      'MUMBAI': 'BOM',
      'MUMBAI, INDIA': 'BOM',
      'DELHI': 'DEL',
      'DELHI, INDIA': 'DEL',
      'NEW DELHI': 'DEL',
      'NEW DELHI, INDIA': 'DEL',
      'BANGALORE': 'BLR',
      'BANGALORE, INDIA': 'BLR',
      'BENGALURU': 'BLR',
      'BENGALURU, INDIA': 'BLR',
      'CHENNAI': 'MAA',
      'CHENNAI, INDIA': 'MAA',
      'KOLKATA': 'CCU',
      'KOLKATA, INDIA': 'CCU',
      'HYDERABAD': 'HYD',
      'HYDERABAD, INDIA': 'HYD',
      'PUNE': 'PNQ',
      'PUNE, INDIA': 'PNQ',
      'AHMEDABAD': 'AMD',
      'AHMEDABAD, INDIA': 'AMD',
      'KOCHI': 'COK',
      'KOCHI, INDIA': 'COK',
      'GOA': 'GOI',
      'GOA, INDIA': 'GOI',
      'INDORE': 'IDR',
      'INDORE, INDIA': 'IDR',
      'SINGAPORE': 'SIN',
      'SINGAPORE, SINGAPORE': 'SIN',
      'AMSTERDAM': 'AMS',
      'AMSTERDAM, NETHERLANDS': 'AMS',
      'ROME': 'FCO',
      'ROME, ITALY': 'FCO',
      'MADRID': 'MAD',
      'MADRID, SPAIN': 'MAD',
      'BARCELONA': 'BCN',
      'BARCELONA, SPAIN': 'BCN',
      'BERLIN': 'BER',
      'BERLIN, GERMANY': 'BER',
      'MUNICH': 'MUC',
      'MUNICH, GERMANY': 'MUC',
      'FRANKFURT': 'FRA',
      'FRANKFURT, GERMANY': 'FRA',
      'ZURICH': 'ZUR',
      'ZURICH, SWITZERLAND': 'ZUR',
      'VIENNA': 'VIE',
      'VIENNA, AUSTRIA': 'VIE',
      'STOCKHOLM': 'ARN',
      'STOCKHOLM, SWEDEN': 'ARN',
      'OSLO': 'OSL',
      'OSLO, NORWAY': 'OSL',
      'COPENHAGEN': 'CPH',
      'COPENHAGEN, DENMARK': 'CPH',
      'HELSINKI': 'HEL',
      'HELSINKI, FINLAND': 'HEL'
    };

    // Check for exact matches first
    if (cityToAirport[cityUpper]) {
      return cityToAirport[cityUpper];
    }

    // Check for partial matches
    for (const [city, code] of Object.entries(cityToAirport)) {
      if (cityUpper.includes(city) || city.includes(cityUpper)) {
        return code;
      }
    }

    // If no match found, return a default
    console.warn(`⚠️ No airport mapping found for "${cityName}", using JFK as default`);
    return 'JFK';
  }
}

export const geminiApi = new GeminiApiService();
export type { GeminiResponse };

// Types for itinerary data
export interface ItineraryItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface MustDoItem extends ItineraryItem {
  category: 'sightseeing' | 'culture' | 'nature';
  estimatedTime: string;
}

export interface FoodItem extends ItineraryItem {
  category: 'restaurant' | 'street_food' | 'cafe' | 'bar';
  cuisine: string;
}

export interface DayActivity extends ItineraryItem {
  time: 'Morning' | 'Afternoon' | 'Evening';
}

export interface DayPlan {
  id: string;
  day: string;
  theme: string;
  activities: DayActivity[];
}

export interface HotelRecommendation extends ItineraryItem {
  name: string;
  category: 'luxury' | 'mid-range' | 'budget';
  estimatedPrice: string;
}

export interface TransportOption extends ItineraryItem {
  type: string;
  tips: string;
}

export interface LocalTip extends ItineraryItem {
  category: 'culture' | 'safety' | 'money' | 'language' | 'practical';
  tip: string;
}

export interface ItineraryData {
  mustDos: MustDoItem[];
  foodRecommendations: FoodItem[];
  dayPlans: DayPlan[];
  hotels: HotelRecommendation[];
  transport: TransportOption[];
  localTips: LocalTip[];
}

export interface TripFormData {
  tripName: string;
  startDate?: Date;
  endDate?: Date;
  cities: string[];
  interests: string[];
}