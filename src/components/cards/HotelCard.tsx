import React from 'react';
import { Star, MapPin, Wifi, Car } from 'lucide-react';
import { Hotel } from '../../types';
import { formatPrice } from '../../utils/validation';
import Button from '../ui/Button';

interface HotelCardProps {
  hotel: Hotel;
  onBook: (hotel: Hotel) => void;
}

export default function HotelCard({ hotel, onBook }: HotelCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-border">
      <div className="relative">
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full text-sm font-semibold">
          {formatPrice(hotel.pricePerNight)}/night
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-foreground">{hotel.name}</h3>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{hotel.rating}</span>
            <span className="text-sm text-muted-foreground">({hotel.reviewCount})</span>
          </div>
        </div>
        
        <div className="flex items-center text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{hotel.location}</span>
        </div>
        
        <p className="text-muted-foreground mb-4 text-sm">{hotel.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {hotel.amenities.slice(0, 4).map((amenity, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800"
            >
              {amenity === 'Free WiFi' && <Wifi className="w-3 h-3 mr-1" />}
              {amenity}
            </span>
          ))}
          {hotel.amenities.length > 4 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              +{hotel.amenities.length - 4} more
            </span>
          )}
        </div>
        
        <Button
          onClick={() => onBook(hotel)}
          className="w-full"
          size="lg"
        >
          Book Now
        </Button>
      </div>
    </div>
  );
}