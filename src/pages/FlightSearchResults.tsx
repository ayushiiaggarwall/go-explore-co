import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useSmoothNavigation } from '../hooks/useSmoothNavigation';
import { mockFlights } from '../services/mockData';
import { skyscannerApi, SkyscannerFlight } from '../services/skyscannerApi';
import { Flight } from '../types';
import FlightCard from '../components/cards/FlightCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Slider } from '../components/ui/slider-number-flow';

export default function FlightSearchResults() {
  const [searchParams] = useSearchParams();
  const { smoothNavigate } = useSmoothNavigation();
  const [loading, setLoading] = useState(true);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [apiFlights, setApiFlights] = useState<SkyscannerFlight[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
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
      setApiError(null);
      
      try {
        console.log('🛫 Flight Search Parameters:', searchData);
        
        // Fetch from Skyscanner API
        const apiResults = await skyscannerApi.searchFlights(
          searchData.from, 
          searchData.destination, 
          searchData.departureDate, 
          searchData.returnDate
        );
        
        if (apiResults && apiResults.length > 0) {
          console.log('✅ Skyscanner API returned flights:', apiResults.length);
          setApiFlights(apiResults);
        } else {
          console.log('⚠️ No flights from Skyscanner API, using mock data');
        }
      } catch (error) {
        console.error('❌ Skyscanner API error:', error);
        setApiError('Unable to fetch live flight data. Showing sample results.');
      }
      
      // Always load mock data as fallback
      setFlights(mockFlights);
      setLoading(false);
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
              {/* API Results Section */}
              {apiFlights.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="text-lg font-semibold text-foreground">Live Flight Results</h3>
                    <span className="text-sm text-muted-foreground">({apiFlights.length} found)</span>
                  </div>
                  <div className="grid gap-4">
                    {apiFlights.slice(0, 5).map((flight, index) => (
                      <div key={index} className="bg-card rounded-lg border border-green-200 p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <span className="font-semibold text-lg">{flight.airline}</span>
                              <span className="text-sm text-muted-foreground">{flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <div className="font-medium">{flight.departure.time}</div>
                                <div className="text-muted-foreground">{flight.departure.airport}</div>
                              </div>
                              <div className="text-muted-foreground">→</div>
                              <div>
                                <div className="font-medium">{flight.arrival.time}</div>
                                <div className="text-muted-foreground">{flight.arrival.airport}</div>
                              </div>
                              <div className="text-muted-foreground">({flight.duration})</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">{flight.currency} {flight.price}</div>
                            {flight.bookingUrl && (
                              <a
                                href={flight.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                              >
                                Book Now
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
              {filteredFlights.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Sample Results</h3>
                    <span className="text-sm text-muted-foreground">({filteredFlights.length} sample flights)</span>
                  </div>
                  {filteredFlights.map((flight) => (
                    <FlightCard key={flight.id} flight={flight} onBook={() => smoothNavigate('/booking-details')} />
                  ))}
                </div>
              )}

              {filteredFlights.length === 0 && apiFlights.length === 0 && (
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