import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Plane } from 'lucide-react';
import { useSmoothNavigation } from '../hooks/useSmoothNavigation';
import { useBookings } from '../hooks/useBookings';
import { skyscannerApi, SkyscannerFlight } from '../services/skyscannerApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Slider } from '../components/ui/slider-number-flow';

export default function FlightSearchResults() {
  const [searchParams] = useSearchParams();
  const { bookFlight } = useBookings();
  const { smoothNavigate } = useSmoothNavigation();
  const [loading, setLoading] = useState(true);
  const [apiFlights, setApiFlights] = useState<SkyscannerFlight[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('');
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

  const handleBookApiLFlight = async (flight: SkyscannerFlight) => {
    // Save booking to database
    await bookFlight({
      flight_number: flight.flightNumber,
      airline: typeof flight.airline === 'string' ? flight.airline : flight.airline.name,
      departure_city: flight.departure.city || searchData.from,
      arrival_city: flight.arrival.city || searchData.destination,
      departure_date: flight.departure.date || searchData.departureDate,
      departure_time: flight.departure.time,
      arrival_time: flight.arrival.time,
      price: flight.price,
      passenger_count: searchData.passengers
    });
    
    // Redirect to Skyscanner
    if (flight.bookingUrl) {
      window.open(flight.bookingUrl, '_blank');
    }
  };

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      setApiError(null);
      
      try {
        console.log('🛫 Flight Search Parameters:', searchData);
        
        // Fetch from Flight API (Google Flights/Free Scraper)
        const apiResults = await skyscannerApi.searchFlights(
          searchData.from, 
          searchData.destination, 
          searchData.departureDate, 
          searchData.returnDate
        );
        
        if (apiResults && apiResults.flights && apiResults.flights.length > 0) {
          console.log('✅ Flight API returned flights:', apiResults.flights.length);
          setApiFlights(apiResults.flights);
          setDataSource(apiResults.source || 'google-flights');
        } else {
          console.log('⚠️ No flights from Flight API');
          setApiError('No flights found for this route and date.');
        }
      } catch (error) {
        console.error('❌ Flight API error:', error);
        setApiError('Unable to fetch live flight data.');
      }
      
      setLoading(false);
    };

    fetchFlights();
  }, [searchData.from, searchData.destination, searchData.departureDate, searchData.returnDate, searchData.passengers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <LoadingSpinner size="lg" />
            <h2 className="text-2xl font-bold text-foreground mt-6 mb-2">Searching for flights...</h2>
            <p className="text-muted-foreground">
              Finding the best deals from {searchData.from} to {searchData.destination}
            </p>
            <div className="mt-8 max-w-md mx-auto bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Route</span>
                <span>{searchData.from} → {searchData.destination}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Date</span>
                <span>{searchData.departureDate}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Passengers</span>
                <span>{searchData.passengers}</span>
              </div>
            </div>
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
                {apiFlights.length} flight{apiFlights.length !== 1 ? 's' : ''} found
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
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <h3 className="text-lg font-semibold text-foreground">Live Flight Results</h3>
                    <span className="text-sm text-muted-foreground">({apiFlights.length} found)</span>
                    {dataSource && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {dataSource === 'google-flights' ? 'Google Flights' : 'Free Scraper'}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-4">
                    {apiFlights.slice(0, 5).map((flight, index) => (
                      <div key={index} className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-all duration-200">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            {typeof flight.airline === 'object' && flight.airline.logo ? (
                              <img 
                                src={flight.airline.logo} 
                                alt={flight.airline.name}
                                className="w-10 h-10 rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-10 h-10 bg-primary/10 rounded flex items-center justify-center ${typeof flight.airline === 'object' && flight.airline.logo ? 'hidden' : ''}`}>
                              <Plane className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-lg text-foreground">
                                {typeof flight.airline === 'string' ? flight.airline : flight.airline.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Flight {flight.flightNumber}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">${flight.price}</div>
                            <div className="text-sm text-muted-foreground">{flight.currency} per person</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-foreground">{flight.departure.time}</div>
                            <div className="text-sm text-muted-foreground">{flight.departure.airport}</div>
                            <div className="text-xs text-muted-foreground">{flight.departure.city}</div>
                          </div>
                          
                          <div className="flex-1 px-4">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="flex-1 h-px bg-border"></div>
                              <div className="flex items-center space-x-1 bg-muted px-2 py-1 rounded-full">
                                <span className="text-xs text-muted-foreground">{flight.duration}</span>
                              </div>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>
                            <div className="text-center text-xs text-muted-foreground mt-1">
                              {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-lg font-semibold text-foreground">{flight.arrival.time}</div>
                            <div className="text-sm text-muted-foreground">{flight.arrival.airport}</div>
                            <div className="text-xs text-muted-foreground">{flight.arrival.city}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={() => handleBookApiLFlight(flight)}
                            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-colors"
                          >
                            Book on Skyscanner
                          </button>
                          <p className="text-xs text-muted-foreground text-center">
                            Prices for comparison - book on Skyscanner for best rates
                          </p>
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


              {apiFlights.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                    <Plane className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No flights found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    We couldn't find any flights for your search criteria. Try adjusting your dates or destinations.
                  </p>
                  {apiError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 max-w-md mx-auto">
                      <p className="text-destructive text-sm">{apiError}</p>
                    </div>
                  )}
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => smoothNavigate('/book-flight')}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      Try New Search
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                    >
                      Refresh Results
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}