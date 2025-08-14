import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Star, User, Trash2, Plane, Building, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { formatPrice, formatDate } from '../utils/validation';
import Button from '../components/ui/Button';
import { supabase } from '../integrations/supabase/client';

interface TripPlan {
  id: string;
  trip_name: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget?: number | null;
  travel_style?: string | null;
  interests?: string[] | null;
  cities?: string[] | null;
  itinerary?: any;
  created_at: string;
}

interface ParallelUniverseItinerary {
  id: string;
  persona_name: string;
  persona_description?: string | null;
  persona_image_url?: string | null;
  itinerary_data: any;
  destination?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { flightBookings, hotelBookings, loading: bookingsLoading, deleteFlight, deleteHotel } = useBookings();
  const [tripPlans, setTripPlans] = useState<TripPlan[]>([]);
  const [parallelItineraries, setParallelItineraries] = useState<ParallelUniverseItinerary[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'trips' | 'parallel'>('bookings');

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/';
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (user) {
      loadTripPlans();
      loadParallelItineraries();
    }
  }, [user]);

  const loadTripPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTripPlans(data || []);
    } catch (error) {
      console.error('Error loading trip plans:', error);
    }
  };

  const loadParallelItineraries = async () => {
    try {
      const { data, error } = await supabase
        .from('parallel_universe_itineraries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParallelItineraries(data || []);
    } catch (error) {
      console.error('Error loading parallel universe itineraries:', error);
    }
  };

  const deleteTripPlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('trip_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      
      setTripPlans(prev => prev.filter(plan => plan.id !== planId));
    } catch (error) {
      console.error('Error deleting trip plan:', error);
    }
  };

  const deleteParallelItinerary = async (itineraryId: string) => {
    try {
      const { error } = await supabase
        .from('parallel_universe_itineraries')
        .delete()
        .eq('id', itineraryId);

      if (error) throw error;
      
      setParallelItineraries(prev => prev.filter(itinerary => itinerary.id !== itineraryId));
    } catch (error) {
      console.error('Error deleting parallel universe itinerary:', error);
    }
  };

  const renderFlightBookingCard = (booking: typeof flightBookings[0]) => {
    return (
      <div key={booking.id} className="bg-card rounded-lg shadow-md p-6 mb-6 border border-border">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {booking.airline} Flight {booking.flight_number}
              </h3>
              <p className="text-muted-foreground text-sm">
                {booking.departure_city} → {booking.arrival_city}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.booking_status)}`}
            >
              {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
            </span>
            <div className="mt-2 text-lg font-bold">{formatPrice(booking.price)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
            <span className="text-sm">{new Date(booking.departure_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm">
              {booking.departure_time} - {booking.arrival_time}
            </span>
          </div>
          <div className="flex items-center">
            <User className="w-4 h-4 text-muted-foreground mr-2" />
            <span className="text-sm">{booking.passenger_count} passenger{booking.passenger_count > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Booked: {formatDate(booking.created_at)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteFlight(booking.id)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderHotelBookingCard = (booking: typeof hotelBookings[0]) => {
    return (
      <div key={booking.id} className="bg-card rounded-lg shadow-md p-6 mb-6 border border-border">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Building className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {booking.hotel_name}
              </h3>
              <p className="text-muted-foreground text-sm">
                {booking.hotel_address}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.booking_status)}`}
            >
              {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
            </span>
            <div className="mt-2 text-lg font-bold">{formatPrice(booking.total_price)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
            <span className="text-sm">
              {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-sm">{booking.room_type}</span>
          </div>
          <div className="flex items-center">
            <User className="w-4 h-4 text-muted-foreground mr-2" />
            <span className="text-sm">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              <div>Booked: {formatDate(booking.created_at)}</div>
              <div>{formatPrice(booking.price_per_night)}/night</div>
              {booking.rating && (
                <div className="flex items-center mt-1">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-sm">{booking.rating} stars</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteHotel(booking.id)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Combine and sort bookings by upcoming dates
  const allBookings = [
    ...flightBookings.map(booking => ({
      ...booking,
      type: 'flight' as const,
      sortDate: new Date(booking.departure_date)
    })),
    ...hotelBookings.map(booking => ({
      ...booking,
      type: 'hotel' as const,
      sortDate: new Date(booking.check_in_date)
    }))
  ].sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

  const totalBookings = flightBookings.length + hotelBookings.length;

  if (isLoading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || user?.email}!</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookings'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              My Bookings ({totalBookings})
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trips'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              Planned Trips ({tripPlans.length})
            </button>
            <button
              onClick={() => setActiveTab('parallel')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'parallel'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              Parallel Universe ({parallelItineraries.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'bookings' ? (
            totalBookings === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <Calendar className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No bookings yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start exploring and book your first trip with TravelEase.
                </p>
                <Button onClick={() => window.location.href = '/book-flight'}>
                  Start Booking
                </Button>
              </div>
            ) : (
              <div>
                {allBookings.map(booking => 
                  booking.type === 'flight' 
                    ? renderFlightBookingCard(booking)
                    : renderHotelBookingCard(booking)
                )}
              </div>
            )
          ) : activeTab === 'trips' ? (
            tripPlans.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <MapPin className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No trip plans yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start planning your next adventure with our AI-powered trip planner.
                </p>
                <Button onClick={() => window.location.href = '/plan-trip'}>
                  Plan a Trip
                </Button>
              </div>
            ) : (
              <div>
                {tripPlans.map(plan => (
                  <div key={plan.id} className="bg-card rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{plan.trip_name}</h3>
                        <p className="text-muted-foreground">{plan.destination}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTripPlan(plan.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                        <span className="text-sm">{new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}</span>
                      </div>
                      {plan.budget && (
                        <div className="flex items-center">
                          <span className="text-sm">Budget: {formatPrice(plan.budget)}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="text-sm">Created: {formatDate(plan.created_at)}</span>
                      </div>
                    </div>

                    {plan.cities && plan.cities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Cities: {plan.cities.join(', ')}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Convert plan data back to TripFormData format
                          const tripData = {
                            tripName: plan.trip_name,
                            startDate: new Date(plan.start_date),
                            endDate: new Date(plan.end_date),
                            cities: plan.cities || [plan.destination],
                            interests: plan.interests || []
                          };
                          navigate('/trip-itinerary', { state: { tripData, savedItinerary: plan.itinerary } });
                        }}
                      >
                        View Itinerary
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Parallel Universe tab
            parallelItineraries.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <Sparkles className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No parallel universe itineraries yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your alternate reality persona and generate unique travel experiences.
                </p>
                <Button onClick={() => window.location.href = '/parallel-universe'}>
                  Explore Parallel Universe
                </Button>
              </div>
            ) : (
              <div>
                {parallelItineraries.map(itinerary => (
                  <div key={itinerary.id} className="bg-card rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {itinerary.persona_image_url ? (
                            <img 
                              src={itinerary.persona_image_url} 
                              alt={itinerary.persona_name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                              <span className="text-primary font-bold text-sm">
                                {itinerary.persona_name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{itinerary.persona_name}</h3>
                          <p className="text-muted-foreground text-sm">{itinerary.destination}</p>
                          {itinerary.persona_description && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-md">{itinerary.persona_description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteParallelItinerary(itinerary.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                    
                    {(itinerary.start_date || itinerary.end_date) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {itinerary.start_date && itinerary.end_date && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                            <span className="text-sm">
                              {new Date(itinerary.start_date).toLocaleDateString()} - {new Date(itinerary.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="text-sm">Created: {formatDate(itinerary.created_at)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // You could navigate to a detailed view if needed
                          console.log('View itinerary:', itinerary);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}