import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/input';
import Button from '../components/ui/Button';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { format } from 'date-fns';

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
    destination: '',
    tripName: '',
    date: undefined as Date | undefined,
    selectedInterests: [] as string[]
  });
  const [showDestinations, setShowDestinations] = useState(false);

  const searchIndiaCities = (query: string, limit: number = 8): string[] => {
    if (!query) return INDIAN_CITIES.slice(0, limit);
    
    const filtered = INDIAN_CITIES.filter(city =>
      city.toLowerCase().includes(query.toLowerCase())
    );
    
    return filtered.slice(0, limit);
  };

  const handleDestinationClick = (destination: string) => {
    setFormData(prev => ({ ...prev, destination }));
    setShowDestinations(false);
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
    // Navigate to general search or recommendations
    navigate('/search');
  };

  const renderProgressDots = () => (
    <div className="flex justify-center space-x-2 mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div
          key={step}
          className={`w-2 h-2 rounded-full ${
            step === currentStep 
              ? 'bg-red-500' 
              : step < currentStep 
                ? 'bg-red-300' 
                : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
          </div>
          <span className="text-sm text-muted-foreground">WELCOME TO PILOT</span>
        </div>
        <div className="flex space-x-4">
          <button className="text-red-500 text-sm">Cancel</button>
          <button className="text-red-500 text-sm">Skip all</button>
        </div>
      </div>

      {renderProgressDots()}

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Form */}
          <div className="space-y-8">
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
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-normal text-foreground">
                  What's your first destination?
                </h1>
                
                <div className="relative">
                  <Input
                    value={formData.destination}
                    onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                    onFocus={() => setShowDestinations(true)}
                    onBlur={() => setTimeout(() => setShowDestinations(false), 200)}
                    placeholder="Chennai"
                    className="text-lg p-4 h-12"
                  />
                  
                  {showDestinations && (
                    <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto mt-1">
                      {searchIndiaCities(formData.destination, 8).map((city, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleDestinationClick(city)}
                          className="w-full text-left px-4 py-3 hover:bg-muted border-b border-border last:border-b-0 text-foreground"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!formData.destination}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-full"
                >
                  Next
                </Button>
              </div>
            )}

            {/* Step 2: Trip Name */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-normal text-foreground">
                  Let's give your trip a name!
                </h1>
                
                <Input
                  value={formData.tripName}
                  onChange={(e) => setFormData(prev => ({ ...prev, tripName: e.target.value }))}
                  placeholder="Enter a fun name! eg. Girls Euro Trip"
                  className="text-lg p-4 h-12"
                />

                <Button
                  onClick={handleNext}
                  disabled={!formData.tripName}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-full"
                >
                  Next
                </Button>
              </div>
            )}

            {/* Step 3: Date Selection */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-normal text-foreground">
                  When are you going to {formData.destination}?
                </h1>
                
                <div className="space-y-4">
                  <button className="px-4 py-2 border border-border rounded-full text-muted-foreground">
                    Not sure yet!
                  </button>
                  
                  <div className="bg-card border border-border rounded-lg p-4">
                    <CalendarComponent
                      mode="single"
                      selected={formData.date}
                      onSelect={(date: Date | undefined) => setFormData(prev => ({ ...prev, date }))}
                      className="w-full"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleNext}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-full"
                >
                  Next
                </Button>
              </div>
            )}

            {/* Step 4: Interest Selection */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-normal text-foreground">
                  Quick Start
                </h1>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for filters"
                    className="w-full p-3 pl-10 border border-border rounded-md bg-background"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border border-muted-foreground rounded-full"></div>
                  </div>
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    ✕
                  </button>
                </div>

                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {Object.entries(INTEREST_CATEGORIES).map(([key, category]) => (
                    <div key={key} className="space-y-3">
                      <h3 className="font-medium text-foreground flex items-center">
                        <span className="mr-2">▼</span>
                        {category.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {category.options.map((option) => (
                          <button
                            key={option.label}
                            onClick={() => handleInterestToggle(option.label)}
                            className={`px-3 py-2 rounded-full border text-sm flex items-center space-x-2 ${
                              formData.selectedInterests.includes(option.label)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border hover:bg-muted'
                            }`}
                          >
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleStartFromScratch}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-full"
                  >
                    Start from scratch
                  </Button>
                  
                  <div className="text-center">
                    <button className="text-muted-foreground text-sm">Clear</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Image */}
          <div className="lg:block hidden">
            <div className="bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 rounded-lg h-96 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-2">
                  <span className="text-orange-300 font-bold">AA</span>
                </div>
                <p className="text-sm opacity-90">
                  {formData.destination && `${formData.destination} • `}
                  {formData.date ? format(formData.date, 'dd MMMM') : '3 August'} • 1 day
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}