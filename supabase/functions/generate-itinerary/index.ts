// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  
  try {
    if (!GEMINI_API_KEY) {
      return new Response("Missing GEMINI_API_KEY", { status: 500, headers: cors });
    }

    const body = await req.json();
    const {
      personaSeed,
      interests = [],
      budget,
      energy,
      anonymityIdea,
      dateRange,
      timeWindows,
      primaryCityOrRegion,
      numberOfDays
    } = body || {};

    console.log("Generating itinerary for:", { cityName: primaryCityOrRegion, numberOfDays, startDate: dateRange?.start, endDate: dateRange?.end });

    // If we don't have a proper city name, return an error
    if (!primaryCityOrRegion || primaryCityOrRegion === "Unknown destination") {
      return new Response(JSON.stringify({ error: "Please select a destination city first" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...cors } 
      });
    }

    // Build the prompt for Gemini
    const prompt = `You are an expert travel planner creating a personalized itinerary. Generate a detailed, day-by-day travel plan based on the following information:

*TRIP DETAILS:*
• Destination: ${primaryCityOrRegion}
• Travel Dates: ${dateRange?.start} to ${dateRange?.end}
• Trip Duration: ${numberOfDays} days
• Persona: ${personaSeed}

*USER PREFERENCES:*
• Interests: ${interests.join(", ")}
• Budget: ${budget}
• Energy Level: ${energy}/10
• Special Notes: ${anonymityIdea}

*TIME PREFERENCES:*
• Morning activities: ${timeWindows?.morning ? "Yes" : "No"}
• Afternoon activities: ${timeWindows?.afternoon ? "Yes" : "No"}
• Evening activities: ${timeWindows?.evening ? "Yes" : "No"}

*REQUIREMENTS:*
Create a detailed JSON response with day-by-day itinerary, specific venue recommendations, insider tips, and practical information.

Return ONLY valid JSON in this exact format:
{
  "cityName": "${primaryCityOrRegion}",
  "tripDuration": "${numberOfDays} days",
  "overview": "Brief exciting description of what makes this city special for this traveler",
  "mustDoAttractions": [{
    "name": "Specific venue name",
    "location": "Full address",
    "description": "Why it's perfect for user's interests",
    "estimatedTime": "2-3 hours",
    "bestTimeToVisit": "Morning/Afternoon/Evening",
    "insiderTip": "Local secret or pro tip"
  }],
  "foodAndDrinks": [{
    "restaurantName": "Specific restaurant name",
    "location": "Full address",
    "cuisine": "Type of cuisine", 
    "mustTryDishes": ["Dish 1", "Dish 2"],
    "priceRange": "$/$$/$$$/$$$$",
    "specialtyNote": "Why this place is special",
    "bestTime": "Breakfast/Lunch/Dinner/Snack"
  }],
  "dayByDayItinerary": [{
    "day": 1,
    "theme": "Exploring Historic ${primaryCityOrRegion}",
    "morning": {
      "time": "9:00 AM - 12:00 PM",
      "activity": "Specific activity name",
      "location": "Venue name and address",
      "description": "What you'll do and why it's perfect for your interests",
      "transportTip": "How to get there"
    },
    "afternoon": {
      "time": "1:00 PM - 5:00 PM", 
      "activity": "Specific activity name",
      "location": "Venue name and address",
      "description": "Detailed description",
      "lunchRecommendation": {
        "restaurant": "Restaurant name",
        "location": "Address",
        "dish": "Specific dish to try"
      }
    },
    "evening": {
      "time": "6:00 PM - 10:00 PM",
      "activity": "Specific activity name", 
      "location": "Venue name and address",
      "description": "What makes this perfect for evening",
      "dinnerRecommendation": {
        "restaurant": "Restaurant name",
        "location": "Address",
        "speciality": "What they're known for"
      }
    }
  }],
  "localInsiderTips": [
    "Tip 1: Specific actionable advice",
    "Tip 2: Hidden gem or local secret",
    "Tip 3: Cultural etiquette or customs"
  ],
  "budgetEstimate": {
    "dailyFoodBudget": "$X - $Y per person",
    "attractionsCost": "$X - $Y total", 
    "transportationCost": "$X - $Y per day",
    "totalEstimate": "$X - $Y for entire trip"
  }
}`;

    // Use Gemini 2.5 Flash for itinerary generation
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini API error:", errorText);
      return new Response(`Gemini error: ${errorText}`, { status: 500, headers: cors });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    console.log("Gemini response length:", text.length);

    // Try to extract pure JSON
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/i);
    const raw = jsonMatch ? jsonMatch[1] : text;

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.log("Raw response causing error:", raw);
      
      // Enhanced cleanup
      let cleaned = raw
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
        .replace(/:\s*'([^']*)'/g, ': "$1"')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      // Try to fix common array/object issues
      cleaned = cleaned
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/}\s*{/g, '},{')
        .replace(/]\s*\[/g, '],[');

      try {
        parsed = JSON.parse(cleaned);
        console.log("✅ Successfully parsed JSON after cleanup");
      } catch (finalError) {
        console.error("Final parse error:", finalError);
        
        // Final attempt: try to extract valid JSON portion
        try {
          const startIndex = cleaned.indexOf('{');
          if (startIndex !== -1) {
            let braceCount = 0;
            let endIndex = startIndex;
            
            for (let i = startIndex; i < cleaned.length; i++) {
              if (cleaned[i] === '{') braceCount++;
              if (cleaned[i] === '}') braceCount--;
              if (braceCount === 0) {
                endIndex = i + 1;
                break;
              }
            }
            
            const partialJson = cleaned.substring(startIndex, endIndex);
            parsed = JSON.parse(partialJson);
            console.log("✅ Successfully parsed partial JSON");
          } else {
            throw finalError;
          }
        } catch (partialError) {
          return new Response(`JSON parse error: ${finalError}. Raw response: ${raw.substring(0, 1000)}...`, { status: 500, headers: cors });
        }
      }
    }

    // Validate the parsed JSON structure
    const requiredFields = ['cityName', 'tripDuration', 'dayByDayItinerary'];
    const missingFields = requiredFields.filter(field => !parsed[field]);
    
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      // Try to provide defaults for missing fields
      if (!parsed.cityName) parsed.cityName = primaryCityOrRegion;
      if (!parsed.tripDuration) parsed.tripDuration = `${numberOfDays} days`;
      if (!parsed.dayByDayItinerary) parsed.dayByDayItinerary = [];
    }

    // Ensure arrays exist even if empty
    parsed.mustDoAttractions = parsed.mustDoAttractions || [];
    parsed.foodAndDrinks = parsed.foodAndDrinks || [];
    parsed.localInsiderTips = parsed.localInsiderTips || [];

    console.log("Successfully generated itinerary for:", primaryCityOrRegion);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json", ...cors },
    });
  } catch (e) {
    console.error("Server error:", e);
    return new Response(`Server error: ${e}`, { status: 500, headers: cors });
  }
});