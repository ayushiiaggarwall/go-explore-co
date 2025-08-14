/**
 * Extracts destination city from a persona seed string
 * Examples:
 * - "billionaire in Dubai exploring luxury scenes" -> "Dubai"
 * - "student in Mumbai exploring the city" -> "Mumbai"
 * - "digital nomad in Bangkok seeking authentic experiences" -> "Bangkok"
 * - "artist in Monaco seeking inspiration" -> "Monaco"
 */
export function extractDestinationFromPersona(personaSeed: string): string {
  // Clean the input
  const cleaned = personaSeed.trim();
  
  // Common patterns to match destinations (in order of specificity)
  const patterns = [
    // "person in CityName doing something" - most specific
    /\bin\s+([A-Z][a-zA-Z\s-]+?)(?:\s+(?:exploring|seeking|discovering|chasing|immersing|doing|finding|experiencing|enjoying|living|visiting|looking|searching|wandering))/i,
    
    // "person in CityName" (end of string)
    /\bin\s+([A-Z][a-zA-Z\s-]+?)$/i,
    
    // More specific city patterns with common suffixes
    /\bin\s+([A-Z][a-zA-Z\s-]+?)(?:\s+(?:city|area|region|district|town|village))/i,
    
    // Fallback: any capitalized word after "in" followed by a space and lowercase word
    /\bin\s+([A-Z][a-zA-Z]+)(?:\s+[a-z])/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      let destination = match[1].trim();
      
      // Clean up common words that might be captured
      destination = destination
        .replace(/\s+(city|area|region|district|town|village|exploring|seeking|discovering|chasing|immersing|doing|finding|experiencing|enjoying|living|visiting|looking|searching|wandering).*$/i, '')
        .trim();
      
      // Remove trailing articles and prepositions
      destination = destination.replace(/\s+(the|a|an|and|or|of|in|on|at|to|for|with|by)$/i, '').trim();
      
      // Validate that it looks like a city name
      if (destination.length >= 2 && destination.length <= 50 && /[a-zA-Z]/.test(destination)) {
        // Additional validation: make sure it's not a common descriptive word
        const commonWords = ['luxury', 'budget', 'local', 'hidden', 'secret', 'amazing', 'beautiful', 'historic', 'modern', 'ancient', 'vibrant', 'quiet', 'busy'];
        if (!commonWords.some(word => destination.toLowerCase().includes(word.toLowerCase()))) {
          return destination;
        }
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