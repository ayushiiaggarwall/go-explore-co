import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, Star, ExternalLink, ArrowLeft, Building2 } from 'lucide-react';
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

export default function HotelSearchResults() {
  const [searchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [tripAdvisorResults, setTripAdvisorResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Get search parameters
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
          maxItems: 10
        }
      });

      console.log('📡 TripAdvisor Response:', { data, error });

      if (error) {
        console.error('❌ TripAdvisor Function error:', error);
        return { success: false, hotels: [] };
      }

      return data || { success: false, hotels: [] };
    } catch (error) {
      console.error('❌ TripAdvisor Search error:', error);
      return { success: false, hotels: [] };
    }
  };

  useEffect(() => {
    if (!destination || !checkIn || !checkOut) {
      setError('Missing required search parameters');
      setLoading(false);
      return;
    }

    const searchData = {
      destination,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfPeople: guests ? parseInt(guests) : 2,
      rooms: rooms ? parseInt(rooms) : 1
    };

    // Search both Booking.com and TripAdvisor in parallel
    Promise.all([
      searchHotels(searchData),
      searchTripAdvisorHotels(searchData)
    ])
      .then(([bookingResults, tripAdvisorData]) => {
        setSearchResults(bookingResults);
        setTripAdvisorResults(tripAdvisorData);
        
        if (bookingResults.hotels.length === 0 && (!tripAdvisorData.hotels || tripAdvisorData.hotels.length === 0)) {
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

  const handleBookHotel = (hotel: Hotel) => {
    if (hotel.tripAdvisorUrl) {
      window.open(hotel.tripAdvisorUrl, '_blank');
    } else {
      // Create Booking.com search URL as fallback
      const params = new URLSearchParams({
        ss: searchResults?.searchParams.destination || '',
        checkin: searchResults?.searchParams.checkInDate || '',
        checkout: searchResults?.searchParams.checkOutDate || '',
        group_adults: searchResults?.searchParams.numberOfPeople?.toString() || '2',
        no_rooms: searchResults?.searchParams.rooms?.toString() || '1',
        group_children: '0'
      });
      window.open(`https://www.booking.com/searchresults.html?${params.toString()}`, '_blank');
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
      <section className="bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 text-white py-8">
        <div className="container mx-auto px-4">
          <Link 
            to="/book-hotel"
            className="inline-flex items-center gap-2 text-green-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Hotel Search
          </Link>
          
          <div className="flex items-center gap-4">
            <Building2 className="w-8 h-8 text-green-200" />
            <div>
              <h1 className="text-2xl font-bold">Hotel Search Results</h1>
              {destination && (
                <p className="text-green-100">{destination}</p>
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
              <p className="mt-4 text-muted-foreground">Searching hotels on Booking.com and TripAdvisor...</p>
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
                              Book on Booking.com
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

      {/* TripAdvisor Results */}
      {tripAdvisorResults && tripAdvisorResults.hotels && tripAdvisorResults.hotels.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* TripAdvisor Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  TripAdvisor Reviews & Ratings
                </h2>
                <p className="text-muted-foreground">
                  See what travelers are saying about hotels in {destination}
                </p>
              </div>

              {/* TripAdvisor Hotel Cards */}
              <div className="grid gap-6">
                {tripAdvisorResults.hotels.map((hotel: any, index: number) => (
                  <div key={hotel.id || index} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="md:flex">
                      {/* Hotel Image */}
                      {hotel.image && (
                        <div className="md:w-80 h-48 md:h-auto overflow-hidden">
                          <img 
                            src={hotel.image} 
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
                            
                            {/* TripAdvisor Rating */}
                            {hotel.rating > 0 && (
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex text-orange-400">
                                  {[...Array(Math.floor(hotel.rating))].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-current" />
                                  ))}
                                </div>
                                <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">
                                  {hotel.rating.toFixed(1)}
                                </span>
                                {hotel.numberOfReviews > 0 && (
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
                                {hotel.amenities.slice(0, 4).map((amenity: string, i: number) => (
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
                              onClick={() => window.open(hotel.url, '_blank')}
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