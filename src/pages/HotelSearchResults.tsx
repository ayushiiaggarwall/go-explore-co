import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useSmoothNavigation } from '../hooks/useSmoothNavigation';
import { mockHotels } from '../services/mockData';
import { Hotel } from '../types';
import HotelCard from '../components/cards/HotelCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Slider } from '../components/ui/slider-number-flow';

export default function HotelSearchResults() {
  const [searchParams] = useSearchParams();
  const { smoothNavigate } = useSmoothNavigation();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<Hotel[]>([]);
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
      try {
        // Use mock data for now
        setHotels(mockHotels);
      } catch (error) {
        console.error('Error fetching hotels:', error);
        setHotels(mockHotels);
      } finally {
        setLoading(false);
      }
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
              {filteredHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} onBook={() => smoothNavigate('/booking-details')} />
              ))}

              {filteredHotels.length === 0 && (
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