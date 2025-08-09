import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useSmoothNavigation } from '../hooks/useSmoothNavigation';
import { mockFlights } from '../services/mockData';
import { Flight } from '../types';
import FlightCard from '../components/cards/FlightCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Slider } from '../components/ui/slider-number-flow';

export default function FlightSearchResults() {
  const [searchParams] = useSearchParams();
  const { smoothNavigate } = useSmoothNavigation();
  const [loading, setLoading] = useState(true);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [showFilters, setShowFilters] = useState(false);

  const searchData = {
    from: searchParams.get('from') || '',
    destination: searchParams.get('destination') || '',
    departureDate: searchParams.get('departureDate') || '',
    returnDate: searchParams.get('returnDate') || '',
    passengers: parseInt(searchParams.get('passengers') || '1'),
    tripType: searchParams.get('tripType') || 'round-trip'
  };

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      try {
        // Use mock data for now
        setFlights(mockFlights);
      } catch (error) {
        console.error('Error fetching flights:', error);
        setFlights(mockFlights);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [searchData.from, searchData.destination, searchData.departureDate, searchData.returnDate, searchData.passengers]);

  useEffect(() => {
    const filtered = flights.filter(flight => 
      flight.price >= priceRange[0] && flight.price <= priceRange[1]
    );
    setFilteredFlights(filtered);
  }, [flights, priceRange]);

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Flight Search Results</h1>
          <p className="text-muted-foreground">
            {searchData.from} → {searchData.destination} • {searchData.departureDate}
            {searchData.returnDate && ` → ${searchData.returnDate}`} • {searchData.passengers} passenger{searchData.passengers > 1 ? 's' : ''}
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
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={2000}
                    min={0}
                    step={50}
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
                {filteredFlights.length} flight{filteredFlights.length !== 1 ? 's' : ''} found
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
              {filteredFlights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} onBook={() => smoothNavigate('/booking-details')} />
              ))}

              {filteredFlights.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-4">No flights found matching your criteria</p>
                  <button
                    onClick={() => smoothNavigate('/book-flight')}
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