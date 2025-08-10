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

  // Function to fetch AI-generated city image using Gemini
  const fetchCityImage = useCallback(async (cityName: string) => {
    if (!cityName || cityName.length < 3) return;
    
    setLoadingImage(true);
    try {
      console.log(`🎨 Generating AI image for: ${cityName}`);
      
      const response = await fetch('https://ioifldpjlfotqvtaidem.supabase.co/functions/v1/generate-city-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cityName: cityName
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        setCityImage(data.imageUrl);
        console.log(`✅ ${data.isGenerated ? 'Generated' : 'Fallback'} image loaded for ${cityName}`);
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error) {
      console.error('Error fetching city image:', error);
      // Final fallback to a beautiful default travel image
      setCityImage('https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?q=80&w=1000&auto=format&fit=crop');
    } finally {
      setLoadingImage(false);
    }
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

          {/* Right Column - City Image */}
          <div className="lg:block hidden">
            <div className="relative rounded-xl h-[500px] overflow-hidden shadow-xl">
              {cityImage ? (
                <div className="relative h-full">
                  <img 
                    src={cityImage} 
                    alt={`${formData.destinations[formData.destinations.length - 1] || formData.currentDestination} cityscape`}
                    className="w-full h-full object-cover"
                    onError={() => setCityImage(null)}
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
          </div>
        </div>
      </div>
    </div>
  );
}