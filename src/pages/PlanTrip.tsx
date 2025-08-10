import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/input';
import Button from '../components/ui/Button';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { format } from 'date-fns';
import TravelItinerary from '../components/TravelItinerary';
import { TripFormData } from '../services/geminiApi';

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
  'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
  'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
  'Varanasi', 'Srinagar', 'Dhanbad', 'Jodhpur', 'Amritsar', 'Raipur', 'Allahabad',
  'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Madurai', 'Guwahati', 'Chandigarh',
  'Hubli-Dharwad', 'Mysore', 'Tiruchirappalli', 'Bareilly', 'Aligarh', 'Tiruppur',
  'Gurgaon', 'Moradabad', 'Jalandhar', 'Bhubaneswar', 'Salem', 'Mira-Bhayandar',
  'Warangal', 'Guntur', 'Bhiwandi', 'Saharanpur', 'Gorakhpur', 'Bikaner', 'Amravati',
  'Noida', 'Jamshedpur', 'Bhilai', 'Cuttack', 'Firozabad', 'Kochi', 'Nellore',
  'Bhavnagar', 'Dehradun', 'Durgapur', 'Asansol', 'Rourkela', 'Nanded', 'Kolhapur',
  'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri', 'Jhansi',
  'Ulhasnagar', 'Jammu', 'Sangli-Miraj & Kupwad', 'Mangalore', 'Erode', 'Belgaum',
  'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya', 'Jalgaon', 'Udaipur', 'Maheshtala'
];

const INTEREST_CATEGORIES = {
  activities: {
    title: "🍎 Activities",
    options: [
      { icon: "🏖️", label: "Beach vibes" },
      { icon: "🏈", label: "Sports" },
      { icon: "💧", label: "Water activities" },
      { icon: "⛷️", label: "Winter sports" },
      { icon: "🧗", label: "Climbing" },
      { icon: "🚴", label: "Cycling" },
      { icon: "🏕️", label: "Camping" },
      { icon: "🥾", label: "Hiking" },
      { icon: "💥", label: "Adrenaline" },
      { icon: "🎢", label: "Theme parks" }
    ]
  },
  food: {
    title: "🍽️ Food and drinks",
    options: [
      { icon: "☕", label: "Coffee" },
      { icon: "🏴", label: "International" },
      { icon: "🥢", label: "Chinese" },
      { icon: "🥖", label: "French" },
      { icon: "🍛", label: "Indian" },
      { icon: "🍕", label: "Italian" },
      { icon: "🏯", label: "Japanese" },
      { icon: "🥘", label: "Korean" },
      { icon: "🌮", label: "Mexican" },
      { icon: "🍜", label: "Thai" },
      { icon: "🥗", label: "Vegan" },
      { icon: "🦞", label: "Seafood" },
      { icon: "🍣", label: "Sushi" },
      { icon: "🍦", label: "Ice cream" },
      { icon: "🍴", label: "Dining Establishments" },
      { icon: "🥐", label: "Bakery" },
      { icon: "🍷", label: "Bar" },
      { icon: "☕", label: "Cafe" },
      { icon: "🏪", label: "Restaurants" },
      { icon: "🍹", label: "Drinks" }
    ]
  },
  entertainment: {
    title: "🏙️ Urban entertainment and nightlife",
    options: [
      { icon: "🛍️", label: "Shopping" },
      { icon: "💃", label: "Dancing" },
      { icon: "🎬", label: "Cinemas" },
      { icon: "🔞", label: "Adult entertainment" },
      { icon: "😂", label: "Comedy clubs" }
    ]
  },
  sightseeing: {
    title: "🏛️ Sightseeing",
    options: [
      { icon: "🌲", label: "Nature" },
      { icon: "🎨", label: "Art" },
      { icon: "🏛️", label: "Museums" },
      { icon: "🏰", label: "Historical sites" },
      { icon: "🌉", label: "Bridges" },
      { icon: "📚", label: "Libraries" },
      { icon: "🪦", label: "Memorials" },
      { icon: "📍", label: "Lookout points" },
      { icon: "🏗️", label: "Architecture" },
      { icon: "🚢", label: "Ships" },
      { icon: "🐠", label: "Aquariums" },
      { icon: "🏙️", label: "Urban architecture" },
      { icon: "🛣️", label: "Interesting streets" }
    ]
  },
  wellness: {
    title: "🧘 R&R",
    options: [
      { icon: "💆", label: "Massage" },
      { icon: "🧘", label: "Wellness" }
    ]
  }
};

export default function PlanTrip() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    destinations: [] as string[],
    currentDestination: '',
    tripName: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    selectedInterests: [] as string[]
  });
  const [showItinerary] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);
  const [cityImage, setCityImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const searchIndiaCities = (query: string, limit: number = 8): string[] => {
    if (!query) return INDIAN_CITIES.slice(0, limit);
    
    const filtered = INDIAN_CITIES.filter(city =>
      city.toLowerCase().includes(query.toLowerCase())
    );
    
    return filtered.slice(0, limit);
  };

  // Function to get predefined city images
  const fetchCityImage = useCallback(async (cityName: string) => {
    if (!cityName || cityName.length < 3) return;
    
    setLoadingImage(true);
    
    // Predefined city images - no API calls needed
    const cityImages: { [key: string]: string } = {
      // Major Indian Cities
      'mumbai': 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?q=80&w=1000',
      'delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1000', 
      'bangalore': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=1000',
      'hyderabad': 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?q=80&w=1000',
      'chennai': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000',
      'kolkata': 'https://images.unsplash.com/photo-1558431382-27343421d9a9?q=80&w=1000',
      'pune': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1000',
      'jaipur': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1000',
      'ahmedabad': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1000',
      'surat': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000',
      'lucknow': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1000',
      'kanpur': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000',
      'nagpur': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=1000',
      'indore': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1000',
      'chandigarh': 'https://images.unsplash.com/photo-1590736969955-71cc94901144?q=80&w=1000',
      'bhopal': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1000',
      'visakhapatnam': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=1000',
      'patna': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1000',
      'vadodara': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000',
      'ghaziabad': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1000',
      'ludhiana': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=1000',
      'agra': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1000',
      'nashik': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1000',
      'faridabad': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1000',
      'meerut': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1000',
      'rajkot': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000',
      'varanasi': 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=1000',
      'srinagar': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
      'jammu': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
      'amritsar': 'https://images.unsplash.com/photo-1608967303750-77bd0e7fe0e4?q=80&w=1000',
      'allahabad': 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=1000',
      'coimbatore': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000',
      'jabalpur': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1000',
      'gwalior': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1000',
      'vijayawada': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000',
      'madurai': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000',
      'guwahati': 'https://images.unsplash.com/photo-1558431382-27343421d9a9?q=80&w=1000',
      'mysore': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000',
      'tiruchirappalli': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000',
      'bhubaneswar': 'https://images.unsplash.com/photo-1558431382-27343421d9a9?q=80&w=1000',
      'salem': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000',
      'goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1000',
      'kochi': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1000',
      'thiruvananthapuram': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1000',
      'mangalore': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1000',
      'udaipur': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1000',
      'jodhpur': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1000',
      'bikaner': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1000',
      'ajmer': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1000',
      'dehradun': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
      'rishikesh': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
      'haridwar': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
      'shimla': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
      'manali': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
      'dharamshala': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
      'himachal pradesh': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
      'kashmir': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
      'leh': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
      'ladakh': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
      'khula haath': 'https://images.unsplash.com/photo-1578448073881-c71b2b2e0133?q=80&w=1000',
      
      // International Cities
      'paris': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?q=80&w=1000',
      'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1000',
      'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1000',
      'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000',
      'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1000',
      'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1000',
      'hong kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?q=80&w=1000',
      'bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=1000',
      'kuala lumpur': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1000',
      'bali': 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?q=80&w=1000',
      'seoul': 'https://images.unsplash.com/photo-1540960221708-c1f1a9739d10?q=80&w=1000',
      'beijing': 'https://images.unsplash.com/photo-1516908205727-40afad9449a8?q=80&w=1000',
      'shanghai': 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?q=80&w=1000',
      'los angeles': 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?q=80&w=1000',
      'san francisco': 'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?q=80&w=1000',
      'chicago': 'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?q=80&w=1000',
      'las vegas': 'https://images.unsplash.com/photo-1506674677985-5a8ae936a68c?q=80&w=1000',
      'miami': 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=1000',
      'boston': 'https://images.unsplash.com/photo-1503318847278-52d50e9e5735?q=80&w=1000',
      'rome': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?q=80&w=1000',
      'barcelona': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=1000',
      'madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=1000',
      'amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?q=80&w=1000',
      'berlin': 'https://images.unsplash.com/photo-1587330979470-3016b6702d89?q=80&w=1000',
      'zurich': 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?q=80&w=1000',
      'vienna': 'https://images.unsplash.com/photo-1516550135131-fe3dcb0bedc7?q=80&w=1000',
      'prague': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1000',
      'budapest': 'https://images.unsplash.com/photo-1541220971793-f9671a5cb2ad?q=80&w=1000',
      'istanbul': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1000',
      'athens': 'https://images.unsplash.com/photo-1555993539-1732b0258235?q=80&w=1000',
      'cairo': 'https://images.unsplash.com/photo-1578070181910-f1aab0d0f3b9?q=80&w=1000',
      'cape town': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?q=80&w=1000',
      'sydney': 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=1000',
      'melbourne': 'https://images.unsplash.com/photo-1545044846-351726a739f5?q=80&w=1000',
      'toronto': 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1000',
      'vancouver': 'https://images.unsplash.com/photo-1549880181-56a44cf4a9a5?q=80&w=1000',
      'mexico city': 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?q=80&w=1000',
      'rio de janeiro': 'https://images.unsplash.com/photo-1544989164-ec1e4b31decd?q=80&w=1000',
      'sao paulo': 'https://images.unsplash.com/photo-1544989164-ec1e4b31decd?q=80&w=1000',
      'buenos aires': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?q=80&w=1000',
      'lima': 'https://images.unsplash.com/photo-1531968455001-5c5272a41129?q=80&w=1000',
      'phuket': 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?q=80&w=1000',
      'maldives': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1000',
      'mauritius': 'https://images.unsplash.com/photo-1544550285-f813152fb2fd?q=80&w=1000',
      'seychelles': 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=1000'
    };
    
    const normalizedCity = cityName.toLowerCase();
    const selectedImageUrl = cityImages[normalizedCity] || 
                            // Default beautiful travel destination image for any unlisted city
                            'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop';
    
    console.log(`🖼️ Setting image for ${cityName}:`, selectedImageUrl);
    setCityImage(selectedImageUrl);
    
    setTimeout(() => {
      setLoadingImage(false);
    }, 500); // Small delay to show loading state
  }, []);

  // Debounced effect to fetch image when destination changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      const destination = formData.destinations[formData.destinations.length - 1] || formData.currentDestination;
      if (destination && destination.length >= 3) {
        fetchCityImage(destination);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeout);
  }, [formData.currentDestination, formData.destinations, fetchCityImage]);

  const handleDestinationClick = (destination: string) => {
    setFormData(prev => ({ 
      ...prev, 
      currentDestination: '',
      destinations: prev.destinations.includes(destination) 
        ? prev.destinations 
        : [...prev.destinations, destination]
    }));
    setShowDestinations(false);
    // Immediately fetch image for selected destination
    fetchCityImage(destination);
  };

  const removeDestination = (destinationToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      destinations: prev.destinations.filter(d => d !== destinationToRemove),
      currentDestination: prev.currentDestination === destinationToRemove ? '' : prev.currentDestination
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      selectedInterests: prev.selectedInterests.includes(interest)
        ? prev.selectedInterests.filter(i => i !== interest)
        : [...prev.selectedInterests, interest]
    }));
  };

  const handleStartFromScratch = () => {
    // Convert form data to TripFormData format and navigate to itinerary
    const tripData: TripFormData = {
      tripName: formData.tripName,
      startDate: formData.startDate,
      endDate: formData.endDate,
      cities: formData.destinations.length > 0 ? formData.destinations : [formData.currentDestination],
      interests: formData.selectedInterests
    };
    
    // Option 1: Navigate to separate page (better for URL management)
    navigate('/trip-itinerary', { state: { tripData } });
    
    // Option 2: Show inline (uncomment below and comment above)
    // setShowItinerary(true);
  };

  const renderProgressDots = () => (
    <div className="flex justify-center space-x-3 mb-12">
      {[1, 2, 3, 4].map((step) => (
        <div
          key={step}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            step === currentStep 
              ? 'bg-red-500 scale-125' 
              : step < currentStep 
                ? 'bg-red-300' 
                : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );

  if (showItinerary) {
    const tripData: TripFormData = {
      tripName: formData.tripName,
      startDate: formData.startDate,
      endDate: formData.endDate,
      cities: formData.destinations.length > 0 ? formData.destinations : [formData.currentDestination],
      interests: formData.selectedInterests
    };
    
    return <TravelItinerary tripData={tripData} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="text-center py-8 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground mb-2">Plan Your Trip</h1>
        <p className="text-muted-foreground">Create your perfect travel experience with TravelEase</p>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-8">
        {renderProgressDots()}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Form */}
          <div className="space-y-8 lg:pt-12">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
            )}

            {/* Step 1: Destination */}
            {currentStep === 1 && (
              <div className="space-y-8 lg:pr-8">
                <div className="text-center">
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-8">
                    What's your first destination?
                  </h2>
                </div>
                <div className="space-y-4 flex flex-col items-center">
                  <div className="w-full max-w-md space-y-4">
                    {/* Selected Destinations */}
                    {formData.destinations.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Selected Destinations:</label>
                        <div className="flex flex-wrap gap-2">
                          {formData.destinations.map((dest, index) => (
                            <div key={index} className="flex items-center bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                              <span>{dest}</span>
                              <button
                                onClick={() => removeDestination(dest)}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Add Destination Input */}
                    <div className="relative">
                      <Input
                        value={formData.currentDestination}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentDestination: e.target.value }))}
                        onFocus={() => setShowDestinations(true)}
                        onBlur={() => setTimeout(() => setShowDestinations(false), 200)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && formData.currentDestination.trim()) {
                            e.preventDefault();
                            fetchCityImage(formData.currentDestination.trim());
                          }
                        }}
                        placeholder={formData.destinations.length > 0 ? "Add another destination..." : "Enter your destination city..."}
                        className="text-lg p-4 h-14 text-center border-2 border-gray-200 focus:border-red-500 rounded-xl"
                      />
                      
                      {showDestinations && (
                        <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto mt-2">
                          {searchIndiaCities(formData.currentDestination, 8)
                            .filter(city => !formData.destinations.includes(city))
                            .map((city, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleDestinationClick(city)}
                              className="w-full text-left px-4 py-3 hover:bg-muted border-b border-border last:border-b-0 text-foreground transition-colors"
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={formData.destinations.length === 0 && !formData.currentDestination}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-lg font-semibold"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Trip Name */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  Let's give your trip a name!
                </h2>
                
                <div className="space-y-4">
                  <Input
                    value={formData.tripName}
                    onChange={(e) => setFormData(prev => ({ ...prev, tripName: e.target.value }))}
                    placeholder="Enter a fun name! eg. Girls Euro Trip"
                    className="text-lg p-4 h-14 text-center border-2 border-gray-200 focus:border-red-500 rounded-xl"
                  />

                  <Button
                    onClick={handleNext}
                    disabled={!formData.tripName}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-lg font-semibold"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Date Selection */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  When are you going on your trip?
                </h2>
                
                <div className="space-y-6">
                  <div className="space-y-6">
                    <div className="text-center">
                      <button className="px-6 py-3 border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                        Not sure yet!
                      </button>
                    </div>
                    
                    <div className="bg-card border-2 border-gray-200 rounded-xl p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Select your travel dates</h3>
                        <p className="text-sm text-muted-foreground">Choose your departure and return dates</p>
                      </div>
                      
                      <CalendarComponent
                        mode="range"
                        selected={{
                          from: formData.startDate,
                          to: formData.endDate
                        }}
                        onSelect={(range) => {
                          if (range?.from) {
                            setFormData(prev => ({
                              ...prev,
                              startDate: range.from,
                              endDate: range.to
                            }));
                          }
                        }}
                        className="w-full"
                        numberOfMonths={2}
                      />
                      
                      {formData.startDate && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium">From: </span>
                              <span className="text-muted-foreground">
                                {format(formData.startDate, 'MMM dd, yyyy')}
                              </span>
                            </div>
                            {formData.endDate && (
                              <div>
                                <span className="font-medium">To: </span>
                                <span className="text-muted-foreground">
                                  {format(formData.endDate, 'MMM dd, yyyy')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleNext}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-lg font-semibold"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Interest Selection */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  What interests you?
                </h2>
                
                <div className="space-y-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for filters"
                      className="w-full p-4 pl-12 border-2 border-gray-200 focus:border-red-500 rounded-xl bg-background text-lg"
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-muted-foreground rounded-full"></div>
                    </div>
                    <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      ✕
                    </button>
                  </div>

                  <div className="space-y-8 max-h-96 overflow-y-auto">
                    {Object.entries(INTEREST_CATEGORIES).map(([key, category]) => (
                      <div key={key} className="space-y-4">
                        <h3 className="font-semibold text-lg text-foreground flex items-center">
                          <span className="mr-3 text-red-500">▼</span>
                          {category.title}
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {category.options.map((option) => (
                            <button
                              key={option.label}
                              onClick={() => handleInterestToggle(option.label)}
                              className={`px-4 py-3 rounded-xl border text-sm flex items-center space-x-2 transition-all ${
                                formData.selectedInterests.includes(option.label)
                                  ? 'bg-red-500 text-white border-red-500'
                                  : 'bg-background border-gray-200 hover:bg-muted hover:border-red-300'
                              }`}
                            >
                              <span className="text-lg">{option.icon}</span>
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={handleStartFromScratch}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-lg font-semibold"
                    >
                      Start Planning
                    </Button>
                    
                    <div className="text-center">
                      <button className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - City Image and Character */}
          <div className="lg:block hidden">
            <div className="space-y-6">
              {/* City Image */}
              <div className="relative rounded-xl h-[400px] overflow-hidden shadow-xl">
                {cityImage ? (
                  <div className="relative h-full">
                    <img 
                      src={cityImage} 
                      alt={`${formData.destinations[formData.destinations.length - 1] || formData.currentDestination} cityscape`}
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.error('Image failed to load:', cityImage);
                        setCityImage(null);
                      }}
                      onLoad={() => {
                        console.log('✅ Image successfully loaded:', cityImage);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 h-full relative">
                    <div className="absolute inset-0 bg-black/20"></div>
                    {loadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                          <p className="text-sm">Loading city image...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
                    <span className="text-orange-300 font-bold text-lg">TE</span>
                  </div>
                  <p className="text-base opacity-90 font-medium">
                    {formData.destinations.length > 0 
                      ? `${formData.destinations.join(', ')} • `
                      : formData.currentDestination 
                        ? `${formData.currentDestination} • ` 
                        : ''
                    }
                    {formData.startDate ? format(formData.startDate, 'dd MMM') : '3 August'}
                    {formData.endDate ? ` - ${format(formData.endDate, 'dd MMM')}` : ''}
                  </p>
                </div>
              </div>

              {/* Character Image */}
              <div className="flex justify-center">
                <img 
                  src="/lovable-uploads/6388fcab-d647-45a2-8a45-ed2fa64b81a6.png"
                  alt="Travel Character"
                  className="w-48 h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}