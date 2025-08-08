import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import Input from '../ui/input';
import Button from '../ui/Button';
import { searchCities } from '../../data/cities';

interface SearchFormProps {
  className?: string;
}

export default function SearchForm({ className = '' }: SearchFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    from: '',
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    rooms: 1
  });
  const [showFromDestinations, setShowFromDestinations] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'guests' || name === 'rooms' ? parseInt(value) : value
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
    if (!formData.destination || !formData.checkIn || !formData.checkOut) {
      return;
    }
    
    const searchParams = new URLSearchParams({
      from: formData.from,
      destination: formData.destination,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      guests: formData.guests.toString(),
      rooms: formData.rooms.toString()
    });
    
    navigate(`/search?${searchParams.toString()}`);
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* From */}
        <div className="relative">
          <Input
            label="From"
            name="from"
            value={formData.from}
            onChange={handleInputChange}
            onFocus={() => setShowFromDestinations(true)}
            onBlur={() => setTimeout(() => setShowFromDestinations(false), 200)}
            placeholder="Departure city..."
            icon={<MapPin className="w-5 h-5 text-gray-400" />}
          />
          
          {showFromDestinations && (
            <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
              {searchCities(formData.from, 8).map((city, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleFromClick(city)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-gray-900 dark:text-gray-100"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Destination */}
        <div className="relative">
          <Input
            label="Where to?"
            name="destination"
            value={formData.destination}
            onChange={handleInputChange}
            onFocus={() => setShowDestinations(true)}
            onBlur={() => setTimeout(() => setShowDestinations(false), 200)}
            placeholder="Destination city..."
            icon={<MapPin className="w-5 h-5 text-gray-400" />}
            required
          />
          
          {showDestinations && (
            <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
              {searchCities(formData.destination, 8).map((city, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDestinationClick(city)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-gray-900 dark:text-gray-100"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Check-in */}
        <div>
          <Input
            label="Check-in"
            name="checkIn"
            type="date"
            value={formData.checkIn}
            onChange={handleInputChange}
            min={today}
            icon={<Calendar className="w-5 h-5 text-gray-400" />}
            required
          />
        </div>

        {/* Check-out */}
        <div>
          <Input
            label="Check-out"
            name="checkOut"
            type="date"
            value={formData.checkOut}
            onChange={handleInputChange}
            min={formData.checkIn || today}
            icon={<Calendar className="w-5 h-5 text-gray-400" />}
            required
          />
        </div>

        {/* Guests & Rooms */}
        <div className="space-y-4">
          <div>
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
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Button type="submit" size="lg" className="w-full md:w-auto">
          <Search className="w-5 h-5 mr-2" />
          Search
        </Button>
      </div>
    </form>
  );
}