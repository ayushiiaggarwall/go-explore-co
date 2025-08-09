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

      // Generate full itinerary using the new edge function
      const fullItinerary = await geminiApi.generateFullItinerary(tripData);
      
      // Transform the response to match our current data structure
      const newItineraryData: { [city: string]: ItineraryData } = {};
      newItineraryData[tripData.cities[0]] = fullItinerary;

      setItineraryData(newItineraryData);
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
      // Fallback to old method if new one fails
      try {
        const newItineraryData: { [city: string]: ItineraryData } = {};
        for (const city of tripData.cities) {
          const itinerary = await geminiApi.generateItinerary(
            city,
            tripData.interests,
            tripData.startDate,
            tripData.endDate
          );
          newItineraryData[city] = itinerary;
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
          </div>

          {/* Right Panel - Booking & Map */}
          <div className="space-y-8">
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