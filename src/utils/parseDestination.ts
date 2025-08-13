/**
 * Extracts destination city from a persona seed string
 * Examples:
 * - "billionaire in Dubai exploring luxury scenes" -> "Dubai"
 * - "student in Mumbai exploring the city" -> "Mumbai"
 * - "digital nomad in Bangkok seeking authentic experiences" -> "Bangkok"
 */
export function extractDestinationFromPersona(personaSeed: string): string {
  // Clean the input
  const cleaned = personaSeed.trim();
  
  // Common patterns to match destinations
  const patterns = [
    // "person in CityName doing something"
    /\bin\s+([A-Z][a-zA-Z\s-]+?)(?:\s+(?:exploring|seeking|discovering|chasing|immersing|doing|finding|experiencing|enjoying|living|visiting))/i,
    
    // "person in CityName" (end of string)
    /\bin\s+([A-Z][a-zA-Z\s-]+?)$/i,
    
    // More specific city patterns
    /\bin\s+([A-Z][a-zA-Z\s-]+?)(?:\s+(?:city|area|region|district))/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      const destination = match[1].trim();
      
      // Clean up common words that might be captured
      const cleanedDestination = destination
        .replace(/\s+(city|area|region|district|exploring|seeking|discovering|chasing|immersing|doing|finding|experiencing|enjoying|living|visiting).*$/i, '')
        .trim();
      
      // Validate that it looks like a city name (not too long, contains letters)
      if (cleanedDestination.length >= 2 && cleanedDestination.length <= 50 && /[a-zA-Z]/.test(cleanedDestination)) {
        return cleanedDestination;
      }
    }
  }
  
  // Fallback: return empty string if no destination found
  return '';
}

/**
 * Gets destination with fallback to a default value
 */
export function getDestinationFromPersona(personaSeed: string, fallback: string = 'Unknown destination'): string {
  const extracted = extractDestinationFromPersona(personaSeed);
  return extracted || fallback;
}