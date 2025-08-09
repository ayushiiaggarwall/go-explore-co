import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, MapPin, Star, Wifi, ExternalLink } from 'lucide-react';
import HotelSearchPanel from '../components/sections/HotelSearchPanel';
import { supabase } from '../integrations/supabase/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface Hotel {
  id: string;
  name: string;
  price: {
    amount: number;
    currency: string;
    formatted: string;
    total: number;
    totalFormatted: string;
    priceRange: string;
  };
  rating: number;
  reviewCount: number;
  location: {
    address: string;
    neighborhood: string;
    distanceFromCenter: string;
  };
  images: string[];
  amenities: string[];
  tripAdvisorUrl: string;
  description: string;
  hotelClass: number;
}

interface SearchResults {
  success: boolean;
  hotels: Hotel[];
  searchParams: {
    destination: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfPeople: number;
    rooms: number;
    nights: number;
  };
  totalResults: number;
}

export default function HotelBooking() {
  const [searchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Check if we have search parameters
  const destination = searchParams.get('destination');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests');
  const rooms = searchParams.get('rooms');

  const searchHotels = async (searchData: any) => {
    try {
      console.log('🔍 Searching hotels with params:', searchData);

      const { data, error } = await supabase.functions.invoke('search-hotels', {
        body: {
          destination: searchData.destination,
          checkInDate: searchData.checkInDate,
          checkOutDate: searchData.checkOutDate,
          numberOfPeople: searchData.numberOfPeople || 2,
          rooms: searchData.rooms || 1
        }
      });

      console.log('📡 Response:', { data, error });

      if (error) {
        console.error('❌ Function error:', error);
        throw new Error(error.message || 'Failed to search hotels');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Hotel search failed');
      }

      return data;
    } catch (error) {
      console.error('❌ Search error:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (destination && checkIn && checkOut) {
      setLoading(true);
      setError('');
      
      const searchData = {
        destination,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfPeople: guests ? parseInt(guests) : 2,
        rooms: rooms ? parseInt(rooms) : 1
      };

      searchHotels(searchData)
        .then((results) => {
          setSearchResults(results);
          if (results.hotels.length === 0) {
            setError('No hotels found. Try a different destination or dates.');
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to search hotels. Please try again.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [destination, checkIn, checkOut, guests, rooms]);

  const handleBookHotel = (hotel: Hotel) => {
    if (hotel.tripAdvisorUrl) {
      window.open(hotel.tripAdvisorUrl, '_blank');
    } else {
      // Create TripAdvisor search URL as fallback
      const params = new URLSearchParams({
        q: `${hotel.name} ${searchResults?.searchParams.destination || ''}`,
        checkin: searchResults?.searchParams.checkInDate || '',
        checkout: searchResults?.searchParams.checkOutDate || '',
        adults: searchResults?.searchParams.numberOfPeople?.toString() || '2'
      });
      window.open(`https://www.tripadvisor.com/Hotels?${params.toString()}`, '_blank');
    }
  };

  const getRatingText = (rating: number): string => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    if (rating >= 2.0) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-green-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Book Your Hotel</h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              Discover amazing accommodations for your stay. From luxury resorts to budget-friendly options.
            </p>
          </div>
        </div>
      </section>

      {/* Search Panel */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <HotelSearchPanel />
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

      {/* Search Results */}
      {searchResults && searchResults.hotels.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Results Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Hotels in {searchResults.searchParams.destination}
                </h2>
                <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
                  <span>{searchResults.searchParams.checkInDate} to {searchResults.searchParams.checkOutDate}</span>
                  <span>•</span>
                  <span>{searchResults.searchParams.numberOfPeople} guest{searchResults.searchParams.numberOfPeople > 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{searchResults.searchParams.rooms} room{searchResults.searchParams.rooms > 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {searchResults.totalResults} hotels found
                  </span>
                </div>
              </div>

              {/* Hotel Cards */}
              <div className="grid gap-6">
                {searchResults.hotels.map((hotel, index) => (
                  <div key={hotel.id || index} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="md:flex">
                      {/* Hotel Image */}
                      {hotel.images.length > 0 && (
                        <div className="md:w-80 h-48 md:h-auto overflow-hidden">
                          <img 
                            src={hotel.images[0]} 
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Hotel Content */}
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          {/* Hotel Header */}
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground mb-2">{hotel.name}</h3>
                            
                            {/* Star Rating */}
                            {hotel.hotelClass > 0 && (
                              <div className="flex text-yellow-400 mb-2">
                                {[...Array(hotel.hotelClass)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-current" />
                                ))}
                              </div>
                            )}
                            
                            {/* Guest Rating */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-green-600 text-white px-2 py-1 rounded text-sm font-medium">
                                {hotel.rating.toFixed(1)}
                              </span>
                              <span className="text-sm text-muted-foreground">{getRatingText(hotel.rating)}</span>
                              {hotel.reviewCount > 0 && (
                                <span className="text-sm text-muted-foreground">
                                  ({hotel.reviewCount.toLocaleString()} reviews)
                                </span>
                              )}
                            </div>

                            {/* Location */}
                            {hotel.location.address && (
                              <div className="flex items-center text-sm text-muted-foreground mb-3">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>{hotel.location.address}</span>
                                {hotel.location.distanceFromCenter && (
                                  <span className="ml-2 text-xs">• {hotel.location.distanceFromCenter}</span>
                                )}
                              </div>
                            )}

                            {/* Amenities */}
                            {hotel.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {hotel.amenities.slice(0, 5).map((amenity, i) => (
                                  <span key={i} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                    {amenity}
                                  </span>
                                ))}
                                {hotel.amenities.length > 5 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{hotel.amenities.length - 5} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Price and Booking */}
                          <div className="text-right ml-6">
                            <div className="mb-4">
                              <div className="text-2xl font-bold text-green-600">
                                {hotel.price.formatted}
                              </div>
                              <div className="text-sm text-muted-foreground">per night</div>
                              {searchResults.searchParams.nights > 1 && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  Total: {hotel.price.totalFormatted} for {searchResults.searchParams.nights} nights
                                </div>
                              )}
                            </div>
                            
                            <button 
                              onClick={() => handleBookHotel(hotel)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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

      {/* Features Section - Only show if no search results */}
      {!searchResults && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">Hotel Booking Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Prime Locations</h3>
                <p className="text-muted-foreground">Hotels in the best locations, close to attractions and transportation.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Quality Guarantee</h3>
                <p className="text-muted-foreground">All hotels are carefully selected and reviewed for quality and service.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Modern Amenities</h3>
                <p className="text-muted-foreground">Free WiFi, breakfast, and other amenities to make your stay comfortable.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}