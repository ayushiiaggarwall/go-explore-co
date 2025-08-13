export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface SearchFilters {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
  priceRange: [number, number];
  starRating?: number;
  amenities?: string[];
}

export interface Hotel {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  amenities: string[];
  description: string;
}

export interface Flight {
  id: string;
  airline: string;
  departure: {
    airport: string;
    city: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
    date: string;
  };
  duration: string;
  price: number;
  stops: number;
}

export interface Package {
  id: string;
  name: string;
  image: string;
  destination: string;
  duration: string;
  price: number;
  originalPrice: number;
  rating: number;
  includes: string[];
  description: string;
}

export interface Booking {
  id: string;
  type: 'hotel' | 'flight' | 'package';
  item: Hotel | Flight | Package;
  guestInfo: {
    name: string;
    email: string;
    phone: string;
  };
  bookingDate: string;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  referenceNumber: string;
}