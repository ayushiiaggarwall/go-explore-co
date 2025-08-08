import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { mockHotels, mockFlights, mockPackages } from '../services/mockData';
import { tripAdvisorApi, TripAdvisorHotel } from '../services/tripAdvisorApi';
import { skyscannerApi, SkyscannerFlight } from '../services/skyscannerApi';
import { Hotel, Flight, Package } from '../types';
import HotelCard from '../components/cards/HotelCard';
import FlightCard from '../components/cards/FlightCard';
import PackageCard from '../components/cards/PackageCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/input';

type SearchType = 'hotels' | 'flights' | 'packages';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState<SearchType>('hotels');
  const [showFilters, setShowFilters] = useState(false);
  const [apiHotels, setApiHotels] = useState<TripAdvisorHotel[]>([]);
  const [apiFlights, setApiFlights] = useState<SkyscannerFlight[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [flightError, setFlightError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    priceRange: [0, 1000] as [number, number],
    starRating: 0,
    sortBy: 'price'
  });

  const from = searchParams.get('from') || '';
  const destination = searchParams.get('destination') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests') || '2');

  useEffect(() => {
    const searchData = async () => {
      if (!destination) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setApiError(null);
      setFlightError(null);

      // Run both searches simultaneously using Promise.allSettled
      const searchPromises = [];

      // Always search hotels
      searchPromises.push(
        tripAdvisorApi.searchHotels(destination, 20)
          .then(results => ({ type: 'hotels', data: results }))
          .catch(error => ({ type: 'hotels', error }))
      );

      // Search flights if we have dates and both from/to locations
      if (checkIn && checkOut && from && destination) {
        console.log('🛫 Flight Search Parameters:', { from, destination, checkIn, checkOut, guests });
        searchPromises.push(
          skyscannerApi.searchFlights(from, destination, checkIn, checkOut, guests)
            .then(results => ({ type: 'flights', data: results }))
            .catch(error => ({ type: 'flights', error }))
        );
      } else {
        console.log('⚠️ Flight search skipped - missing parameters:', { from, destination, checkIn, checkOut });
      }

      console.log(`🚀 Starting ${searchPromises.length} simultaneous API searches...`);
      
      // Execute all searches simultaneously
      const results = await Promise.allSettled(searchPromises);

      // Process results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { value } = result;
          if (value.type === 'hotels') {
            if (value.data) {
              console.log('✅ Hotel API Results received:', value.data);
              setApiHotels(value.data);
            } else if (value.error) {
              console.error('❌ Error fetching hotels:', value.error);
              setApiError(`Failed to fetch hotels from TripAdvisor: ${value.error instanceof Error ? value.error.message : 'Unknown error'}`);
            }
          } else if (value.type === 'flights') {
            if (value.data) {
              console.log('✅ Flight API Results received:', value.data);
              setApiFlights(value.data);
            } else if (value.error) {
              console.error('❌ Error fetching flights:', value.error);
              setFlightError(`Failed to fetch flights from Skyscanner: ${value.error instanceof Error ? value.error.message : 'Unknown error'}`);
            }
          }
        } else {
          console.error('❌ Promise rejected:', result.reason);
        }
      });

      setLoading(false);
    };

    searchData();
  }, [from, destination, checkIn, checkOut, guests]);

  const handleBookHotel = (hotel: Hotel) => {
    navigate('/booking', { 
      state: { 
        type: 'hotel', 
        item: hotel, 
        searchParams: {
          destination,
          checkIn,
          checkOut,
          guests
        }
      }
    });
  };

  const handleBookFlight = (flight: Flight) => {
    navigate('/booking', { 
      state: { 
        type: 'flight', 
        item: flight, 
        searchParams: {
          destination,
          checkIn,
          checkOut,
          guests
        }
      }
    });
  };

  const handleBookPackage = (pkg: Package) => {
    navigate('/booking', { 
      state: { 
        type: 'package', 
        item: pkg, 
        searchParams: {
          destination,
          checkIn,
          checkOut,
          guests
        }
      }
    });
  };

  // Convert TripAdvisor hotels to our Hotel interface format
  const convertApiHotelsToHotels = (apiHotels: TripAdvisorHotel[]): Hotel[] => {
    return apiHotels.map((hotel, index) => ({
      id: `ta-${index}`,
      name: hotel.name,
      image: hotel.image || 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800',
      location: hotel.location || destination,
      rating: hotel.rating || 0,
      reviewCount: hotel.numberOfReviews || 0,
      pricePerNight: hotel.priceFrom || 100,
      amenities: hotel.amenities || ['Free WiFi'],
      description: `Experience comfort and luxury at ${hotel.name}`
    }));
  };

  // Convert Skyscanner flights to our Flight interface format
  const convertApiFlightsToFlights = (apiFlights: SkyscannerFlight[]): Flight[] => {
    return apiFlights.map((flight, index) => ({
      id: `sky-${index}`,
      airline: flight.airline,
      departure: {
        airport: flight.departure.airport,
        city: flight.departure.city || destination.split(',')[0],
        time: flight.departure.time,
        date: flight.departure.date || checkIn
      },
      arrival: {
        airport: flight.arrival.airport,
        city: flight.arrival.city || 'New York',
        time: flight.arrival.time,
        date: flight.arrival.date || checkIn
      },
      duration: flight.duration,
      price: flight.price,
      stops: flight.stops
    }));
  };

  // Use API data if available and no error, otherwise fallback to mock data
  const hotelsToDisplay = (apiHotels.length > 0 && !apiError) 
    ? convertApiHotelsToHotels(apiHotels) 
    : mockHotels;

  const flightsToDisplay = (apiFlights.length > 0 && !flightError)
    ? convertApiFlightsToFlights(apiFlights)
    : mockFlights;

  const filteredHotels = hotelsToDisplay.filter(hotel => 
    hotel.pricePerNight >= filters.priceRange[0] && 
    hotel.pricePerNight <= filters.priceRange[1] &&
    (filters.starRating === 0 || hotel.rating >= filters.starRating)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Searching for the best options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Results Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Search Results</h1>
          <p className="text-muted-foreground">
            {from && `From: ${from}`}
            {destination && ` ${from ? '→' : 'Destination:'} ${destination}`}
            {checkIn && ` • Check-in: ${new Date(checkIn).toLocaleDateString()}`}
            {checkOut && ` • Check-out: ${new Date(checkOut).toLocaleDateString()}`}
            {` • ${guests} guest${guests > 1 ? 's' : ''}`}
          </p>
          
          {/* API Status Indicators */}
          {searchType === 'hotels' && (
            <div className="mt-3">
              {apiError ? (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Using sample data - {apiError}
                </div>
              ) : apiHotels.length > 0 ? (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Live data from TripAdvisor
                </div>
              ) : (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Using sample data
                </div>
              )}
            </div>
          )}
          
          {searchType === 'flights' && (
            <div className="mt-3">
              {flightError ? (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Using sample data - {flightError}
                </div>
              ) : apiFlights.length > 0 ? (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Realistic flight data generated
                </div>
              ) : (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {(!from || !destination) ? 'Add departure and destination cities' : 
                   (!checkIn || !checkOut) ? 'Add travel dates to search flights' : 'Using sample data'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Type Tabs */}
        <div className="flex space-x-1 bg-card p-1 rounded-lg shadow-sm mb-6 border border-border">
          <button
            onClick={() => setSearchType('hotels')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              searchType === 'hotels'
                ? 'bg-sky-500 text-white'
                : 'text-foreground hover:text-sky-600'
            }`}
          >
            Hotels ({filteredHotels.length})
          </button>
          <button
            onClick={() => setSearchType('flights')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              searchType === 'flights'
                ? 'bg-sky-500 text-white'
                : 'text-foreground hover:text-sky-600'
            }`}
          >
            Flights ({flightsToDisplay.length})
          </button>
          <button
            onClick={() => setSearchType('packages')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              searchType === 'packages'
                ? 'bg-sky-500 text-white'
                : 'text-foreground hover:text-sky-600'
            }`}
          >
            Packages ({mockPackages.length})
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64">
            <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Filters</h3>
                <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
              </div>
              
              {searchType === 'hotels' && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Price Range (per night)
                    </label>
                    <div className="space-y-2">
                      <Input
                        type="range"
                        min="0"
                        max="1000"
                        value={filters.priceRange[1]}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          priceRange: [0, parseInt(e.target.value)]
                        }))}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>$0</span>
                        <span>${filters.priceRange[1]}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Star Rating
                    </label>
                    <select
                      value={filters.starRating}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        starRating: parseFloat(e.target.value)
                      }))}
                      className="w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-sky-500 focus:ring-sky-500"
                    >
                      <option value={0}>Any Rating</option>
                      <option value={3}>3+ Stars</option>
                      <option value={4}>4+ Stars</option>
                      <option value={4.5}>4.5+ Stars</option>
                    </select>
                  </div>
                </>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    sortBy: e.target.value
                  }))}
                  className="w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-sky-500 focus:ring-sky-500"
                >
                  <option value="price">Price (Low to High)</option>
                  <option value="rating">Rating (High to Low)</option>
                  <option value="name">Name (A to Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {searchType === 'hotels' && filteredHotels.map(hotel => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  onBook={handleBookHotel}
                />
              ))}
              
              {searchType === 'flights' && flightsToDisplay.map(flight => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  onBook={handleBookFlight}
                />
              ))}
              
              {searchType === 'packages' && mockPackages.map(pkg => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  onBook={handleBookPackage}
                />
              ))}
            </div>
            
            {((searchType === 'hotels' && filteredHotels.length === 0) || 
              (searchType === 'flights' && flightsToDisplay.length === 0) || 
              (searchType === 'packages' && mockPackages.length === 0)) && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No results found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}