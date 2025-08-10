import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  MapPin, Hotel, Plane, Clock, CheckCircle, Circle, Edit2, RotateCcw,
  AlertCircle, Star, Calendar, Car, Coffee, Camera,
  RefreshCw, Loader2, Save
} from 'lucide-react';
import { geminiApi, ItineraryData, TripFormData } from '../services/geminiApi';
import { useSmoothNavigation } from '../hooks/useSmoothNavigation';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../integrations/supabase/client';
import Button from './ui/Button';

interface ProgressStep {
  message: string;
  completed: boolean;
}

interface TravelItineraryProps {
  tripData: TripFormData;
}

const PROGRESS_STEPS = [
  'Analyzing your interests...',
  'Finding must-see attractions...',
  'Discovering local food spots...',
  'Planning your daily schedule...',
  'Finding accommodation options...',
  'Organizing transport information...',
  'Gathering local insider tips...',
  'Finalizing your personalized itinerary...'
];

// Transform webhook response to match UI data structure
function transformWebhookResponse(response: any, cityName: string): ItineraryData & any {
  console.log('🔄 Transforming webhook response for', cityName);
  console.log('📋 Raw response structure:', JSON.stringify(response, null, 2));
  
  // Handle different possible response structures
  let data = response.data || response.body || response.result || response;
  
  // Handle n8n response format with 'output' field containing JSON string
  if (data.output && typeof data.output === 'string') {
    console.log('🔍 Found n8n output field, extracting JSON...');
    try {
      // Extract JSON from markdown code blocks
      const jsonMatch = data.output.match(/```json\s*([\s\S]*?)```/i) || data.output.match(/```([\s\S]*?)```/i);
      const jsonString = jsonMatch ? jsonMatch[1] : data.output;
      data = JSON.parse(jsonString);
      console.log('✅ Successfully parsed JSON from n8n output');
    } catch (parseError) {
      console.error('❌ Failed to parse n8n output JSON:', parseError);
      // Try to parse the entire output as JSON
      try {
        data = JSON.parse(data.output);
      } catch (finalError) {
        console.error('❌ Final parse error for n8n output:', finalError);
        data = response; // Fall back to original response
      }
    }
  }
  
  console.log('📦 Extracted data:', JSON.stringify(data, null, 2));
  
  // If response already matches our structure, use it directly
  if (data.mustDos && data.foodRecommendations && data.dayPlans) {
    console.log('✅ Using direct structure match');
    return data;
  }
  
  // Transform structured response (similar to Gemini format)
  if (data.mustDoAttractions || data.foodAndDrinks || data.dayByDayItinerary) {
    console.log('✅ Using structured transformation (Gemini-like format)');
    const transformedItinerary: ItineraryData & any = {
      mustDos: (data.mustDoAttractions || []).map((attraction: any, index: number) => ({
        id: `must_do_${index + 1}`,
        title: attraction.name || attraction.title || 'Attraction',
        description: `${attraction.description || ''}${attraction.bestTimeToVisit ? `. Best time: ${attraction.bestTimeToVisit}` : ''}${attraction.insiderTip ? `. ${attraction.insiderTip}` : ''}`,
        category: 'sightseeing' as const,
        estimatedTime: attraction.estimatedTime || '2-3 hours',
        completed: false
      })),
      
      foodRecommendations: (data.foodAndDrinks || []).map((food: any, index: number) => ({
        id: `food_${index + 1}`,
        title: food.restaurantName || food.name || food.title || 'Restaurant',
        description: `${food.specialtyNote || food.description || ''}${food.mustTryDishes ? `. Must try: ${Array.isArray(food.mustTryDishes) ? food.mustTryDishes.join(', ') : food.mustTryDishes}` : ''}${food.priceRange ? `. ${food.priceRange}` : ''}`,
        category: 'restaurant' as const,
        cuisine: food.cuisine || 'Local',
        completed: false
      })),
      
      dayPlans: (data.dayByDayItinerary || []).map((day: any) => ({
        id: `day_${day.day || day.dayNumber || 1}`,
        day: `Day ${day.day || day.dayNumber || 1}`,
        theme: day.theme || `Day ${day.day || day.dayNumber || 1} in ${cityName}`,
        activities: [
          {
            id: `day${day.day || 1}_morning`,
            time: 'Morning' as const,
            title: day.morning?.activity || day.morning?.title || 'Morning Activity',
            description: day.morning?.description || '',
            completed: false
          },
          {
            id: `day${day.day || 1}_afternoon`,
            time: 'Afternoon' as const,
            title: day.afternoon?.activity || day.afternoon?.title || 'Afternoon Activity',
            description: `${day.afternoon?.description || ''}${day.afternoon?.lunchRecommendation ? ` | Lunch: ${day.afternoon.lunchRecommendation.restaurant || day.afternoon.lunchRecommendation.name} - ${day.afternoon.lunchRecommendation.dish || day.afternoon.lunchRecommendation.description}` : ''}`,
            completed: false
          },
          {
            id: `day${day.day || 1}_evening`,
            time: 'Evening' as const,
            title: day.evening?.activity || day.evening?.title || 'Evening Activity',
            description: `${day.evening?.description || ''}${day.evening?.dinnerRecommendation ? ` | Dinner: ${day.evening.dinnerRecommendation.restaurant || day.evening.dinnerRecommendation.name} - ${day.evening.dinnerRecommendation.speciality || day.evening.dinnerRecommendation.description}` : ''}`,
            completed: false
          }
        ]
      })),
      
      hotels: (data.hotelRecommendations || []).map((hotel: any, index: number) => ({
        id: `hotel_${index + 1}`,
        title: hotel.name || hotel.title || 'Hotel',
        name: hotel.name || hotel.title || 'Hotel',
        category: hotel.priceRange?.includes('$$$$') || hotel.category === 'luxury' ? 'luxury' : 
                 hotel.priceRange?.includes('$$$') || hotel.category === 'mid-range' ? 'mid-range' : 'budget' as const,
        description: hotel.whyRecommended || hotel.description || 'Recommended accommodation',
        estimatedPrice: hotel.priceRange || hotel.price || '$100-200/night',
        nearbyAttractions: hotel.nearbyAttractions || [],
        completed: false
      })),
      
      transport: [
        {
          id: 'transport_getting_to_city',
          title: 'Getting to City',
          type: 'Airport Transfer',
          description: data.transportationTips?.gettingToCity || 'Transportation to the city',
          tips: data.transportationTips?.costSavingTips || 'Check for transportation options',
          completed: false
        },
        {
          id: 'transport_getting_around',
          title: 'Getting Around',
          type: 'Local Transport',
          description: data.transportationTips?.gettingAround || 'Local transportation options',
          tips: data.transportationTips?.downloadApps?.join?.(', ') || 'Download local transport apps',
          completed: false
        }
      ],
      
      localTips: (data.localInsiderTips || []).map((tip: string | any, index: number) => ({
        id: `tip_${index + 1}`,
        title: `Insider Tip ${index + 1}`,
        description: typeof tip === 'string' ? tip : tip.description || tip.tip || 'Local tip',
        category: 'culture' as const,
        tip: typeof tip === 'string' ? tip : tip.description || tip.tip || 'Local tip',
        completed: false
      })),
      
      // Additional data
      overview: data.overview || `Discover the best of ${cityName} with this personalized itinerary.`,
      budgetEstimate: data.budgetEstimate || {
        dailyFoodBudget: '$30-80 per person',
        attractionsCost: '$100-300 total',
        transportationCost: '$15-40 per day',
        totalEstimate: '$500-1000 for entire trip'
      },
      weatherConsiderations: data.weatherConsiderations || {
        seasonalTips: `Check weather conditions for ${cityName} during your travel dates`,
        backupIndoorActivities: ['Museums', 'Shopping Centers', 'Cafes'],
        whatToPack: ['Comfortable walking shoes', 'Weather-appropriate clothing']
      }
    };
    
    console.log('🎯 Final transformed itinerary:', JSON.stringify(transformedItinerary, null, 2));
    return transformedItinerary;
  }
  
  // If response is in a different format, try to parse it flexibly
  console.log('🔄 Using flexible parsing with fallback');
  const fallbackItinerary = generateComprehensiveFallbackItinerary(cityName, { 
    tripName: data.tripName || 'Your Trip',
    cities: [cityName],
    interests: data.allInterests || []
  } as TripFormData);
  
  // Try to merge any available data from webhook response
  if (data.attractions) {
    fallbackItinerary.mustDos = data.attractions.map((attr: any, idx: number) => ({
      id: `must_do_${idx + 1}`,
      title: attr.name || attr.title || attr,
      description: attr.description || 'Recommended attraction',
      category: 'sightseeing' as const,
      estimatedTime: attr.estimatedTime || '2-3 hours',
      completed: false
    }));
  }
  
  if (data.restaurants) {
    fallbackItinerary.foodRecommendations = data.restaurants.map((rest: any, idx: number) => ({
      id: `food_${idx + 1}`,
      title: rest.name || rest.title || rest,
      description: rest.description || 'Recommended restaurant',
      category: 'restaurant' as const,
      cuisine: rest.cuisine || 'Local',
      completed: false
    }));
  }
  
  console.log('🎯 Final fallback itinerary:', JSON.stringify(fallbackItinerary, null, 2));
  return fallbackItinerary;
}

// Comprehensive fallback itinerary generator
function generateComprehensiveFallbackItinerary(cityName: string, tripData: TripFormData): ItineraryData & any {
  const numberOfDays = tripData.startDate && tripData.endDate
    ? Math.max(1, Math.ceil((tripData.endDate.getTime() - tripData.startDate.getTime()) / (1000*60*60*24)) + 1)
    : 7;

  const cityLowerCase = cityName.toLowerCase();
  
  // City-specific data
  const cityData: { [key: string]: any } = {
    mumbai: {
      mustDoAttractions: [
        { name: "Gateway of India", location: "Apollo Bandar, Colaba", description: "Iconic arch monument overlooking the Arabian Sea", bestTimeToVisit: "Evening", insiderTip: "Visit at sunset for the best photos", estimatedTime: "1-2 hours" },
        { name: "Marine Drive", location: "Netaji Subhash Chandra Bose Rd", description: "The Queen's Necklace - beautiful seafront promenade", bestTimeToVisit: "Evening", insiderTip: "Perfect for evening walks and street food", estimatedTime: "2-3 hours" },
        { name: "Elephanta Caves", location: "Elephanta Island", description: "Ancient rock-cut caves with Hindu sculptures", bestTimeToVisit: "Morning", insiderTip: "Take the ferry early to avoid crowds", estimatedTime: "4-5 hours" },
      ],
      foodAndDrinks: [
        { restaurantName: "Leopold Cafe", location: "Colaba Causeway", cuisine: "Continental & Indian", mustTryDishes: ["Chicken Tikka", "Fish & Chips"], priceRange: "$$", specialtyNote: "Historic cafe frequented by locals and tourists", bestTime: "Lunch" },
        { restaurantName: "Trishna", location: "Fort, Mumbai", cuisine: "Seafood", mustTryDishes: ["Koliwada Prawns", "Crab Curry"], priceRange: "$$$", specialtyNote: "Award-winning seafood restaurant", bestTime: "Dinner" },
        { restaurantName: "Mohammed Ali Road", location: "Mohammed Ali Road", cuisine: "Street Food", mustTryDishes: ["Seekh Kebabs", "Malpua"], priceRange: "$", specialtyNote: "Famous street food during Ramadan", bestTime: "Evening" },
      ],
      overview: "Mumbai, the financial capital of India, offers a perfect blend of colonial architecture, Bollywood glamour, street food culture, and bustling markets. From iconic landmarks to vibrant nightlife, Mumbai promises an unforgettable experience.",
    },
    paris: {
      mustDoAttractions: [
        { name: "Eiffel Tower", location: "Champ de Mars, 5 Avenue Anatole France", description: "Iconic iron lattice tower and symbol of Paris", bestTimeToVisit: "Evening", insiderTip: "Book skip-the-line tickets in advance", estimatedTime: "2-3 hours" },
        { name: "Louvre Museum", location: "Rue de Rivoli", description: "World's largest art museum housing the Mona Lisa", bestTimeToVisit: "Morning", insiderTip: "Enter through the less crowded Carrousel entrance", estimatedTime: "4-6 hours" },
        { name: "Notre-Dame Cathedral", location: "Île de la Cité", description: "Gothic masterpiece with stunning architecture", bestTimeToVisit: "Morning", insiderTip: "Climb the towers for panoramic city views", estimatedTime: "2-3 hours" },
      ],
      foodAndDrinks: [
        { restaurantName: "L'As du Fallafel", location: "Rue des Rosiers, Marais", cuisine: "Middle Eastern", mustTryDishes: ["Fallafel Special", "Hummus"], priceRange: "$", specialtyNote: "Best falafel in Paris", bestTime: "Lunch" },
        { restaurantName: "Le Comptoir du 7ème", location: "7th Arrondissement", cuisine: "French", mustTryDishes: ["Coq au Vin", "Crème Brûlée"], priceRange: "$$$", specialtyNote: "Classic French bistro experience", bestTime: "Dinner" },
        { restaurantName: "Pierre Hermé", location: "Multiple locations", cuisine: "Patisserie", mustTryDishes: ["Macarons", "Croissants"], priceRange: "$$", specialtyNote: "World-renowned patisserie", bestTime: "Snack" },
      ],
      overview: "Paris, the City of Light, enchants visitors with its iconic landmarks, world-class museums, charming neighborhoods, and exquisite cuisine. Experience romance, art, and culture in one of the world's most beautiful cities.",
    }
  };

  // Use city-specific data or generic fallback
  const currentCityData = cityData[cityLowerCase] || {
    mustDoAttractions: [
      { name: `${cityName} City Center`, location: "Downtown Area", description: "Explore the heart of the city", bestTimeToVisit: "Morning", insiderTip: "Start early to avoid crowds", estimatedTime: "2-3 hours" },
      { name: `${cityName} Historic District`, location: "Old Town", description: "Discover local history and architecture", bestTimeToVisit: "Afternoon", insiderTip: "Join a guided walking tour", estimatedTime: "3-4 hours" },
    ],
    foodAndDrinks: [
      { restaurantName: `Best Local Restaurant in ${cityName}`, location: "City Center", cuisine: "Local", mustTryDishes: ["Local Specialty", "Regional Favorite"], priceRange: "$$", specialtyNote: "Authentic local cuisine", bestTime: "Dinner" },
      { restaurantName: `${cityName} Street Food Market`, location: "Market Square", cuisine: "Street Food", mustTryDishes: ["Street Snacks", "Local Drinks"], priceRange: "$", specialtyNote: "Experience local food culture", bestTime: "Lunch" },
    ],
    overview: `Discover the unique charm of ${cityName} with its blend of culture, history, and local cuisine. This personalized itinerary will help you experience the best the city has to offer.`,
  };

  const itinerary: ItineraryData & any = {
    mustDos: currentCityData.mustDoAttractions.map((attraction: any, index: number) => ({
      id: `must_do_${index + 1}`,
      title: attraction.name,
      description: `${attraction.description}. Best time: ${attraction.bestTimeToVisit}. ${attraction.insiderTip}`,
      category: 'sightseeing' as const,
      estimatedTime: attraction.estimatedTime,
      completed: false
    })),
    
    foodRecommendations: currentCityData.foodAndDrinks.map((food: any, index: number) => ({
      id: `food_${index + 1}`,
      title: food.restaurantName,
      description: `${food.specialtyNote}. Must try: ${food.mustTryDishes.join(', ')}. ${food.priceRange}`,
      category: 'restaurant' as const,
      cuisine: food.cuisine,
      completed: false
    })),
    
    dayPlans: Array.from({ length: Math.min(numberOfDays, 5) }, (_, dayIndex) => ({
      id: `day_${dayIndex + 1}`,
      day: `Day ${dayIndex + 1}`,
      theme: dayIndex === 0 ? `First Day in ${cityName}` : dayIndex === 1 ? `Cultural Exploration` : dayIndex === 2 ? `Food & Markets` : dayIndex === 3 ? `Hidden Gems` : `Farewell ${cityName}`,
      activities: [
        {
          id: `day${dayIndex + 1}_morning`,
          time: 'Morning' as const,
          title: dayIndex === 0 ? 'Arrival & City Overview' : dayIndex === 1 ? 'Main Attractions' : 'Local Experiences',
          description: `Explore ${cityName} at your own pace`,
          completed: false
        },
        {
          id: `day${dayIndex + 1}_afternoon`,
          time: 'Afternoon' as const,
          title: dayIndex === 0 ? 'Walking Tour' : dayIndex === 1 ? 'Museums & Culture' : 'Shopping & Markets',
          description: `Discover local culture and cuisine | Lunch: Local restaurant - Regional specialties`,
          completed: false
        },
        {
          id: `day${dayIndex + 1}_evening`,
          time: 'Evening' as const,
          title: dayIndex === 0 ? 'Welcome Dinner' : dayIndex === 1 ? 'Local Nightlife' : 'Sunset Views',
          description: `Enjoy evening activities | Dinner: Recommended restaurant - Local favorites`,
          completed: false
        }
      ]
    })),
    
    hotels: [
      {
        id: 'hotel_luxury',
        title: `Luxury Hotel in ${cityName}`,
        name: `Premium ${cityName} Hotel`,
        category: 'luxury' as const,
        description: 'High-end accommodation with excellent service and amenities',
        estimatedPrice: '$200-400/night',
        nearbyAttractions: ['City Center', 'Main Attractions'],
        completed: false
      },
      {
        id: 'hotel_midrange',
        title: `Boutique Hotel in ${cityName}`,
        name: `${cityName} Boutique Stay`,
        category: 'mid-range' as const,
        description: 'Stylish accommodation with local character',
        estimatedPrice: '$100-200/night',
        nearbyAttractions: ['Historic District', 'Local Markets'],
        completed: false
      }
    ],
    
    transport: [
      {
        id: 'transport_airport',
        title: 'Airport Transfer',
        type: 'Airport Connection',
        description: `Best ways to get from the airport to ${cityName} city center`,
        tips: 'Book transfers in advance for better rates',
        completed: false
      },
      {
        id: 'transport_local',
        title: 'Local Transportation',
        type: 'Public Transport',
        description: `Navigate ${cityName} using local transport systems`,
        tips: 'Get a city transport pass for convenience',
        completed: false
      }
    ],
    
    localTips: [
      {
        id: 'tip_cultural',
        title: 'Cultural Etiquette',
        description: 'Learn basic local customs and greetings to connect with locals',
        category: 'culture' as const,
        tip: 'Learn basic local customs and greetings to connect with locals',
        completed: false
      },
      {
        id: 'tip_practical',
        title: 'Practical Advice',
        description: 'Download offline maps and keep emergency contacts handy',
        category: 'practical' as const,
        tip: 'Download offline maps and keep emergency contacts handy',
        completed: false
      }
    ],
    
    // Additional structured data
    overview: currentCityData.overview,
    budgetEstimate: {
      dailyFoodBudget: '$30-80 per person',
      attractionsCost: '$100-300 total',
      transportationCost: '$15-40 per day',
      totalEstimate: `$${50 * numberOfDays}-${150 * numberOfDays} for entire trip`
    },
    weatherConsiderations: {
      seasonalTips: `Check weather conditions for ${cityName} during your travel dates`,
      backupIndoorActivities: ['Museums', 'Shopping Centers', 'Cafes'],
      whatToPack: ['Comfortable walking shoes', 'Weather-appropriate clothing', 'Portable phone charger']
    }
  };

  return itinerary;
}

export default function TravelItinerary({ tripData }: TravelItineraryProps) {
  const { smoothNavigate } = useSmoothNavigation();
  const { user } = useAuth();
  const location = useLocation();
  const savedItinerary = location.state?.savedItinerary;
  const [itineraryData, setItineraryData] = useState<{ [city: string]: ItineraryData }>(savedItinerary || {});
  const [isLoading, setIsLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<ProgressStep[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [tripName, setTripName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tripData.cities.length > 0) {
      setSelectedCity(tripData.cities[0]);
      // Only generate if we don't have saved itinerary data
      if (!savedItinerary || Object.keys(savedItinerary).length === 0) {
        generateItineraries();
      }
    }
  }, [tripData, savedItinerary]);

  const generateItineraries = async () => {
    setIsLoading(true);
    setCurrentProgress([]);
    
    try {
      // Initialize progress steps
      const steps = PROGRESS_STEPS.map(message => ({ message, completed: false }));
      setCurrentProgress(steps);

      // Simulate progress updates
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setCurrentProgress(prev => prev.map((step, index) => 
          index === i ? { ...step, completed: true } : step
        ));
      }

      // Generate full itinerary using the webhook
      const webhookResponse = await geminiApi.generateFullItinerary(tripData);
      
      // Transform the webhook response to match our current data structure
      const newItineraryData: { [city: string]: ItineraryData } = {};
      
      // Handle flexible webhook response format
      const transformedItinerary = transformWebhookResponse(webhookResponse, tripData.cities[0]);
      
      newItineraryData[tripData.cities[0]] = transformedItinerary;
      console.log('💾 Setting itinerary data for city:', tripData.cities[0]);
      console.log('💾 Final itinerary data being set:', JSON.stringify(newItineraryData, null, 2));
      setItineraryData(newItineraryData);
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
      // Use comprehensive fallback with detailed data
      try {
        const newItineraryData: { [city: string]: ItineraryData } = {};
        for (const city of tripData.cities) {
          const comprehensiveItinerary = generateComprehensiveFallbackItinerary(city, tripData);
          newItineraryData[city] = comprehensiveItinerary;
        }
        setItineraryData(newItineraryData);
      } catch (fallbackError) {
        console.error('Fallback itinerary generation also failed:', fallbackError);
      }
    } finally {
      setIsLoading(false);
      setCurrentProgress([]);
    }
  };

  const toggleItemCompletion = (cityName: string, section: keyof ItineraryData, itemId: string) => {
    setItineraryData(prev => ({
      ...prev,
      [cityName]: {
        ...prev[cityName],
        [section]: prev[cityName][section].map((item: any) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        )
      }
    }));
  };

  const startEditing = (itemId: string, currentText: string) => {
    setEditingItem(itemId);
    setEditText(currentText);
  };

  const saveEdit = (cityName: string, section: keyof ItineraryData, itemId: string) => {
    setItineraryData(prev => ({
      ...prev,
      [cityName]: {
        ...prev[cityName],
        [section]: prev[cityName][section].map((item: any) =>
          item.id === itemId ? { ...item, title: editText } : item
        )
      }
    }));
    setEditingItem(null);
    setEditText('');
  };

  const regenerateForCity = (cityName: string) => {
    setIsLoading(true);
    setSelectedCity(cityName);
    
    geminiApi.generateItinerary(cityName, tripData.interests, tripData.startDate, tripData.endDate)
      .then(itinerary => {
        setItineraryData(prev => ({ ...prev, [cityName]: itinerary }));
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to regenerate itinerary:', error);
        setIsLoading(false);
      });
  };

  const saveTripPlan = async () => {
    if (!user || !tripName.trim()) {
      alert('Please enter a trip name');
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('trip_plans')
        .insert({
          user_id: user.id,
          trip_name: tripName,
          destination: tripData.cities.join(', '),
          start_date: tripData.startDate?.toISOString().split('T')[0] || '',
          end_date: tripData.endDate?.toISOString().split('T')[0] || '',
          budget: null,
          travel_style: null,
          interests: tripData.interests || null,
          cities: tripData.cities || null,
          itinerary: JSON.parse(JSON.stringify(itineraryData))
        });

      if (error) throw error;
      
      alert('Trip plan saved successfully!');
      smoothNavigate('/dashboard');
    } catch (error) {
      console.error('Error saving trip plan:', error);
      alert('Failed to save trip plan');
    } finally {
      setIsSaving(false);
    }
  };

  const renderItineraryItem = (
    item: any,
    cityName: string,
    section: keyof ItineraryData,
    icon: React.ReactNode
  ) => (
    <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <button
        onClick={() => toggleItemCompletion(cityName, section, item.id)}
        className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        {item.completed ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {editingItem === item.id ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveEdit(cityName, section, item.id);
                    } else if (e.key === 'Escape') {
                      setEditingItem(null);
                      setEditText('');
                    }
                  }}
                  autoFocus
                />
                <Button
                  onClick={() => saveEdit(cityName, section, item.id)}
                  className="px-2 py-1 text-xs"
                >
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <div className="text-sky-500 mt-1 flex-shrink-0">
                  {icon}
                </div>
                <div className="flex-1">
                  <h4 
                    className={`font-medium text-sm cursor-pointer hover:text-sky-600 transition-colors ${
                      item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                    onClick={() => startEditing(item.id, item.title)}
                  >
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className={`text-xs mt-1 ${
                      item.completed ? 'text-muted-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {item.description}
                    </p>
                  )}
                  {item.estimatedTime && (
                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.estimatedTime}
                    </div>
                  )}
                  {item.cuisine && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-muted rounded-full">
                      {item.cuisine}
                    </span>
                  )}
                  {item.estimatedPrice && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      {item.estimatedPrice}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {editingItem !== item.id && (
            <button
              onClick={() => startEditing(item.id, item.title)}
              className="ml-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderLocalTip = (tip: any, cityName: string) => (
    <div key={tip.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
      <div className="flex items-start space-x-3">
        <button
          onClick={() => toggleItemCompletion(cityName, 'localTips', tip.id)}
          className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {tip.completed ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800 capitalize">
              {tip.category} Tip
            </span>
          </div>
          <p className="text-sm text-yellow-700">{tip.tip}</p>
        </div>
      </div>
    </div>
  );

  const currentItinerary = selectedCity ? itineraryData[selectedCity] : null;

  if (isLoading && currentProgress.length > 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <div className="text-center mb-8">
            <Loader2 className="w-12 h-12 text-sky-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Creating Your Perfect Itinerary
            </h2>
            <p className="text-muted-foreground">
              Personalizing recommendations for {tripData.tripName}
            </p>
          </div>
          
          <div className="space-y-3">
            {currentProgress.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step.completed 
                    ? 'bg-green-500' 
                    : index === currentProgress.findIndex(s => !s.completed)
                      ? 'bg-sky-500 animate-pulse'
                      : 'bg-gray-300'
                }`}>
                  {step.completed && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className={`text-sm ${
                  step.completed ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentItinerary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Generate Your Travel Itinerary
          </h2>
          <p className="text-muted-foreground mb-6">
            Create a personalized itinerary based on your interests
          </p>
          <Button onClick={generateItineraries} className="bg-sky-500 hover:bg-sky-600">
            Generate Itinerary
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{tripData.tripName}</h1>
              <p className="text-muted-foreground">
                {tripData.startDate && tripData.endDate && (
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {tripData.startDate.toLocaleDateString()} - {tripData.endDate.toLocaleDateString()}
                  </span>
                )}
              </p>
              
              {/* Save Trip Form */}
              <div className="mt-4 flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Enter trip name to save..."
                  value={tripName}
                  onChange={(e) => {
                    console.log('Trip name input changed:', e.target.value);
                    setTripName(e.target.value);
                  }}
                  onFocus={() => console.log('Trip name input focused')}
                  onBlur={() => console.log('Trip name input blurred')}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-background text-foreground"
                />
                <Button
                  onClick={saveTripPlan}
                  disabled={isSaving || !tripName.trim()}
                  className="bg-green-500 hover:bg-green-600 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Trip'}</span>
                </Button>
              </div>
            </div>
            <Button
              onClick={generateItineraries}
              className="bg-sky-500 hover:bg-sky-600 flex items-center space-x-2"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Regenerate All</span>
            </Button>
          </div>
          
          {/* City Tabs */}
          {tripData.cities.length > 1 && (
            <div className="flex space-x-4">
              {tripData.cities.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCity === city
                      ? 'bg-sky-500 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Itinerary */}
          <div className="lg:col-span-2 space-y-8">
            {/* Must-Do Attractions */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-sky-500" />
                Must-Do Attractions
              </h2>
              <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                {currentItinerary.mustDos.map(item =>
                  renderItineraryItem(item, selectedCity, 'mustDos', <Star className="w-4 h-4" />)
                )}
              </div>
            </section>

            {/* Food & Drinks */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                <Coffee className="w-5 h-5 mr-2 text-sky-500" />
                Food & Drinks
              </h2>
              <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                {currentItinerary.foodRecommendations.map(item =>
                  renderItineraryItem(item, selectedCity, 'foodRecommendations', <Coffee className="w-4 h-4" />)
                )}
              </div>
            </section>

            {/* Day Plans */}
            {currentItinerary.dayPlans.map(dayPlan => (
              <section key={dayPlan.id}>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-sky-500" />
                  {dayPlan.day}: {dayPlan.theme}
                </h2>
                <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                  {dayPlan.activities.map(activity => (
                    <div key={activity.id} className="border-l-4 border-sky-500 pl-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-sky-600">{activity.time}</span>
                      </div>
                      {renderItineraryItem(activity, selectedCity, 'dayPlans', <Clock className="w-4 h-4" />)}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Local Tips */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-sky-500" />
                Local Tips & Insights
              </h2>
              <div className="space-y-3">
                {currentItinerary.localTips.map(tip =>
                  renderLocalTip(tip, selectedCity)
                )}
              </div>
            </section>

            {/* Budget & Weather Info */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Budget Estimate */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                    💰 Budget Estimate
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Daily Food:</span>
                      <span className="font-medium text-green-800">{(currentItinerary as any).budgetEstimate?.dailyFoodBudget || '$50-100'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Attractions:</span>
                      <span className="font-medium text-green-800">{(currentItinerary as any).budgetEstimate?.attractionsCost || '$100-200'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Transport:</span>
                      <span className="font-medium text-green-800">{(currentItinerary as any).budgetEstimate?.transportationCost || '$20-50/day'}</span>
                    </div>
                    <div className="border-t border-green-300 pt-2 mt-3">
                      <div className="flex justify-between font-semibold">
                        <span className="text-green-800">Total:</span>
                        <span className="text-green-900">{(currentItinerary as any).budgetEstimate?.totalEstimate || '$500-1000'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weather Considerations */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                    🌤️ Weather & Packing
                  </h3>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p><strong>Season:</strong> {(currentItinerary as any).weatherConsiderations?.seasonalTips || 'Check weather for travel dates'}</p>
                    <div>
                      <strong>Pack:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {((currentItinerary as any).weatherConsiderations?.whatToPack || ['Weather-appropriate clothing']).map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>Backup Activities:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {((currentItinerary as any).weatherConsiderations?.backupIndoorActivities || ['Indoor museums and cafes']).map((activity: string, idx: number) => (
                          <li key={idx}>{activity}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Panel - Booking & Map */}
          <div className="space-y-8">
            {/* Trip Overview */}
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                ✨ Trip Overview
              </h3>
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-lg p-4">
                <p className="text-sm text-sky-800 leading-relaxed">
                  {(currentItinerary as any).overview || `Discover the best of ${selectedCity} with this personalized itinerary tailored to your interests.`}
                </p>
              </div>
            </section>

            {/* Hotels */}
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Hotel className="w-5 h-5 mr-2 text-sky-500" />
                Recommended Hotels
              </h3>
              <div className="space-y-3">
                {currentItinerary.hotels.map(hotel => (
                  <div key={hotel.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-foreground">{hotel.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        hotel.category === 'luxury' ? 'bg-purple-100 text-purple-700' :
                        hotel.category === 'mid-range' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {hotel.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{hotel.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-600">{hotel.estimatedPrice}</span>
                      <div className="text-xs text-muted-foreground">
                        Nearby: {((hotel as any).nearbyAttractions || ['City center']).join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Map Placeholder */}
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-sky-500" />
                {selectedCity} Map
              </h3>
              <div className="bg-muted rounded-lg h-64 flex items-center justify-center border border-border">
                <div className="text-center text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-2" />
                  <p>Interactive map coming soon</p>
                  <p className="text-sm">View attractions & restaurants</p>
                </div>
              </div>
            </section>


            {/* Transport */}
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2 text-sky-500" />
                Transport Options
              </h3>
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                {currentItinerary.transport.map(transport => (
                  <div key={transport.id} className="border-l-4 border-sky-500 pl-3">
                    <h4 className="font-medium text-sm text-foreground">{transport.type}</h4>
                    <p className="text-xs text-muted-foreground mb-1">{transport.description}</p>
                    <p className="text-xs text-sky-600">{transport.tips}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => regenerateForCity(selectedCity)}
                  className="w-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center space-x-2"
                  disabled={isLoading}
                >
                  <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Regenerate {selectedCity}</span>
                </Button>
                
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600 flex items-center justify-center space-x-2"
                  onClick={() => smoothNavigate('/book-flight')}
                >
                  <Plane className="w-4 h-4" />
                  <span>Find Flights</span>
                </Button>
                
                <Button 
                  className="w-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center space-x-2"
                  onClick={() => smoothNavigate('/book-hotels')}
                >
                  <Hotel className="w-4 h-4" />
                  <span>Find Hotels</span>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}