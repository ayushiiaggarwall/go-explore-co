export const worldCities = [
  // Major International Cities
  'New York, USA',
  'Los Angeles, USA',
  'Chicago, USA',
  'Miami, USA',
  'San Francisco, USA',
  'Boston, USA',
  'Las Vegas, USA',
  'Seattle, USA',
  'Washington DC, USA',
  'Atlanta, USA',
  
  // Europe
  'London, UK',
  'Paris, France',
  'Rome, Italy',
  'Madrid, Spain',
  'Barcelona, Spain',
  'Amsterdam, Netherlands',
  'Berlin, Germany',
  'Munich, Germany',
  'Frankfurt, Germany',
  'Vienna, Austria',
  'Zurich, Switzerland',
  'Stockholm, Sweden',
  'Oslo, Norway',
  'Copenhagen, Denmark',
  'Helsinki, Finland',
  'Brussels, Belgium',
  'Dublin, Ireland',
  'Lisbon, Portugal',
  'Prague, Czech Republic',
  'Budapest, Hungary',
  'Warsaw, Poland',
  'Athens, Greece',
  'Istanbul, Turkey',
  
  // Asia Pacific
  'Tokyo, Japan',
  'Osaka, Japan',
  'Seoul, South Korea',
  'Hong Kong',
  'Singapore',
  'Bangkok, Thailand',
  'Manila, Philippines',
  'Jakarta, Indonesia',
  'Kuala Lumpur, Malaysia',
  'Ho Chi Minh City, Vietnam',
  'Hanoi, Vietnam',
  'Phnom Penh, Cambodia',
  'Yangon, Myanmar',
  
  // India (Major Cities)
  'Mumbai, India',
  'Delhi, India',
  'New Delhi, India',
  'Bangalore, India',
  'Hyderabad, India',
  'Chennai, India',
  'Kolkata, India',
  'Pune, India',
  'Ahmedabad, India',
  'Jaipur, India',
  'Surat, India',
  'Lucknow, India',
  'Kanpur, India',
  'Nagpur, India',
  'Indore, India',
  'Thane, India',
  'Bhopal, India',
  'Visakhapatnam, India',
  'Pimpri-Chinchwad, India',
  'Patna, India',
  'Vadodara, India',
  'Ghaziabad, India',
  'Ludhiana, India',
  'Agra, India',
  'Nashik, India',
  'Faridabad, India',
  'Meerut, India',
  'Rajkot, India',
  'Kalyan-Dombivali, India',
  'Vasai-Virar, India',
  'Varanasi, India',
  'Srinagar, India',
  'Aurangabad, India',
  'Dhanbad, India',
  'Amritsar, India',
  'Navi Mumbai, India',
  'Allahabad, India',
  'Ranchi, India',
  'Howrah, India',
  'Coimbatore, India',
  'Jabalpur, India',
  'Gwalior, India',
  'Vijayawada, India',
  'Jodhpur, India',
  'Madurai, India',
  'Raipur, India',
  'Kota, India',
  'Guwahati, India',
  'Chandigarh, India',
  'Thiruvananthapuram, India',
  'Solapur, India',
  'Hubballi-Dharwad, India',
  'Tiruchirappalli, India',
  'Bareilly, India',
  'Mysore, India',
  'Tiruppur, India',
  'Gurgaon, India',
  'Aligarh, India',
  'Jalandhar, India',
  'Bhubaneswar, India',
  'Salem, India',
  'Mira-Bhayandar, India',
  'Warangal, India',
  'Jalgaon, India',
  'Guntur, India',
  'Bhiwandi, India',
  'Saharanpur, India',
  'Gorakhpur, India',
  'Bikaner, India',
  'Amravati, India',
  'Noida, India',
  'Jamshedpur, India',
  'Bhilai Nagar, India',
  'Cuttack, India',
  'Firozabad, India',
  'Kochi, India',
  'Bhavnagar, India',
  'Dehradun, India',
  'Durgapur, India',
  'Asansol, India',
  'Rourkela, India',
  'Nanded, India',
  'Kolhapur, India',
  'Ajmer, India',
  'Akola, India',
  'Gulbarga, India',
  'Jamnagar, India',
  'Ujjain, India',
  'Loni, India',
  'Siliguri, India',
  'Jhansi, India',
  'Ulhasnagar, India',
  'Nellore, India',
  'Jammu, India',
  'Sangli-Miraj & Kupwad, India',
  'Mangalore, India',
  'Erode, India',
  'Belgaum, India',
  'Ambattur, India',
  'Tirunelveli, India',
  'Malegaon, India',
  'Gaya, India',
  'Jalgaon, India',
  'Udaipur, India',
  'Maheshtala, India',
  
  // China
  'Beijing, China',
  'Shanghai, China',
  'Guangzhou, China',
  'Shenzhen, China',
  'Chengdu, China',
  'Hangzhou, China',
  'Xi\'an, China',
  'Suzhou, China',
  'Wuhan, China',
  'Chongqing, China',
  
  // Middle East & Africa
  'Dubai, UAE',
  'Abu Dhabi, UAE',
  'Doha, Qatar',
  'Riyadh, Saudi Arabia',
  'Kuwait City, Kuwait',
  'Muscat, Oman',
  'Manama, Bahrain',
  'Tel Aviv, Israel',
  'Cairo, Egypt',
  'Casablanca, Morocco',
  'Lagos, Nigeria',
  'Nairobi, Kenya',
  'Cape Town, South Africa',
  'Johannesburg, South Africa',
  
  // Australia & New Zealand
  'Sydney, Australia',
  'Melbourne, Australia',
  'Brisbane, Australia',
  'Perth, Australia',
  'Adelaide, Australia',
  'Auckland, New Zealand',
  'Wellington, New Zealand',
  
  // Canada
  'Toronto, Canada',
  'Vancouver, Canada',
  'Montreal, Canada',
  'Calgary, Canada',
  'Ottawa, Canada',
  
  // South America
  'São Paulo, Brazil',
  'Rio de Janeiro, Brazil',
  'Buenos Aires, Argentina',
  'Lima, Peru',
  'Bogotá, Colombia',
  'Santiago, Chile',
  'Caracas, Venezuela',
  'Quito, Ecuador',
  'La Paz, Bolivia',
  'Montevideo, Uruguay',
  
  // Mexico & Central America
  'Mexico City, Mexico',
  'Guadalajara, Mexico',
  'Monterrey, Mexico',
  'Cancún, Mexico',
  'Tijuana, Mexico',
  'Guatemala City, Guatemala',
  'San José, Costa Rica',
  'Panama City, Panama',
];

export function searchCities(query: string, limit: number = 10): string[] {
  if (!query || query.trim().length < 1) {
    return worldCities.slice(0, limit);
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  const matches = worldCities.filter(city => 
    city.toLowerCase().includes(searchTerm)
  );
  
  // Sort by relevance: exact matches first, then starts with, then contains
  return matches
    .sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      
      // Exact match
      if (aLower === searchTerm) return -1;
      if (bLower === searchTerm) return 1;
      
      // Starts with query
      if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1;
      if (bLower.startsWith(searchTerm) && !aLower.startsWith(searchTerm)) return 1;
      
      // Alphabetical
      return aLower.localeCompare(bLower);
    })
    .slice(0, limit);
}