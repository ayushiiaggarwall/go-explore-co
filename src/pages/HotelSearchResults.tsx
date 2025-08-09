import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, Star, ExternalLink, ArrowLeft, Building2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useBookings } from '../hooks/useBookings';
import { toast } from 'sonner';

interface TripAdvisorHotel {
  id: string;
  name: string;
  rating?: number;
  numberOfReviews?: number;
  priceFrom?: number;
  location?: string;
  image?: string;
  amenities?: string[];
  url?: string;
  description?: string;
  address?: string;
  distance?: string;
}

interface TripAdvisorResults {
  success: boolean;
  hotels: TripAdvisorHotel[];
  searchParams: {
    destination: string;
    checkInDate?: string;
    checkOutDate?: string;
    numberOfPeople?: number;
    rooms?: number;
  };
  totalResults: number;
  source: string;
}

export default function HotelSearchResults() {
  const [searchParams] = useSearchParams();
  const [tripAdvisorResults, setTripAdvisorResults] = useState<TripAdvisorResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const searchExecutedRef = useRef(false);
  const { bookHotel } = useBookings();

  // Get search parameters
  const destination = searchParams.get('destination');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests');
  const rooms = searchParams.get('rooms');

  const searchTripAdvisorHotels = async (searchData: any) => {
    try {
      console.log('🔍 Searching TripAdvisor hotels with params:', searchData);

      const { data, error } = await supabase.functions.invoke('search-tripadvisor', {
        body: {
          destination: searchData.destination,
          checkInDate: searchData.checkInDate,
          checkOutDate: searchData.checkOutDate,
          numberOfPeople: searchData.numberOfPeople || 2,
          rooms: searchData.rooms || 1,
          maxItems: 15
        }
      });

      console.log('📡 TripAdvisor Response:', { data, error });

      if (error) {
        console.error('❌ TripAdvisor Function error:', error);
        throw new Error(error.message || 'Failed to search TripAdvisor hotels');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'TripAdvisor hotel search failed');
      }

      return data;
    } catch (error) {
      console.error('❌ TripAdvisor Search error:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!destination || !checkIn || !checkOut || searchExecutedRef.current) {
      if (!destination || !checkIn || !checkOut) {
        setError('Missing required search parameters');
        setLoading(false);
      }
      return;
    }

    searchExecutedRef.current = true;

    const searchData = {
      destination,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfPeople: guests ? parseInt(guests) : 2,
      rooms: rooms ? parseInt(rooms) : 1
    };

    // Search only TripAdvisor
    searchTripAdvisorHotels(searchData)
      .then((tripAdvisorData) => {
        setTripAdvisorResults(tripAdvisorData);
        
        if (!tripAdvisorData.hotels || tripAdvisorData.hotels.length === 0) {
          setError('No hotels found. Try a different destination or dates.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to search hotels. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [destination, checkIn, checkOut, guests, rooms]);

  const getRatingText = (rating: number): string => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    if (rating >= 2.0) return 'Fair';
    return 'Poor';
  };

  if (!destination || !checkIn || !checkOut) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Invalid Search Parameters</h1>
            <p className="text-muted-foreground mb-8">
              Please provide a destination, check-in date, and check-out date to search for hotels.
            </p>
            <Link 
              to="/book-hotel"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Hotel Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-orange-600 via-orange-700 to-red-600 text-white py-8">
        <div className="container mx-auto px-4">
          <Link 
            to="/book-hotel"
            className="inline-flex items-center gap-2 text-orange-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Hotel Search
          </Link>
          
          <div className="flex items-center gap-4">
            <Building2 className="w-8 h-8 text-orange-200" />
            <div>
              <h1 className="text-2xl font-bold">TripAdvisor Hotel Results</h1>
              {destination && (
                <p className="text-orange-100">{destination}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {loading && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <LoadingSpinner />
              <p className="mt-4 text-muted-foreground">Searching hotels on TripAdvisor...</p>
            </div>
          </div>
        </section>
      )}

      {/* TripAdvisor Results */}
      {tripAdvisorResults && tripAdvisorResults.hotels && tripAdvisorResults.hotels.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Results Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Hotels in {tripAdvisorResults.searchParams.destination}
                </h2>
                <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
                  {tripAdvisorResults.searchParams.checkInDate && tripAdvisorResults.searchParams.checkOutDate && (
                    <>
                      <span>{tripAdvisorResults.searchParams.checkInDate} to {tripAdvisorResults.searchParams.checkOutDate}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{tripAdvisorResults.searchParams.numberOfPeople || 2} guest{(tripAdvisorResults.searchParams.numberOfPeople || 2) > 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{tripAdvisorResults.searchParams.rooms || 1} room{(tripAdvisorResults.searchParams.rooms || 1) > 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span className="text-orange-600 dark:text-orange-400">
                    {tripAdvisorResults.totalResults} hotels found on TripAdvisor
                  </span>
                </div>
              </div>

              {/* Hotel Cards */}
              <div className="grid gap-6">
                {tripAdvisorResults.hotels.map((hotel, index) => (
                  <div key={hotel.id || index} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="md:flex">
                      {/* Hotel Image */}
                      {hotel.image && (
                        <div className="md:w-80 h-48 md:h-auto overflow-hidden">
                          <img 
                            src={hotel.image} 
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Hotel Content */}
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          {/* Hotel Header */}
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground mb-2">{hotel.name}</h3>
                            
                            {/* TripAdvisor Rating */}
                            {hotel.rating && hotel.rating > 0 && (
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex text-orange-400">
                                  {[...Array(Math.floor(hotel.rating))].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-current" />
                                  ))}
                                </div>
                                <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">
                                  {hotel.rating.toFixed(1)}
                                </span>
                                <span className="text-sm text-muted-foreground">{getRatingText(hotel.rating)}</span>
                                {hotel.numberOfReviews && hotel.numberOfReviews > 0 && (
                                  <span className="text-sm text-muted-foreground">
                                    ({hotel.numberOfReviews.toLocaleString()} TripAdvisor reviews)
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Location */}
                            {hotel.location && (
                              <div className="flex items-center text-sm text-muted-foreground mb-3">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>{hotel.location}</span>
                              </div>
                            )}

                            {/* Description */}
                            {hotel.description && (
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {hotel.description}
                              </p>
                            )}

                            {/* Amenities */}
                            {hotel.amenities && hotel.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {hotel.amenities.slice(0, 4).map((amenity, i) => (
                                  <span key={i} className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                                    {amenity}
                                  </span>
                                ))}
                                {hotel.amenities.length > 4 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{hotel.amenities.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Price and View on TripAdvisor */}
                          <div className="text-right ml-6">
                            {hotel.priceFrom && (
                              <div className="mb-4">
                                <div className="text-lg font-bold text-orange-600">
                                  From ${hotel.priceFrom}
                                </div>
                                <div className="text-sm text-muted-foreground">per night</div>
                              </div>
                            )}
                            
                            <button 
                              onClick={async () => {
                                try {
                                  // Calculate booking details
                                  const checkInDate = checkIn || new Date().toISOString().split('T')[0];
                                  const checkOutDate = checkOut || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                  const guestCount = guests ? parseInt(guests) : 2;
                                  const nights = Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
                                  const pricePerNight = hotel.priceFrom || 100;
                                  const totalPrice = pricePerNight * nights;
                                  
                                  const success = await bookHotel({
                                    hotel_name: hotel.name,
                                    hotel_address: hotel.address || hotel.location || 'N/A',
                                    city: hotel.location?.split(',')[0] || destination || 'N/A',
                                    check_in_date: checkInDate,
                                    check_out_date: checkOutDate,
                                    room_type: 'Standard Room',
                                    price_per_night: pricePerNight,
                                    total_price: totalPrice,
                                    guest_count: guestCount,
                                    rating: hotel.rating || null
                                  });

                                  if (success) {
                                    toast.success('Hotel saved to your bookings!');
                                    // Open TripAdvisor
                                    if (hotel.url) {
                                      window.open(hotel.url, '_blank');
                                    }
                                  } else {
                                    toast.error('Failed to save booking. Please try again.');
                                  }
                                } catch (error) {
                                  console.error('Booking error:', error);
                                  toast.error('Failed to save booking. Please try again.');
                                }
                              }}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                              View on TripAdvisor
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}