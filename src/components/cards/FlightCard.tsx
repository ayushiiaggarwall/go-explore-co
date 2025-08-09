import { Plane, Clock } from 'lucide-react';
import { Flight } from '../../types';
import { formatPrice } from '../../utils/validation';
import { useBookings } from '../../hooks/useBookings';
import Button from '../ui/Button';

interface FlightCardProps {
  flight: Flight;
  onBook?: (flight: Flight) => void;
}

export default function FlightCard({ flight, onBook }: FlightCardProps) {
  const { bookFlight } = useBookings();

  const handleBookFlight = async () => {
    if (onBook) {
      onBook(flight);
      return;
    }

    // Save booking to database
    await bookFlight({
      flight_number: flight.flightNumber,
      airline: typeof flight.airline === 'string' ? flight.airline : flight.airline.name,
      departure_city: flight.departure.city,
      arrival_city: flight.arrival.city,
      departure_date: flight.departure.date,
      departure_time: flight.departure.time,
      arrival_time: flight.arrival.time,
      price: flight.price,
      passenger_count: 1
    });

    // Redirect to Skyscanner with specific flight details
    if (flight.bookingUrl) {
      console.log(`🔗 Opening Skyscanner for flight ${flight.flightNumber}:`, flight.bookingUrl);
      window.open(flight.bookingUrl, '_blank');
    } else {
      // Build specific flight URL if no bookingUrl provided
      const airlineCode = typeof flight.airline === 'object' ? flight.airline.code : 'XX';
      const flightNumOnly = flight.flightNumber.replace(/[A-Z]/g, '');
      
      const params = new URLSearchParams({
        adults: '1',
        cabinclass: 'economy',
        rtn: '0',
        airlines: airlineCode,
        deptime: flight.departure.time.replace(':', ''),
        arrtime: flight.arrival.time.replace(':', ''),
        flightnum: flightNumOnly,
        stops: flight.stops.toString()
      });
      
      const specificUrl = `https://www.skyscanner.com/transport/flights/${flight.departure.airport}/${flight.arrival.airport}/${flight.departure.date.replace(/-/g, '')}/?${params.toString()}`;
      
      console.log(`🔗 Opening specific flight URL for ${flight.flightNumber}:`, specificUrl);
      window.open(specificUrl, '_blank');
    }
  };
  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-border">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            {typeof flight.airline === 'object' && flight.airline.logo ? (
              <img 
                src={flight.airline.logo} 
                alt={flight.airline.name}
                className="w-8 h-8 rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Plane className={`w-5 h-5 text-sky-500 ${typeof flight.airline === 'object' && flight.airline.logo ? 'hidden' : ''}`} />
            <div>
              <div className="font-semibold text-foreground">
                {typeof flight.airline === 'string' ? flight.airline : flight.airline.name}
              </div>
              <div className="text-sm text-muted-foreground">
                Flight {flight.flightNumber}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{formatPrice(flight.price)}</div>
            <div className="text-sm text-muted-foreground">per person</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold">{flight.departure.time}</div>
            <div className="text-sm text-muted-foreground">{flight.departure.city}</div>
            <div className="text-xs text-muted-foreground">{flight.departure.airport}</div>
          </div>
          
          <div className="flex-1 px-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="flex-1 h-px bg-border"></div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{flight.duration}</span>
              </div>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            {flight.stops > 0 && (
              <div className="text-center text-xs text-muted-foreground mt-1">
                {flight.stops} stop{flight.stops > 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold">{flight.arrival.time}</div>
            <div className="text-sm text-muted-foreground">{flight.arrival.city}</div>
            <div className="text-xs text-muted-foreground">{flight.arrival.airport}</div>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleBookFlight}
            className="w-full"
            size="lg"
          >
            {onBook ? 'Select Flight' : 'Book on Skyscanner'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Prices for comparison - book on Skyscanner for best rates
          </p>
        </div>
      </div>
    </div>
  );
}