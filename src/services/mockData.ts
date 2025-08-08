import { Hotel, Flight, Package } from '../types';

export const mockHotels: Hotel[] = [
  {
    id: '1',
    name: 'Grand Palace Hotel',
    image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800',
    location: 'Paris, France',
    rating: 4.8,
    reviewCount: 1205,
    pricePerNight: 320,
    amenities: ['Free WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Concierge'],
    description: 'Luxury hotel in the heart of Paris with stunning city views.'
  },
  {
    id: '2',
    name: 'Tokyo Imperial Suite',
    image: 'https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&cs=tinysrgb&w=800',
    location: 'Tokyo, Japan',
    rating: 4.9,
    reviewCount: 892,
    pricePerNight: 450,
    amenities: ['Free WiFi', 'Spa', 'Restaurant', 'Room Service', 'Business Center'],
    description: 'Modern luxury hotel with traditional Japanese elements.'
  },
  {
    id: '3',
    name: 'Bali Beach Resort',
    image: 'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=800',
    location: 'Bali, Indonesia',
    rating: 4.7,
    reviewCount: 658,
    pricePerNight: 180,
    amenities: ['Beach Access', 'Pool', 'Spa', 'Restaurant', 'Water Sports'],
    description: 'Tropical paradise resort with pristine beaches and luxury amenities.'
  },
  {
    id: '4',
    name: 'Manhattan Plaza Hotel',
    image: 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=800',
    location: 'New York, USA',
    rating: 4.6,
    reviewCount: 2134,
    pricePerNight: 280,
    amenities: ['Free WiFi', 'Gym', 'Restaurant', 'Bar', 'Concierge'],
    description: 'Iconic hotel in the heart of Manhattan with modern amenities.'
  }
];

export const mockFlights: Flight[] = [
  {
    id: '1',
    airline: 'Air France',
    departure: {
      airport: 'JFK',
      city: 'New York',
      time: '14:30',
      date: '2024-12-15'
    },
    arrival: {
      airport: 'CDG',
      city: 'Paris',
      time: '08:45+1',
      date: '2024-12-16'
    },
    duration: '7h 15m',
    price: 650,
    stops: 0
  },
  {
    id: '2',
    airline: 'Japan Airlines',
    departure: {
      airport: 'LAX',
      city: 'Los Angeles',
      time: '11:20',
      date: '2024-12-20'
    },
    arrival: {
      airport: 'NRT',
      city: 'Tokyo',
      time: '16:45+1',
      date: '2024-12-21'
    },
    duration: '11h 25m',
    price: 890,
    stops: 0
  },
  {
    id: '3',
    airline: 'Singapore Airlines',
    departure: {
      airport: 'SIN',
      city: 'Singapore',
      time: '09:15',
      date: '2024-12-18'
    },
    arrival: {
      airport: 'DPS',
      city: 'Bali',
      time: '11:30',
      date: '2024-12-18'
    },
    duration: '2h 15m',
    price: 320,
    stops: 0
  }
];

export const mockPackages: Package[] = [
  {
    id: '1',
    name: 'Romantic Paris Getaway',
    image: 'https://images.pexels.com/photos/161853/eiffel-tower-paris-france-tower-161853.jpeg?auto=compress&cs=tinysrgb&w=800',
    destination: 'Paris, France',
    duration: '5 Days, 4 Nights',
    price: 1299,
    originalPrice: 1599,
    rating: 4.8,
    includes: ['Round-trip flights', 'Luxury hotel', 'City tours', 'Seine river cruise'],
    description: 'Experience the romance of Paris with this all-inclusive package.'
  },
  {
    id: '2',
    name: 'Tokyo Adventure',
    image: 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=800',
    destination: 'Tokyo, Japan',
    duration: '7 Days, 6 Nights',
    price: 1899,
    originalPrice: 2299,
    rating: 4.9,
    includes: ['Round-trip flights', 'Traditional ryokan', 'Cultural tours', 'Bullet train pass'],
    description: 'Discover the perfect blend of modern and traditional Japan.'
  },
  {
    id: '3',
    name: 'Tropical Bali Escape',
    image: 'https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800',
    destination: 'Bali, Indonesia',
    duration: '6 Days, 5 Nights',
    price: 899,
    originalPrice: 1199,
    rating: 4.7,
    includes: ['Round-trip flights', 'Beach resort', 'Spa treatments', 'Island tours'],
    description: 'Relax and rejuvenate in tropical paradise.'
  }
];

export const popularDestinations = [
  'Paris, France',
  'Tokyo, Japan',
  'Bali, Indonesia',
  'New York, USA',
  'London, UK',
  'Rome, Italy',
  'Bangkok, Thailand',
  'Dubai, UAE',
  'Barcelona, Spain',
  'Amsterdam, Netherlands'
];