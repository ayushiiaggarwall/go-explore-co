import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users } from 'lucide-react';
import Input from '../ui/input';
import Button from '../ui/Button';
import { SimpleDatePicker } from '../ui/simple-date-picker';
import { searchCities } from '../../data/cities';

interface HotelSearchPanelProps {
  className?: string;
}

export default function HotelSearchPanel({ className = '' }: HotelSearchPanelProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    destination: '',
    guests: 2,
    rooms: 1
  });
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [showDestinations, setShowDestinations] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'guests' || name === 'rooms' ? parseInt(value) : value
    }));
  };

  const handleDestinationClick = (destination: string) => {
    setFormData(prev => ({ ...prev, destination }));
    setShowDestinations(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.destination || !checkInDate || !checkOutDate) {
      return;
    }
    
    const searchParams = new URLSearchParams({
      type: 'hotel',
      destination: formData.destination,
      checkIn: checkInDate.toISOString().split('T')[0],
      checkOut: checkOutDate.toISOString().split('T')[0],
      guests: formData.guests.toString(),
      rooms: formData.rooms.toString()
    });
    
    navigate(`/search?${searchParams.toString()}`);
  };

  

  return (
    <div className={`bg-card rounded-lg shadow-lg p-6 border border-border ${className}`}>
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-lg flex items-center justify-center mr-4">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">Hotels</h3>
          <p className="text-muted-foreground">Find your perfect accommodation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Destination */}
        <div className="relative">
          <Input
            label="Destination"
            name="destination"
            value={formData.destination}
            onChange={handleInputChange}
            onFocus={() => setShowDestinations(true)}
            onBlur={() => setTimeout(() => setShowDestinations(false), 200)}
            placeholder="Where are you going?"
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

        <div className="grid grid-cols-2 gap-4">
          {/* Check-in */}
          <SimpleDatePicker
            label="Check-in"
            date={checkInDate}
            onSelect={setCheckInDate}
            placeholder="Select check-in date"
            required
          />

          {/* Check-out */}
          <SimpleDatePicker
            label="Check-out"
            date={checkOutDate}
            onSelect={setCheckOutDate}
            placeholder="Select check-out date"
            disabled={!checkInDate}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Guests */}
          <Input
            label="Guests"
            name="guests"
            type="number"
            value={formData.guests}
            onChange={handleInputChange}
            min="1"
            max="10"
            icon={<Users className="w-5 h-5 text-gray-400" />}
          />

          {/* Rooms */}
          <Input
            label="Rooms"
            name="rooms"
            type="number"
            value={formData.rooms}
            onChange={handleInputChange}
            min="1"
            max="5"
          />
        </div>

        <Button type="submit" className="w-full">
          <Search className="w-5 h-5 mr-2" />
          Search Hotels
        </Button>
      </form>
    </div>
  );
}