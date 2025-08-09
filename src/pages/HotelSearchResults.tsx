import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Star, Wifi, Users, Calendar, ArrowLeft } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface CleanHotel {
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
  ratingText: string;
  reviewCount: number;
  location: {
    address: string;
    neighborhood: string;
    distanceFromCenter: string;
  };
  images: string[];
  amenities: string[];
  tripAdvisorUrl: string;
  rankingPosition: string;
  awards: any[];
  description: string;
  hotelClass: number;
  searchParams: any;
}

interface SearchResults {
  success: boolean;
  hotels: CleanHotel[];
  searchParams: {
    destination: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfPeople: number;
    rooms: number;
    nights: number;
  };
  totalResults: number;
  error?: string;
}

export default function HotelSearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const destination = searchParams.get('destination');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guests = parseInt(searchParams.get('guests') || '2');
    const rooms = parseInt(searchParams.get('rooms') || '1');

    if (!destination || !checkIn || !checkOut) {
      setError('Missing search parameters');
      setLoading(false);
      return;
    }

    searchHotels({
      destination,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfPeople: guests,
      rooms
    });
  }, [location.search]);

  const searchHotels = async (params: any) => {
    setLoading(true);
    setError('');
    setSearchResults(null);

    try {
      console.log('🔍 Searching hotels with params:', params);
      
      const { data, error: functionError } = await supabase.functions.invoke('search-hotels', {
        body: params
      });

      if (functionError) {
        console.error('❌ Function error:', functionError);
        throw new Error(functionError.message || 'Failed to search hotels');
      }

      if (data.success) {
        console.log('✅ Search successful:', data);
        setSearchResults(data);
      } else {
        setError(data.error || 'Failed to search hotels');
      }
    } catch (err: any) {
      console.error('❌ Search error:', err);
      setError(err.message || 'Network error - please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleBookHotel = (hotel: CleanHotel) => {
    if (hotel.tripAdvisorUrl) {
      window.open(hotel.tripAdvisorUrl, '_blank');
    } else {
      // Create fallback TripAdvisor search URL
      const params = new URLSearchParams({
        q: `${hotel.name} ${searchResults?.searchParams.destination || ''}`,
        checkin: searchResults?.searchParams.checkInDate || '',
        checkout: searchResults?.searchParams.checkOutDate || '',
        adults: String(searchResults?.searchParams.numberOfPeople || 2)
      });
      
      window.open(`https://www.tripadvisor.com/Hotels?${params.toString()}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Searching Hotels on TripAdvisor</h2>
            <p className="text-muted-foreground">Finding the best hotels for your stay...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/book-hotel')}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </button>
          
          <div className="text-center py-16">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-destructive mb-2">Search Failed</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => navigate('/book-hotel')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!searchResults || !searchResults.hotels || searchResults.hotels.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/book-hotel')}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </button>
          
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Hotels Found</h2>
            <p className="text-muted-foreground mb-4">
              No hotels found for your search criteria. Try adjusting your dates or destination.
            </p>
            <button
              onClick={() => navigate('/book-hotel')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Search Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { hotels, searchParams, totalResults } = searchResults;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/book-hotel')}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </button>
          
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Hotels in {searchParams.destination}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(searchParams.checkInDate).toLocaleDateString()} - {new Date(searchParams.checkOutDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {searchParams.numberOfPeople} guest{searchParams.numberOfPeople > 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {searchParams.rooms} room{searchParams.rooms > 1 ? 's' : ''}
              </div>
            </div>
            
            <p className="text-sm text-primary mt-2">
              Found {totalResults} hotels • {searchParams.nights} night{searchParams.nights > 1 ? 's' : ''} • Powered by TripAdvisor
            </p>
          </div>
        </div>

        {/* Hotels Grid */}
        <div className="grid gap-6">
          {hotels.map((hotel, index) => (
            <div key={hotel.id || index} className="bg-card rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              <div className="md:flex">
                {/* Hotel Image */}
                {hotel.images.length > 0 && (
                  <div className="md:w-64 h-48 md:h-auto">
                    <img 
                      src={hotel.images[0]} 
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-hotel.jpg';
                      }}
                    />
                  </div>
                )}

                <div className="flex-1 p-6">
                  {/* Hotel Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-1">{hotel.name}</h3>
                      
                      {/* Star Rating */}
                      {hotel.hotelClass > 0 && (
                        <div className="text-yellow-500 mb-2">
                          {[...Array(hotel.hotelClass)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 inline-block fill-current" />
                          ))}
                        </div>
                      )}
                      
                      {/* Guest Rating */}
                      <div className="flex items-center gap-2">
                        {hotel.rating > 0 && (
                          <>
                            <span className="bg-green-600 text-white px-2 py-1 rounded text-sm font-semibold">
                              {hotel.rating.toFixed(1)}
                            </span>
                            <span className="text-sm text-muted-foreground">{hotel.ratingText}</span>
                          </>
                        )}
                        {hotel.reviewCount > 0 && (
                          <span className="text-sm text-muted-foreground">
                            ({hotel.reviewCount.toLocaleString()} reviews)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{hotel.price.formatted}</div>
                      <div className="text-sm text-muted-foreground">per night</div>
                      {searchParams.nights > 1 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Total: {hotel.price.totalFormatted} for {searchParams.nights} nights
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {hotel.location.address && (
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-foreground">{hotel.location.address}</p>
                        {hotel.location.distanceFromCenter && (
                          <p className="text-xs text-muted-foreground">{hotel.location.distanceFromCenter}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {hotel.amenities.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {hotel.amenities.slice(0, 6).map((amenity, amenityIndex) => (
                          <span key={amenityIndex} className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            {amenity.toLowerCase().includes('wifi') && <Wifi className="w-3 h-3" />}
                            {amenity}
                          </span>
                        ))}
                        {hotel.amenities.length > 6 && (
                          <span className="text-xs text-muted-foreground">
                            +{hotel.amenities.length - 6} more amenities
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {hotel.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{hotel.description}</p>
                  )}

                  {/* Booking Button */}
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleBookHotel(hotel)}
                      className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium"
                    >
                      View on TripAdvisor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Powered by TripAdvisor */}
        <div className="text-center mt-8 py-4 border-t">
          <p className="text-sm text-muted-foreground">
            Hotel data powered by <span className="font-semibold text-foreground">TripAdvisor</span>
          </p>
        </div>
      </div>
    </div>
  );
}