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
      cityName,
      startDate,
      endDate,
      tripName,
      numberOfDays,
      activities = [],
      foodDrinks = [],
      entertainment = [],
      sightseeing = [],
      relaxation = [],
    } = body || {};

    console.log("Generating itinerary for:", { cityName, numberOfDays, startDate, endDate });

    // Build the big prompt
    const prompt = `
You are an expert travel planner creating a personalized itinerary. Generate a detailed, day-by-day travel plan based on the following information:

*TRIP DETAILS:*
• Destination City: ${cityName}
• Travel Dates: ${startDate} to ${endDate}
• Trip Duration: ${numberOfDays} days
• Trip Name: ${tripName || "—"}

*USER INTERESTS:*
• Activities & Adventures: ${activities.join(", ")}
• Food & Drinks: ${foodDrinks.join(", ")}
• Urban Entertainment & Nightlife: ${entertainment.join(", ")}
• Sightseeing & Culture: ${sightseeing.join(", ")}
• Relaxation & Wellness: ${relaxation.join(", ")}

*REQUIREMENTS:*
1. Create a day-by-day itinerary (Day 1, Day 2, etc.) with morning, afternoon, and evening activities
2. Include specific venue names, addresses, and brief descriptions for each recommendation
3. Prioritize recommendations based on user interests
4. Include restaurants with specific dish recommendations and locations
5. Add transportation tips between locations
6. Include estimated time spent at each location
7. Add insider tips and local secrets
8. Consider opening hours and seasonal factors
9. Include backup indoor activities for bad weather

*OUTPUT FORMAT (VALID JSON ONLY; NO EXTRA TEXT OR MARKDOWN):*
IMPORTANT: Return ONLY valid JSON. Do not include any text before or after the JSON. Do not wrap in markdown code blocks. Ensure all strings are properly quoted and there are no trailing commas.
{
  "cityName": "${cityName}",
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
    "theme": "Exploring Historic ${cityName} / Cultural Immersion / etc.",
    "morning": {
      "time": "9:00 AM - 12:00 PM",
      "activity": "Specific activity name",
      "location": "Venue name and address",
      "description": "What you'll do and why it's perfect for your interests",
      "transportTip": "How to get there from hotel/previous location"
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
  "hotelRecommendations": [{
    "name": "Specific hotel name",
    "location": "Area/neighborhood",
    "priceRange": "$/$$/$$$/$$$$",
    "whyRecommended": "Based on user interests and itinerary",
    "nearbyAttractions": ["Attraction 1", "Attraction 2"]
  }],
  "transportationTips": {
    "gettingToCity": "Best way to reach the city",
    "gettingAround": "Best local transportation options",
    "costSavingTips": "Transportation cost-saving advice",
    "downloadApps": ["App 1", "App 2"]
  },
  "localInsiderTips": [
    "Tip 1: Specific actionable advice",
    "Tip 2: Hidden gem or local secret",
    "Tip 3: Cultural etiquette or customs",
    "Tip 4: Best times to avoid crowds",
    "Tip 5: Money-saving or experience-enhancing tip"
  ],
  "weatherConsiderations": {
    "seasonalTips": "What to expect during travel dates",
    "backupIndoorActivities": ["Activity 1", "Activity 2"],
    "whatToPack": ["Essential items for the season"]
  },
  "budgetEstimate": {
    "dailyFoodBudget": "$X - $Y per person",
    "attractionsCost": "$X - $Y total",
    "transportationCost": "$X - $Y per day",
    "totalEstimate": "$X - $Y for entire trip"
  }
}`.trim();

    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" + GEMINI_API_KEY,
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

    // Try to extract pure JSON (handles ```json ... ``` wrapping)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/i);
    const raw = jsonMatch ? jsonMatch[1] : text;

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.log("Raw response causing error:", raw);
      
      // Enhanced cleanup: try to fix common JSON issues
      let cleaned = raw
        .replace(/[""]/g, '"')  // Smart quotes to regular quotes
        .replace(/['']/g, "'")  // Smart single quotes
        .replace(/,\s*([}\]])/g, "$1")  // Trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"')  // Single quoted values to double
        .replace(/\n\s*\n/g, '\n')  // Remove extra newlines
        .trim();

      // Try to fix common array/object issues
      cleaned = cleaned
        .replace(/,\s*}/g, '}')  // Trailing comma before }
        .replace(/,\s*]/g, ']')  // Trailing comma before ]
        .replace(/}\s*{/g, '},{')  // Missing comma between objects
        .replace(/]\s*\[/g, '],[');  // Missing comma between arrays

      try {
        parsed = JSON.parse(cleaned);
        console.log("✅ Successfully parsed JSON after cleanup");
      } catch (finalError) {
        console.error("Final parse error:", finalError);
        console.log("Cleaned response:", cleaned);
        
        // Final attempt: try to extract valid JSON portion
        try {
          // Find the first { and try to match braces
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
      if (!parsed.cityName) parsed.cityName = cityName;
      if (!parsed.tripDuration) parsed.tripDuration = `${numberOfDays} days`;
      if (!parsed.dayByDayItinerary) parsed.dayByDayItinerary = [];
    }

    // Ensure arrays exist even if empty
    parsed.mustDoAttractions = parsed.mustDoAttractions || [];
    parsed.foodAndDrinks = parsed.foodAndDrinks || [];
    parsed.hotelRecommendations = parsed.hotelRecommendations || [];
    parsed.localInsiderTips = parsed.localInsiderTips || [];

    console.log("Successfully generated itinerary for:", cityName);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json", ...cors },
    });
  } catch (e) {
    console.error("Server error:", e);
    return new Response(`Server error: ${e}`, { status: 500, headers: cors });
  }
});