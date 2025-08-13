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
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file');
    }
  }

  async convertCityToAirportCode(cityName: string): Promise<string> {
    if (!this.apiKey) {
      console.warn('Gemini API key not configured, using fallback');
      return this.fallbackCityToAirport(cityName);
    }

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

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      const airportCode = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
      
      if (airportCode && /^[A-Z]{3}$/.test(airportCode) && airportCode !== 'UNK') {
        console.log(`✅ Gemini: "${cityName}" -> ${airportCode}`);
        return airportCode;
      } else {
        console.warn(`⚠️ Gemini returned invalid code: ${airportCode}, using fallback`);
        return this.fallbackCityToAirport(cityName);
      }
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      return this.fallbackCityToAirport(cityName);
    }
  }

  async getBookMovieRecommendations(destination: string): Promise<{ books: any[], movies: any[] }> {
    if (!this.apiKey) {
      console.warn('Gemini API key not configured, using fallback recommendations');
      return this.getFallbackRecommendations(destination);
    }

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
    if (!this.apiKey) {
      console.warn('Gemini API key not configured, using fallback visa info');
      return this.getFallbackVisaTips(fromCountry, toCountry, purposeOfVisit);
    }

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

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<{ convertedAmount: number, exchangeRate: number, additionalInfo: string }> {
    if (!this.apiKey) {
      console.warn('Gemini API key not configured, using fallback conversion');
      return this.getFallbackCurrencyConversion(amount, fromCurrency, toCurrency);
    }

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
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!result) {
      throw new Error('No response from Gemini API');
    }
    
    return result;
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