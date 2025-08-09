import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, Plane } from 'lucide-react';
import Input from '../ui/input';
import Button from '../ui/Button';
import { SimpleDatePicker } from '../ui/simple-date-picker';
import { searchCities } from '../../data/cities';

interface FlightSearchPanelProps {
  className?: string;
}

export default function FlightSearchPanel({ className = '' }: FlightSearchPanelProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    from: '',
    destination: '',
    passengers: 1,
    tripType: 'round-trip'
  });
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [showFromDestinations, setShowFromDestinations] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'passengers' ? parseInt(value) : value
    }));
  };

  const handleFromClick = (from: string) => {
    setFormData(prev => ({ ...prev, from }));
    setShowFromDestinations(false);
  };

  const handleDestinationClick = (destination: string) => {
    setFormData(prev => ({ ...prev, destination }));
    setShowDestinations(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.from || !formData.destination || !departureDate) {
      return;
    }
    
    const searchParams = new URLSearchParams({
      type: 'flight',
      from: formData.from,
      destination: formData.destination,
      departureDate: departureDate.toISOString().split('T')[0],
      returnDate: returnDate ? returnDate.toISOString().split('T')[0] : '',
      passengers: formData.passengers.toString(),
      tripType: formData.tripType
    });
    
    navigate(`/search-flights?${searchParams.toString()}`);
  };

  

  return (
    <div className={`bg-card rounded-lg shadow-lg p-6 border border-border ${className}`}>
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-400 rounded-lg flex items-center justify-center mr-4">
          <Plane className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">Flights</h3>
          <p className="text-muted-foreground">Book your next flight</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Trip Type */}
        <div className="flex space-x-4 mb-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="tripType"
              value="round-trip"
              checked={formData.tripType === 'round-trip'}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-foreground">Round Trip</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="tripType"
              value="one-way"
              checked={formData.tripType === 'one-way'}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-foreground">One Way</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* From */}
          <div className="relative">
            <Input
              label="From"
              name="from"
              value={formData.from}
              onChange={handleInputChange}
              onFocus={() => setShowFromDestinations(true)}
              onBlur={() => setTimeout(() => setShowFromDestinations(false), 200)}
              placeholder="Departure city"
              icon={<MapPin className="w-5 h-5 text-gray-400" />}
              required
            />
            
            {showFromDestinations && (
              <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {searchCities(formData.from, 8).map((city, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleFromClick(city)}
                    className="w-full text-left px-4 py-2 hover:bg-muted border-b border-border last:border-b-0 text-foreground"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* To */}
          <div className="relative">
            <Input
              label="To"
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              onFocus={() => setShowDestinations(true)}
              onBlur={() => setTimeout(() => setShowDestinations(false), 200)}
              placeholder="Destination city"
              icon={<MapPin className="w-5 h-5 text-gray-400" />}
              required
            />
            
            {showDestinations && (
              <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {searchCities(formData.destination, 8).map((city, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDestinationClick(city)}
                    className="w-full text-left px-4 py-2 hover:bg-muted border-b border-border last:border-b-0 text-foreground"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Departure Date */}
          <SimpleDatePicker
            label="Departure"
            date={departureDate}
            onSelect={setDepartureDate}
            placeholder="Select departure date"
            required
          />

          {/* Return Date (only for round-trip) */}
          {formData.tripType === 'round-trip' && (
            <SimpleDatePicker
              label="Return"
              date={returnDate}
              onSelect={setReturnDate}
              placeholder="Select return date"
              disabled={!departureDate}
            />
          )}
        </div>

        {/* Passengers */}
        <Input
          label="Passengers"
          name="passengers"
          type="number"
          value={formData.passengers}
          onChange={handleInputChange}
          min="1"
          max="9"
          icon={<Users className="w-5 h-5 text-gray-400" />}
        />

        <Button type="submit" className="w-full">
          <Search className="w-5 h-5 mr-2" />
          Search Flights
        </Button>
      </form>
    </div>
  );
}