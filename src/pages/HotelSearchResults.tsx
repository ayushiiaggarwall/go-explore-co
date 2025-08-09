import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useSmoothNavigation } from '../hooks/useSmoothNavigation';
import { mockHotels } from '../services/mockData';
import { tripAdvisorApi, TripAdvisorHotel } from '../services/tripAdvisorApi';
import { Hotel } from '../types';
import HotelCard from '../components/cards/HotelCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Slider } from '../components/ui/slider-number-flow';

export default function HotelSearchResults() {
  const [searchParams] = useSearchParams();
  const { smoothNavigate } = useSmoothNavigation();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [apiHotels, setApiHotels] = useState<TripAdvisorHotel[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [showFilters, setShowFilters] = useState(false);

  const searchData = {
    destination: searchParams.get('destination') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('guests') || '2'),
    rooms: parseInt(searchParams.get('rooms') || '1')
  };

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      setApiError(null);
      
      try {
        console.log('🏨 Hotel Search Parameters:', searchData);
        
        // Fetch from TripAdvisor API
        const apiResults = await tripAdvisorApi.searchHotels(searchData.destination, 20);
        
        if (apiResults && apiResults.length > 0) {
          console.log('✅ TripAdvisor API returned hotels:', apiResults.length);
          setApiHotels(apiResults);
        } else {
          console.log('⚠️ No hotels from TripAdvisor API, using mock data');
        }
      } catch (error) {
        console.error('❌ TripAdvisor API error:', error);
        setApiError('Unable to fetch live hotel data. Showing sample results.');
      }
      
      // Always load mock data as fallback
      setHotels(mockHotels);
      setLoading(false);
    };

    fetchHotels();
  }, [searchData.destination, searchData.checkIn, searchData.checkOut, searchData.guests, searchData.rooms]);

  useEffect(() => {
    const filtered = hotels.filter(hotel => 
      hotel.pricePerNight >= priceRange[0] && hotel.pricePerNight <= priceRange[1]
    );
    setFilteredHotels(filtered);
  }, [hotels, priceRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Hotel Search Results</h1>
          <p className="text-muted-foreground">
            {searchData.destination} • {searchData.checkIn} → {searchData.checkOut} • {searchData.guests} guest{searchData.guests > 1 ? 's' : ''} • {searchData.rooms} room{searchData.rooms > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-1/4`}>
            <div className="bg-card rounded-lg p-6 border border-border sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Price Range: ${priceRange[0]} - ${priceRange[1]} per night
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={500}
                    min={0}
                    step={25}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {filteredHotels.length} hotel{filteredHotels.length !== 1 ? 's' : ''} found
              </p>
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>

            <div className="space-y-4">
              {/* API Results Section */}
              {apiHotels.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="text-lg font-semibold text-foreground">Live Hotel Results</h3>
                    <span className="text-sm text-muted-foreground">({apiHotels.length} found)</span>
                  </div>
                  <div className="grid gap-4">
                    {apiHotels.slice(0, 5).map((hotel, index) => (
                      <div key={index} className="bg-card rounded-lg border border-green-200 p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-1">{hotel.name}</h4>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={`text-sm ${i < (hotel.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {hotel.rating || 0}/5 ({hotel.numberOfReviews || 0} reviews)
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{hotel.location}</p>
                            {hotel.amenities && hotel.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {hotel.amenities.slice(0, 3).map((amenity, i) => (
                                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    {amenity}
                                  </span>
                                ))}
                                {hotel.amenities.length > 3 && (
                                  <span className="text-xs text-muted-foreground">+{hotel.amenities.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {hotel.priceFrom ? `$${hotel.priceFrom}` : 'Price on request'}
                              {hotel.priceFrom && <span className="text-sm font-normal text-muted-foreground">/night</span>}
                            </div>
                            {hotel.url && (
                              <a
                                href={hotel.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                              >
                                View Details
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {apiError && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-yellow-800 text-sm">{apiError}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Fallback/Sample Results */}
              {filteredHotels.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Sample Results</h3>
                    <span className="text-sm text-muted-foreground">({filteredHotels.length} sample hotels)</span>
                  </div>
                  {filteredHotels.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} onBook={() => smoothNavigate('/booking-details')} />
                  ))}
                </div>
              )}

              {filteredHotels.length === 0 && apiHotels.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-4">No hotels found matching your criteria</p>
                  <button
                    onClick={() => smoothNavigate('/book-hotel')}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Try New Search
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}