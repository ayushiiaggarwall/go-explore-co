import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Plane, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [flightsPerPage] = useState(5);
  
  // Filter states
  const [departureTimeFilter, setDepartureTimeFilter] = useState<string[]>([]);
  const [arrivalTimeFilter, setArrivalTimeFilter] = useState<string[]>([]);
  const [stopsFilter, setStopsFilter] = useState<string[]>([]);

  const searchData = {
    from: searchParams.get('from') || '',
    destination: searchParams.get('destination') || '',
    departureDate: searchParams.get('departureDate') || '',
    returnDate: searchParams.get('returnDate') || '',
    passengers: parseInt(searchParams.get('passengers') || '1'),
    tripType: searchParams.get('tripType') || 'round-trip'
  };

  // Time cleaning utility function
  const cleanTimeFormat = (timeString: string): string => {
    if (!timeString) return '00:00';
    
    try {
      // Handle corrupted time like "19:23.04206639745962" or "22:3.606127428290847"
      const corruptedTimeMatch = timeString.match(/^(\d{1,2}):(\d{1,2})[\.\d]*$/);
      if (corruptedTimeMatch) {
        const [, hours, minutes] = corruptedTimeMatch;
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }
      
      // If it's already in HH:MM format
      if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        const [hours, minutes] = timeString.split(':');
        return `${hours.padStart(2, '0')}:${minutes}`;
      }
      
      // Handle simple time with extra decimals - extract only hours and minutes
      const timeMatch = timeString.match(/^(\d{1,2})[:.](\d{1,2})/);
      if (timeMatch) {
        const [, hours, minutes] = timeMatch;
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }
      
      return timeString; // Return as-is if no issues found
    } catch (error) {
      console.warn('Error cleaning time:', timeString, error);
      return '00:00';
    }
  };

  // Helper function to get time period
  const getTimePeriod = (timeString: string): string => {
    const cleanedTime = cleanTimeFormat(timeString);
    const [hours] = cleanedTime.split(':').map(Number);
    
    if (hours < 6) return 'before-6am';
    if (hours < 12) return '6am-12pm';
    if (hours < 18) return '12pm-6pm';
    return '6pm-12am';
  };

  // Filter flights based on selected filters
  const getFilteredFlights = () => {
    return apiFlights.filter(flight => {
      // Price filter
      const priceInRange = flight.price >= priceRange[0] && flight.price <= priceRange[1];
      
      // Departure time filter
      const departureTimeMatch = departureTimeFilter.length === 0 || 
        departureTimeFilter.includes(getTimePeriod(flight.departure.time));
      
      // Arrival time filter
      const arrivalTimeMatch = arrivalTimeFilter.length === 0 || 
        arrivalTimeFilter.includes(getTimePeriod(flight.arrival.time));
      
      // Stops filter
      const stopsMatch = stopsFilter.length === 0 || 
        stopsFilter.some(filter => {
          if (filter === 'non-stop') return flight.stops === 0;
          if (filter === '1-stop') return flight.stops === 1;
          if (filter === '2-plus-stops') return flight.stops >= 2;
          return false;
        });
      
      return priceInRange && departureTimeMatch && arrivalTimeMatch && stopsMatch;
    });
  };

  // Handle filter changes
  const handleTimeFilterChange = (timeFilter: string, filterType: 'departure' | 'arrival', checked: boolean) => {
    const setFilter = filterType === 'departure' ? setDepartureTimeFilter : setArrivalTimeFilter;
    const currentFilter = filterType === 'departure' ? departureTimeFilter : arrivalTimeFilter;
    
    if (checked) {
      setFilter([...currentFilter, timeFilter]);
    } else {
      setFilter(currentFilter.filter(f => f !== timeFilter));
    }
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleStopsFilterChange = (stopsFilter: string, checked: boolean) => {
    if (checked) {
      setStopsFilter(prev => [...prev, stopsFilter]);
    } else {
      setStopsFilter(prev => prev.filter(f => f !== stopsFilter));
    }
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearAllFilters = () => {
    setPriceRange([0, 2000]);
    setDepartureTimeFilter([]);
    setArrivalTimeFilter([]);
    setStopsFilter([]);
    setCurrentPage(1);
  };

  const handleBookApiLFlight = async (flight: SkyscannerFlight) => {
    // Clean times before saving
    const cleanedDepartureTime = cleanTimeFormat(flight.departure.time);
    const cleanedArrivalTime = cleanTimeFormat(flight.arrival.time);
    
    // Save booking to database
    await bookFlight({
      flight_number: flight.flightNumber,
      airline: typeof flight.airline === 'string' ? flight.airline : flight.airline.name,
      departure_city: flight.departure.city || searchData.from,
      arrival_city: flight.arrival.city || searchData.destination,
      departure_date: flight.departure.date || searchData.departureDate,
      departure_time: cleanedDepartureTime,
      arrival_time: cleanedArrivalTime,
      price: flight.price,
      passenger_count: searchData.passengers
    });
    
    // Use the specific flight booking URL if available, otherwise fallback to search
    const bookingUrl = (() => {
      const fromAirport = flight.departure.airport;
      const toAirport = flight.arrival.airport;

      // Normalize provided bookingUrl (handle relative Skyscanner deeplinks)
      if (flight.bookingUrl) {
        const url = String(flight.bookingUrl);
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return `https://www.skyscanner.com${url}`;
        return `https://www.skyscanner.com${url.startsWith('.') ? url.slice(1) : url}`;
      }

      try {
        // Format date to YYYYMMDD
        const dateObj = new Date(searchData.departureDate);
        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        const formattedDate = `${year}${month}${day}`;
        const params = new URLSearchParams({
          adults: searchData.passengers.toString(),
          cabinclass: 'economy',
          rtn: '0'
        });
        return `https://www.skyscanner.com/transport/flights/${fromAirport}/${toAirport}/${formattedDate}/?${params.toString()}`;
      } catch (error) {
        return `https://www.skyscanner.com/transport/flights/${fromAirport}/${toAirport}/?adults=${searchData.passengers}&cabinclass=economy`;
      }
    })();

    console.log(`🔗 Opening Skyscanner booking for flight ${flight.flightNumber}:`, bookingUrl);
    window.open(bookingUrl, '_blank');
  };

  // Pagination logic - use filtered flights
  const filteredFlights = getFilteredFlights();
  const totalFlights = filteredFlights.length;
  const totalPages = Math.ceil(totalFlights / flightsPerPage);
  const startIndex = (currentPage - 1) * flightsPerPage;
  const endIndex = startIndex + flightsPerPage;
  const currentFlights = filteredFlights.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => {
                      setPriceRange(value);
                      setCurrentPage(1);
                    }}
                    max={2000}
                    min={0}
                    step={50}
                    className="w-full"
                  />
                </div>

                {/* Departure Time Filter */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Departure Time</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'before-6am', label: 'Before 6 AM' },
                      { value: '6am-12pm', label: '6 AM - 12 PM' },
                      { value: '12pm-6pm', label: '12 PM - 6 PM' },
                      { value: '6pm-12am', label: '6 PM - 12 AM' }
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={departureTimeFilter.includes(value)}
                          onChange={(e) => handleTimeFilterChange(value, 'departure', e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Arrival Time Filter */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Arrival Time</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'before-6am', label: 'Before 6 AM' },
                      { value: '6am-12pm', label: '6 AM - 12 PM' },
                      { value: '12pm-6pm', label: '12 PM - 6 PM' },
                      { value: '6pm-12am', label: '6 PM - 12 AM' }
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={arrivalTimeFilter.includes(value)}
                          onChange={(e) => handleTimeFilterChange(value, 'arrival', e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stops Filter */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Stops</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'non-stop', label: 'Non-stop' },
                      { value: '1-stop', label: '1 Stop' },
                      { value: '2-plus-stops', label: '2+ Stops' }
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stopsFilter.includes(value)}
                          onChange={(e) => handleStopsFilterChange(value, e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {totalFlights} flight{totalFlights !== 1 ? 's' : ''} found
                {apiFlights.length !== totalFlights && (
                  <span className="text-xs ml-1">({apiFlights.length - totalFlights} filtered out)</span>
                )}
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
              {/* Flight Results */}
              {currentFlights.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">
                      Flight Results ({totalFlights} flights found)
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(endIndex, totalFlights)} of {totalFlights} flights
                    </p>
                  </div>
                  <div className="space-y-4">
                    {currentFlights.map((flight, index) => (
                      <div key={startIndex + index} className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-all duration-200">
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
                            <div className="text-lg font-semibold text-foreground">{cleanTimeFormat(flight.departure.time)}</div>
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
                            <div className="text-lg font-semibold text-foreground">{cleanTimeFormat(flight.arrival.time)}</div>
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
                            Book this flight directly on Skyscanner
                          </p>
                        </div>
                      </div>
                     ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-4 mt-8">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="flex items-center space-x-1 px-3 py-2 border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border hover:bg-muted'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center space-x-1 px-3 py-2 border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {apiError && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-yellow-800 text-sm">{apiError}</p>
                    </div>
                  )}
                </div>
              )}

              {totalFlights === 0 && apiFlights.length > 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                    <Plane className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No flights match your filters</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Try adjusting your filter criteria to see more results.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {totalFlights === 0 && apiFlights.length === 0 && !loading && (
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